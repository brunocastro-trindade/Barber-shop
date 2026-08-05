# Entrega para o backend — ControlCRM Barbearia

Documento de passagem de bastão. O front-end está construído e navegável; o que
falta é ligá-lo ao banco. Aqui está o que existe, o que falta e em que ordem
atacar.

Referência endpoint a endpoint: [`API-CONTRATO.md`](./API-CONTRATO.md).

---

## 1. O que é o projeto

Dois produtos no mesmo repositório, servidos pela mesma origem:

| Produto | Quem usa | Onde mora | Rota |
|---|---|---|---|
| **Painel** | Dono da barbearia | `src/App.jsx` | `/` |
| **Área do cliente** | Quem vai cortar o cabelo | `src/cliente/` | `/cliente` |

O painel é desktop-first e exige login (cookie de sessão). A área do cliente é
mobile-first, pública, e identifica a pessoa **só pelo telefone**.

Stack: React 19 + Vite no front; Express 5 + Postgres (Neon) no back.

---

## 2. Como rodar

```bash
cp .env.example .env.local   # preencha DATABASE_URL e JWT_SECRET
npm install
npm run db:migrate           # idempotente, nunca apaga dados
npm run convite -- "Barbearia de teste"   # o cadastro é fechado, gera um código
npm run dev                  # sobe API (3001) e front (5173) juntos
```

`npm run db:reset` recria o schema do zero (**destrutivo**).

O Vite faz proxy de `/api/*` para a API na 3001, então o cookie de sessão viaja
sem CORS. Em produção, `server/index.js` serve o `dist/` e a API na mesma porta,
com fallback de SPA já configurado (`/cliente` funciona no refresh).

---

## 3. A camada de demonstração — só a área do cliente

**O painel não usa mais a demo.** Ele fala exclusivamente com a API real, que já
persiste tudo no banco. Foram removidos: a fachada `combinar()`, a flag
`cc_demo`, o login de demonstração e os botões que levavam a ele.

O que sobrou de `src/lib/demo.js` atende **apenas** `api.publico.*`:

```
src/lib/api.js        → cliente HTTP; só o grupo `publico` tem queda para demo
src/lib/demo.js       → dados de exemplo da área do cliente (localStorage)
src/lib/barbearias.js → catálogo fixo de barbearias (só para a área do cliente)
```

A regra que resta: **`api.publico.*` tenta a API real e, se o servidor não
responder (status 0 ou 5xx), cai na demo.** Isso existe porque o cliente da
barbearia não tem como "ligar o modo demo" — ou funciona, ou nada feito.

Consequência prática: **enquanto as rotas `/api/publico/*` não existirem, a área
do cliente continua funcionando com dados falsos e ninguém percebe.** Ao
implementar as rotas de verdade, ela passa a usar o servidor sozinha.

### Como desligar o que sobrou

1. Remover o `comQuedaParaDemo(...)` que envolve o grupo `publico` em
   `src/lib/api.js` (deixando as chamadas diretas).
2. Apagar `src/lib/demo.js`.
3. `src/lib/barbearias.js` vira dado de banco (ver §6).

Sugestão: fazer isso por grupo, à medida que cada conjunto de rotas fica pronto,
em vez de tudo no fim.

---

## 4. Estado atual, sem maquiagem

### 4.1 Backend

| Área | Rotas | Situação |
|---|---|---|
| Autenticação | `/api/auth/*` | ✅ pronto |
| Clientes + visitas | `/api/clientes/*` | ✅ pronto |
| Agenda | `/api/agendamentos/*` | ✅ pronto |
| Fila de espera | `/api/fila/*` | ✅ pronto |
| Visitas / financeiro | `/api/visitas/*` | ✅ pronto |
| Dashboard | `/api/dashboard` | ✅ pronto |
| Assinaturas | `/api/assinaturas/*` | ✅ pronto |
| Catálogo (equipe, serviços, produtos, despesas, planos) | CRUD genérico | ✅ pronto e **em uso pelo front** |
| **Área do cliente** | `/api/publico/*` | ❌ **não existe** |

### 4.2 Frontend

| Tela | Origem dos dados |
|---|---|
| Painel inteiro (Visão geral, Agenda, Fila, Fichas, Financeiro, Serviços, Estoque, Equipe, Assinaturas) | **API real** |
| Área do cliente inteira | **demo**, porque as rotas não existem |

O painel deixou de ter modo demonstração. Todas as suas telas persistem no banco.

---

## 5. Divergências de contrato — **resolvidas**

O front do painel tinha sido escrito contra os formatos da demo (nomes soltos),
mais simples que os do servidor. Foi adaptado ao servidor, não o contrário: é o
servidor que está certo, porque congela ids e cópias de nome/preço/comissão, e é
isso que preserva o histórico financeiro.

Hoje o painel fala o contrato do servidor em toda a extensão:

| Conceito | Contrato em uso |
|---|---|
| Nome do serviço / barbeiro | `servico_nome`, `equipe_nome` |
| Hora do agendamento | `hora_inicio` (+ `duracao_min`) |
| Barbeiro preferido | `equipe_pref` (uuid) / `equipe_pref_nome` |
| Envio em agendamentos, fila e visitas | `servico_id`, `equipe_id` — **nunca nomes** |

Todo `<select>` de catálogo é montado pelo helper `opcoes()` em `src/App.jsx`,
que usa **sempre o id como valor**. É o que impede a volta do casamento por nome
— que já causou dois "Carlos" recebendo a comissão um do outro.

O servidor ignora `valor` vindo do cliente de propósito: preço e comissão saem
do catálogo e são congelados no registro. **Manter esse comportamento.** A única
exceção é a visita manual na ficha, onde um `valor` explícito significa "hoje
cobrei diferente"; em branco, herda o preço de tabela.

### 5.1 O catálogo saiu da memória

Serviços, Estoque, Equipe, Assinaturas/Planos e Despesas passaram a consumir os
CRUDs que já existiam (`/api/equipe`, `/api/servicos`, `/api/produtos`,
`/api/despesas`, `/api/planos`, `/api/assinaturas`). O objeto `N` no topo de
`src/App.jsx` guarda só marca e cor.

Nessas telas, **desativar** preserva o histórico e tira o registro das listas de
escolha; **remover** é para engano de cadastro.

---

## 6. O que construir: a área do cliente

Esta é a parte nova de verdade. Nada disso existe no servidor.

### 6.1 O modelo mental

No painel, **uma conta em `barbeiros` = uma barbearia**. Na área do cliente, a
pessoa navega por **várias barbearias** — ou seja, por várias contas.

O cliente final é uma identidade **global** (um telefone, muitas barbearias),
enquanto `clientes` é **por barbearia**. Precisamos das duas coisas ligadas.

### 6.2 Alterações de schema sugeridas

```sql
-- Perfil público da barbearia. Só aparece na busca quem marcar publico = true.
alter table barbeiros
  add column if not exists slug        text,
  add column if not exists publico     boolean not null default false,
  add column if not exists sobre       text    not null default '',
  add column if not exists endereco    text    not null default '',
  add column if not exists cidade      text    not null default '',
  add column if not exists latitude    numeric(9,6),
  add column if not exists longitude   numeric(9,6),
  add column if not exists logo_url    text,
  add column if not exists cor         text    not null default '#8B5CF6',
  add column if not exists comodidades text[]  not null default '{}';

create unique index if not exists barbeiros_slug_uk on barbeiros (lower(slug));

-- Horário de funcionamento (0 = domingo). Sem linha no dia = fechado.
create table if not exists expediente (
  barbeiro_id uuid    not null references barbeiros(id) on delete cascade,
  dia_semana  int     not null check (dia_semana between 0 and 6),
  abre        time    not null,
  fecha       time    not null,
  primary key (barbeiro_id, dia_semana)
);

-- Identidade global do cliente final: um telefone, várias barbearias.
create table if not exists clientes_app (
  id        uuid primary key default gen_random_uuid(),
  telefone  text not null,
  nome      text not null,
  criado_em timestamptz not null default now()
);

-- Só dígitos, para (11) 98811-2233 e 11988112233 baterem.
create unique index if not exists clientes_app_telefone_uk
  on clientes_app (regexp_replace(telefone, '\D', '', 'g'));

-- Liga a identidade global à ficha daquela barbearia.
alter table clientes
  add column if not exists app_id uuid references clientes_app(id) on delete set null;

create index if not exists clientes_app_idx on clientes (app_id);

create table if not exists favoritos (
  app_id      uuid not null references clientes_app(id) on delete cascade,
  barbeiro_id uuid not null references barbeiros(id)    on delete cascade,
  criado_em   timestamptz not null default now(),
  primary key (app_id, barbeiro_id)
);

create table if not exists acessos (
  app_id      uuid not null references clientes_app(id) on delete cascade,
  barbeiro_id uuid not null references barbeiros(id)    on delete cascade,
  visto_em    timestamptz not null default now(),
  primary key (app_id, barbeiro_id)
);

create table if not exists avaliacoes (
  id          uuid primary key default gen_random_uuid(),
  barbeiro_id uuid not null references barbeiros(id)    on delete cascade,
  app_id      uuid not null references clientes_app(id) on delete cascade,
  nota        int  not null check (nota between 1 and 5),
  texto       text not null default '',
  criado_em   timestamptz not null default now(),
  unique (barbeiro_id, app_id)   -- uma avaliação por pessoa por barbearia
);
```

**Fidelidade não precisa de tabela.** Os pontos saem de
`sum(valor)` sobre `visitas` daquele cliente naquela barbearia. Se houver
resgate, aí sim criar `resgates` e descontar.

**Nota média** também é derivada: `avg(nota)` sobre `avaliacoes`.

### 6.3 Fluxo de um agendamento pela área do cliente

1. Cliente informa o telefone → acha ou cria `clientes_app`.
2. Ao agendar na barbearia X, garantir que exista `clientes` com
   `barbeiro_id = X` e `app_id` do cliente. Se não existir, criar.
3. Inserir em `agendamentos` normalmente, com `barbeiro_id = X`.

Assim o agendamento cai na agenda do dono daquela barbearia **sem nenhuma rota
nova do lado do painel** — é a mesma tabela. Isso já é o comportamento que o
front espera, e está testado na demo.

---

## 7. ⚠️ Segurança: a decisão mais importante

**Hoje a área do cliente confia no telefone digitado, sem verificação.** Qualquer
pessoa pode digitar o número de outra e ver o histórico, os agendamentos e
cancelar horários alheios.

Isso é aceitável numa demonstração e **inaceitável em produção**.

Antes de publicar, escolher um caminho:

- **Código por WhatsApp/SMS (OTP)** — recomendado. Pede o telefone, envia um
  código de 6 dígitos, valida, emite um token de sessão (JWT em cookie
  httpOnly, como já é feito no painel).
- **Link mágico** — envia um link assinado por WhatsApp.

Depois disso, `identificar` deixa de devolver os dados direto: passa a ser
`solicitar-codigo` + `confirmar-codigo`, e as demais rotas passam a exigir a
sessão em vez de receber `clienteId` na URL. O front precisa de um ajuste
pequeno para isso (a tela de identificação já é um passo só; vira dois).

Outros pontos:

- Limitar tentativas por telefone/IP (rate limit) no envio de código.
- Nas rotas `/publico/clientes/:id/*`, **nunca** confiar no `:id` da URL depois
  que houver sessão — usar o id do token.
- `agendar` e `cancelar` precisam checar que o registro pertence ao cliente da
  sessão. A demo já faz essa checagem; replicar no servidor.

---

## 8. Ordem sugerida de trabalho

~~1. Alinhar contratos do painel (§5)~~ — **feito.**
~~2. Ligar o catálogo (§5.1)~~ — **feito.**

O painel está inteiro no banco. O que resta é a área do cliente:

1. **Autenticação do cliente final** (§7) — decidir e implementar OTP.
2. **Rotas `/api/publico/*`** (§6 e `API-CONTRATO.md`) — na ordem: `barbearias`,
   `barbearia/:id`, `horarios`, `agendar`, `meus-horarios`, `cancelar`,
   `favoritos`, `fidelidade`, `avaliacoes`.
3. **Remover o que sobrou da demo** (§3).
4. **Perfil público no painel** — o dono precisa de uma tela para preencher
   endereço, sobre, comodidades, expediente e o botão "aparecer na busca". Hoje
   isso não existe em lugar nenhum; é front novo.

Antes de qualquer uma delas: **`npm run smoke`** (com a API no ar) roda 56
verificações contra o banco e é a rede que prova que nada do painel regrediu.

---

## 9. Detalhes que já estão resolvidos e não devem regredir

- **Isolamento entre barbearias.** Toda consulta filtra por `barbeiro_id` vindo
  do cookie, nunca do corpo da requisição. Manter.
- **Congelamento de valores.** `visitas` e `agendamentos` guardam cópia de
  nome, preço, comissão e duração. Reajuste de preço não reescreve o passado.
- **Choque de horário.** A restrição `agendamentos_sem_sobreposicao` resolve no
  banco, inclusive em corrida entre dois agendamentos simultâneos. A área do
  cliente **precisa tratar o 409** e devolver "esse horário acabou de ser
  preenchido" — o front já espera essa mensagem.
- **Fuso.** "Hoje" é sempre `America/Sao_Paulo`, nunca o UTC do servidor.
- **Senhas.** Só hash bcrypt (custo 12).

---

## 10. Mapa de arquivos

```
server/
  index.js          rotas montadas, static do dist, fallback SPA
  db.js             conexão Neon (tagged template, sem concatenação de SQL)
  auth.js           cookie de sessão + middleware exigirLogin
  crud.js           CRUD genérico por barbearia
  snapshots.js      resolve serviço/equipe/cliente e congela os valores
  routes/           auth, clientes, agenda, fila, visitas, dashboard,
                    assinaturas, catalogo
db/
  schema.sql        schema idempotente
  reset.sql         drop + recria (destrutivo)
src/
  App.jsx           só a raiz: sessão, navegação lateral e qual tela mostrar
  ui/
    tokens.js       paleta `B`, marca `N` e o estilo base de campo
    base.jsx        peças de UI do painel (Row, Btn, Card, Field, Table, gráficos…)
  painel/           uma tela por arquivo, na ordem do menu lateral
    Dashboard · Agenda · Fila · Clientes · Servicos · Estoque · Financeiro
    Assinaturas · Equipe · Lembretes · Integracoes · Conta · Exportar
  landing/LandingPage.jsx   página de vendas (não fala com a API)
  auth/Telas.jsx            login, cadastro e a tela de carregamento
  lib/
    api.js          cliente HTTP; só `publico` tem queda para demo
    dominio.js      vocabulário da barbearia (HORARIOS, TIPO_CLIENTE, opcoes…)
    useRecurso.js   hook de carga: {dados, erro, carregando, recarregar}
    pdf.js          exportação em PDF
    formato.js      dinheiro e datas (nunca usar toISOString para dia)
    demo.js         dados de exemplo — SÓ da área do cliente (a remover)
    barbearias.js   catálogo fixo de barbearias (a virar banco)
    tema.js         tokens visuais da área do cliente (`LP`)
  cliente/          área do cliente final
    AreaCliente.jsx    raiz, 4 abas
    Estabelecimento.jsx página da barbearia + agendamento
    ui.jsx / formatos.js peças e formatação
```

Os dois produtos têm **tokens e peças de UI próprios de propósito**: `ui/` +
`B` para o painel (desktop, escuro), `cliente/ui.jsx` + `LP` para a área do
cliente (mobile). Há componentes homônimos nos dois (`Girando`, `Carregando`,
`Vazio`) com implementações diferentes — não são duplicação a unificar.

```
docs/
  HANDOFF-BACKEND.md  este arquivo
  API-CONTRATO.md     contrato endpoint a endpoint
```
