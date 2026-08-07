-- ControlCRM — Barbearia · schema Postgres (Neon)
--
-- Idempotente: `npm run db:migrate` pode rodar quantas vezes quiser e nunca
-- apaga dados. Para recriar do zero use `npm run db:reset` (destrutivo).
--
-- Dois princípios que atravessam o schema:
--
--   1. Todo registro pertence a um `barbeiro_id` (o dono da conta). Toda
--      consulta filtra por ele usando o id do cookie de sessão, nunca um id
--      vindo do navegador. É o que separa uma barbearia da outra.
--
--   2. Dinheiro que já aconteceu é fato consumado, não consulta. Visitas e
--      agendamentos congelam valor, percentual de comissão, duração e os nomes
--      envolvidos. Reajustar um preço hoje não pode reescrever o mês passado.

create extension if not exists pgcrypto;
create extension if not exists btree_gist;

-- ── Contas ────────────────────────────────────────────────────────────────────

-- Quem assinou o sistema: uma linha por barbearia.
create table if not exists barbeiros (
  id          uuid primary key default gen_random_uuid(),
  nome        text        not null,
  barbearia   text        not null,
  email       text        not null,
  whatsapp    text        not null default '',
  senha_hash  text        not null,
  criado_em   timestamptz not null default now()
);

create unique index if not exists barbeiros_email_uk on barbeiros (lower(email));

-- Cadastro é fechado: só cria conta quem tem um código válido e não usado.
create table if not exists convites (
  id         uuid primary key default gen_random_uuid(),
  codigo     text        not null,
  observacao text        not null default '',
  criado_em  timestamptz not null default now(),
  usado_em   timestamptz,
  usado_por  uuid        references barbeiros(id) on delete set null
);

create unique index if not exists convites_codigo_uk on convites (upper(codigo));

-- ── Catálogo da barbearia ─────────────────────────────────────────────────────

-- Barbeiros que trabalham na barbearia. Não têm login: quem acessa o sistema é
-- o dono da conta. `ativo` em vez de remoção, para não perder o histórico de
-- quem já saiu da equipe.
create table if not exists equipe (
  id          uuid primary key default gen_random_uuid(),
  barbeiro_id uuid        not null references barbeiros(id) on delete cascade,
  nome        text        not null,
  ativo       boolean     not null default true,
  criado_em   timestamptz not null default now()
);

create index if not exists equipe_barbeiro_idx on equipe (barbeiro_id, ativo, nome);

create table if not exists servicos (
  id           uuid primary key default gen_random_uuid(),
  barbeiro_id  uuid          not null references barbeiros(id) on delete cascade,
  nome         text          not null,
  duracao_min  integer       not null default 30 check (duracao_min > 0 and duracao_min <= 480),
  preco        numeric(10,2) not null default 0 check (preco >= 0),
  comissao_pct numeric(5,2)  not null default 40 check (comissao_pct >= 0 and comissao_pct <= 100),
  ativo        boolean       not null default true,
  criado_em    timestamptz   not null default now()
);

create index if not exists servicos_barbeiro_idx on servicos (barbeiro_id, ativo, nome);

create table if not exists produtos (
  id          uuid primary key default gen_random_uuid(),
  barbeiro_id uuid          not null references barbeiros(id) on delete cascade,
  nome        text          not null,
  preco       numeric(10,2) not null default 0 check (preco >= 0),
  quantidade  integer       not null default 0 check (quantidade >= 0),
  minimo      integer       not null default 0 check (minimo >= 0),
  criado_em   timestamptz   not null default now()
);

create index if not exists produtos_barbeiro_idx on produtos (barbeiro_id, nome);

-- ── Clientes ──────────────────────────────────────────────────────────────────

-- `codigo_acesso` é a senha do cliente na área pública.
--
-- Existe porque não há canal de verificação (WhatsApp/SMS) no projeto: sem ele,
-- o telefone seria a única credencial, e quem soubesse o número entraria como o
-- cliente. Como o barbeiro cadastra cada cliente à mão, o código nasce junto com
-- a ficha e é entregue pessoalmente — a prova de posse acontece no balcão, não
-- por mensagem.
--
-- Não é hash: é um código curto, descartável e visível ao barbeiro na ficha (ele
-- precisa poder ler para ditar). O que ele protege é o histórico do cliente, e o
-- custo de trocá-lo é zero. Se um dia guardar algo mais sensível, vira hash.
create table if not exists clientes (
  id            uuid primary key default gen_random_uuid(),
  barbeiro_id   uuid        not null references barbeiros(id) on delete cascade,
  nome          text        not null,
  telefone      text        not null default '',
  tipo          text        not null default 'avulso' check (tipo in ('assinante', 'avulso')),
  obs           text        not null default '',
  equipe_pref   uuid        references equipe(id) on delete set null,
  codigo_acesso text        not null default '',
  criado_em     timestamptz not null default now()
);

create index if not exists clientes_barbeiro_idx on clientes (barbeiro_id, nome);

-- ── Atendimentos ──────────────────────────────────────────────────────────────

-- Visitas = atendimentos concluídos. É o livro-caixa: alimenta o histórico da
-- ficha, o faturamento e as comissões. Nasce da baixa de pagamento na agenda,
-- do "atender" na fila, ou de registro manual na ficha.
--
-- Os campos *_nome são cópias do momento do atendimento, e os *_id apontam para
-- o cadastro atual. Apagar um cliente, serviço ou barbeiro anula o id mas
-- preserva o nome — e, principalmente, preserva o dinheiro no caixa.
create table if not exists visitas (
  id           uuid primary key default gen_random_uuid(),
  barbeiro_id  uuid          not null references barbeiros(id) on delete cascade,

  cliente_id   uuid          references clientes(id) on delete set null,
  cliente_nome text          not null,
  servico_id   uuid          references servicos(id) on delete set null,
  servico_nome text          not null,
  equipe_id    uuid          references equipe(id) on delete set null,
  equipe_nome  text          not null default '',

  data         date          not null default (now() at time zone 'America/Sao_Paulo')::date,
  valor        numeric(10,2) not null default 0,
  comissao_pct numeric(5,2)  not null default 0,

  origem       text          not null default 'manual' check (origem in ('manual', 'agenda', 'fila')),
  criado_em    timestamptz   not null default now()
);

create index if not exists visitas_barbeiro_idx on visitas (barbeiro_id, data desc);
create index if not exists visitas_cliente_idx  on visitas (cliente_id, data desc);
create index if not exists visitas_equipe_idx   on visitas (equipe_id, data desc);

-- Agendamentos ocupam um intervalo, não um instante: `periodo` é derivado de
-- data + hora_inicio + duracao_min. A restrição de exclusão impede, no próprio
-- banco, que dois atendimentos não cancelados se sobreponham para o mesmo
-- barbeiro — inclusive quando duas pessoas marcam ao mesmo tempo.
create table if not exists agendamentos (
  id           uuid primary key default gen_random_uuid(),
  barbeiro_id  uuid          not null references barbeiros(id) on delete cascade,

  cliente_id   uuid          references clientes(id) on delete set null,
  cliente_nome text          not null,
  servico_id   uuid          references servicos(id) on delete set null,
  servico_nome text          not null,
  equipe_id    uuid          references equipe(id) on delete set null,
  equipe_nome  text          not null default '',

  data         date          not null,
  hora_inicio  time          not null,
  duracao_min  integer       not null default 30 check (duracao_min > 0 and duracao_min <= 480),
  valor        numeric(10,2) not null default 0,
  comissao_pct numeric(5,2)  not null default 0,

  status       text          not null default 'Confirmado' check (status in ('Confirmado', 'Pago', 'Cancelado')),
  criado_em    timestamptz   not null default now(),

  periodo      tsrange generated always as (
                 tsrange(
                   (data + hora_inicio),
                   (data + hora_inicio) + make_interval(mins => duracao_min),
                   '[)'
                 )
               ) stored
);

create index if not exists agendamentos_barbeiro_idx on agendamentos (barbeiro_id, data, hora_inicio);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'agendamentos_sem_sobreposicao') then
    alter table agendamentos add constraint agendamentos_sem_sobreposicao
      exclude using gist (equipe_id with =, periodo with &&)
      where (status <> 'Cancelado' and equipe_id is not null);
  end if;
end $$;

create table if not exists fila_espera (
  id           uuid primary key default gen_random_uuid(),
  barbeiro_id  uuid        not null references barbeiros(id) on delete cascade,
  cliente_id   uuid        references clientes(id) on delete set null,
  nome         text        not null,
  servico_id   uuid        references servicos(id) on delete set null,
  servico_nome text        not null,
  equipe_id    uuid        references equipe(id) on delete set null,
  tipo         text        not null default 'avulso' check (tipo in ('assinante', 'avulso')),
  entrou_em    timestamptz not null default now()
);

create index if not exists fila_barbeiro_idx on fila_espera (barbeiro_id, entrou_em);

-- ── Assinaturas (clube do cliente) ────────────────────────────────────────────
-- O sistema registra quem vence quando; a cobrança acontece fora dele. Dar
-- baixa no pagamento empurra `vencimento` para o mês seguinte. "Vencida" não é
-- status gravado: é vencimento < hoje, para não depender de rotina diária.

create table if not exists planos (
  id          uuid primary key default gen_random_uuid(),
  barbeiro_id uuid          not null references barbeiros(id) on delete cascade,
  nome        text          not null,
  preco       numeric(10,2) not null default 0 check (preco >= 0),
  incluidos   text[]        not null default '{}',
  ativo       boolean       not null default true,
  criado_em   timestamptz   not null default now()
);

create index if not exists planos_barbeiro_idx on planos (barbeiro_id, ativo);

create table if not exists assinaturas (
  id          uuid primary key default gen_random_uuid(),
  barbeiro_id uuid        not null references barbeiros(id) on delete cascade,
  cliente_id  uuid        not null references clientes(id) on delete cascade,
  plano_id    uuid        not null references planos(id) on delete cascade,
  inicio      date        not null default (now() at time zone 'America/Sao_Paulo')::date,
  vencimento  date        not null,
  status      text        not null default 'ativa' check (status in ('ativa', 'cancelada')),
  criado_em   timestamptz not null default now()
);

-- Um cliente não pode ter duas assinaturas ativas ao mesmo tempo.
create unique index if not exists assinaturas_cliente_ativa_uk
  on assinaturas (cliente_id) where (status = 'ativa');

create index if not exists assinaturas_barbeiro_idx on assinaturas (barbeiro_id, vencimento);

-- ── Despesas ──────────────────────────────────────────────────────────────────

create table if not exists despesas (
  id          uuid primary key default gen_random_uuid(),
  barbeiro_id uuid          not null references barbeiros(id) on delete cascade,
  descricao   text          not null,
  valor       numeric(10,2) not null default 0 check (valor >= 0),
  data        date          not null default (now() at time zone 'America/Sao_Paulo')::date,
  status      text          not null default 'Pago' check (status in ('Pago', 'Pendente')),
  criado_em   timestamptz   not null default now()
);

create index if not exists despesas_barbeiro_idx on despesas (barbeiro_id, data desc);

-- ── Área do Cliente (Pública) ──────────────────────────────────────────────────

create table if not exists favoritos (
  id          uuid primary key default gen_random_uuid(),
  cliente_id  uuid not null references clientes(id) on delete cascade,
  barbeiro_id uuid not null references barbeiros(id) on delete cascade,
  criado_em   timestamptz not null default now(),
  unique(cliente_id, barbeiro_id)
);

create table if not exists avaliacoes (
  id          uuid primary key default gen_random_uuid(),
  cliente_id  uuid not null references clientes(id) on delete cascade,
  barbeiro_id uuid not null references barbeiros(id) on delete cascade,
  nota        integer not null check (nota >= 1 and nota <= 5),
  texto       text not null default '',
  criado_em   timestamptz not null default now()
);

create index if not exists avaliacoes_barbeiro_idx on avaliacoes (barbeiro_id, criado_em desc);

-- ── Ajustes incrementais ──────────────────────────────────────────────────────
--
-- `create table if not exists` não mexe em tabela que já existe: bancos criados
-- antes destas colunas precisam do ALTER. Tudo aqui é idempotente e roda depois
-- das tabelas, na mesma passada do `npm run db:migrate`.

-- Código de acesso do cliente à área pública (ver comentário em `clientes`).
alter table clientes add column if not exists codigo_acesso text not null default '';

-- Fichas antigas nasceram sem código. Gera um para cada uma, no mesmo alfabeto
-- sem ambiguidade usado pelo servidor (server/codigoAcesso.js): sem O/0/I/1.
update clientes
   set codigo_acesso = (
     select string_agg(
       substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789',
              1 + floor(random() * 32)::int, 1), '')
     from generate_series(1, 6)
   )
 where codigo_acesso = '';

-- Login público: telefone só com dígitos + código.
create index if not exists clientes_acesso_idx
  on clientes (regexp_replace(telefone, '\D', '', 'g'), codigo_acesso);

-- Uma avaliação por cliente em cada barbearia. Sem isto, a mesma pessoa
-- reavalia em laço e move a média pública da barbearia sozinha.
-- Duplicatas anteriores: mantém a mais recente e apaga o resto.
delete from avaliacoes a
 using avaliacoes b
 where a.cliente_id = b.cliente_id
   and a.barbeiro_id = b.barbeiro_id
   and (a.criado_em, a.id) < (b.criado_em, b.id);

create unique index if not exists avaliacoes_cliente_barbeiro_uk
  on avaliacoes (cliente_id, barbeiro_id);

