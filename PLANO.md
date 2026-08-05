# ControlCRM — Plano, estado e armadilhas

Documento de trabalho. Última atualização: **05/08/2026**.

O projeto nasceu como CRM multi-nicho (clínica, barbearia, mecânica) e foi
reduzido a **barbearia apenas**. Depois virou SaaS multi-inquilino com Postgres
no Neon. Este arquivo registra o que foi decidido, o que já roda e onde as
coisas já quebraram — para não quebrarem de novo.

---

## 1. Decisões de produto

Definidas em sessão de perguntas, 04/08/2026. Não são deriváveis do código.

| # | Tema | Decisão |
|---|---|---|
| 1 | Propósito | SaaS multi-inquilino, começando por piloto fechado |
| 2 | Equipe | Barbeiros da barbearia são tabela própria, **sem login**. Só o dono acessa |
| 3 | Histórico | Valor, comissão e duração **congelados no atendimento** |
| 4 | Assinaturas | Reais no banco, com vencimento — **só registro**, sem gateway de pagamento |
| 5 | Senha esquecida | Reset **manual**, direto no banco. Sem e-mail transacional |
| 6 | Cadastro | **Fechado, por convite** |
| 7 | Publicação | **Adiada**. Roda local enquanto as funcionalidades são terminadas |
| 8 | Conta nova | Nasce **totalmente vazia** — sem catálogo padrão, sem dados de exemplo |
| 9 | Estoque e despesas | Ambos no banco |
| 10 | Agenda | Intervalo real, grade de 30 min. Conflito por sobreposição, não por horário exato |

**Adiado de propósito** (volta à mesa só ao publicar): limite de tentativas no
login, HTTPS/deploy, login individual por barbeiro, e como o dono do SaaS recebe.

**Aceito no escopo:** fuso fixo `America/Sao_Paulo` — produto só para o Brasil.

---

## 2. O que já foi executado

### Etapa 0 — Redução a barbearia (feito)
Removidas as verticais de clínica e mecânica: telas, navegação, rotas e config.
`src/App.jsx` caiu de 3360 para ~2100 linhas.

### Etapa 1 — Schema (feito e testado)
`db/schema.sql`, 12 tabelas:

```
barbeiros   convites   equipe      servicos   produtos   clientes
visitas     agendamentos   fila_espera   planos   assinaturas   despesas
```

Dois princípios atravessam tudo:

1. **Todo registro tem `barbeiro_id`** e toda consulta filtra por ele usando o id
   que veio do cookie assinado — nunca um id vindo do navegador.
2. **Dinheiro que já aconteceu é fato consumado.** Visitas e agendamentos
   congelam valor, percentual de comissão, duração e os nomes envolvidos.

Destaques:
- Restrição de exclusão GiST em `agendamentos` impede sobreposição por barbeiro
  no próprio banco, inclusive sob concorrência. Coluna `periodo` gerada de
  `data + hora_inicio + duracao_min`.
- Índice único parcial garante **uma assinatura ativa por cliente**.
- Contadores (visitas, total gasto, última visita) **não são colunas**: saem de
  agregação sobre `visitas`, então nunca dessincronizam do caixa.

### Etapa 2 — API (feito e testado)
Rotas em `server/routes/`: auth (com convite), clientes, agenda, fila, visitas,
assinaturas, dashboard e catálogo (equipe/serviços/produtos/despesas/planos).

- `server/crud.js` — fábrica de CRUD por barbearia. Existe por segurança, não
  por economia: o filtro `barbeiro_id` fica escrito **uma vez só**.
- `server/snapshots.js` — resolve serviço/barbeiro/cliente e congela os dados.
- `server/seed.js` foi **deletado**; `SEED_DEMO_DATA` não existe mais.

Testado ponta a ponta: convite obrigatório e de uso único, conta nascendo vazia,
sobreposição de agenda recusada, baixa gerando visita, reajuste de preço **não**
alterando o histórico, fila, assinatura e dashboard.

### Etapa 3 — Front (**não feito**)
`src/App.jsx` ainda tem ~29 referências ao catálogo fixo `N.services`,
`N.products`, `N.pros`, e chama a API no formato antigo (`profissional`, `hora`,
`servico`, `barbeiro_pref`). **A aplicação não funciona de ponta a ponta hoje.**

Falta: religar as seis telas, criar as telas de cadastro de serviços/equipe/
planos que o schema agora permite, e o campo de convite no cadastro.

---

## 3. Comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | API (3001) + front (5173) juntos |
| `npm run db:migrate` | Aplica o schema. Nunca destrói |
| `npm run db:reset` | **Destrutivo**. Recusa rodar com dados, salvo `-- --force` |
| `npm run convite -- "Nome"` | Gera código de cadastro. `-- --listar` mostra todos |
| `npm run lint` / `npm run build` | Front e servidor |

Credenciais em `.env.local` (fora do git). Modelo em `.env.example`.

---

## 4. Armadilhas já encontradas

Cada uma custou tempo pelo menos uma vez. Estão aqui para não custar de novo.

### Driver do Neon

**`sql.query()` devolve array, não `{ rows }`.**
As rotas respondiam **vazio sem lançar erro** — falha silenciosa, a pior espécie.
Só `Client.query()` (usado nos scripts de migração) é compatível com `pg`.

```js
const linhas = await sql.query(texto, params);   // array
const { rows } = await client.query(texto);      // só com Client
```

**Colunas `numeric` voltam como string.** `preco` chegava como `"75.00"` e
qualquer soma no front viraria concatenação. Sempre `::float8` na saída.

### Datas e fuso

**Nunca use `toISOString()` para extrair o dia.** Converte para UTC e, no Brasil,
joga qualquer horário após as 21h para o dia seguinte. Use formatação local
(`src/lib/formato.js`) no front e `to_char(campo, 'YYYY-MM-DD')` no SQL.

**`current_date` do Postgres é UTC.** Use
`(now() at time zone 'America/Sao_Paulo')::date` — vale para `WHERE`, para
`default` de coluna e para "hoje" no dashboard.

**`to_char(data, 'Dy')` devolve o nome em inglês**, conforme o `lc_time` do banco.
Formate nomes de dia e mês no front.

### Modelagem

**`on delete cascade` em `visitas.cliente_id` apagava o faturamento.** Remover um
cliente encolhia a receita do mês passado, sem aviso. Correto é `set null`, com o
nome preservado em `cliente_nome`: o cliente sai, o dinheiro fica.

**Comissão calculada ao vivo reescreve o passado.** A versão anterior consultava
o catálogo atual ao renderizar — reajustar de 40% para 50% mudava o relatório de
março. Por isso `comissao_pct` é congelado na visita.

**Casar barbeiro por substring do primeiro nome dá pagamento errado.** Dois
"Carlos" recebiam as comissões um do outro. Por isso `equipe_id`.

### React / front

**`Row` não repassava `onClick`** — todos os toggles do sistema eram inertes e
ninguém notou. Componente de layout que aceita eventos precisa repassá-los.

**Toggle ignorava o padrão configurado**: `type="toggle"` renderizava desligado.
Inicialização precisa considerar o tipo.

**Comparar objeto com sua própria cópia espalhada nunca casa.**
`appointments[i] === {...a}` era sempre falso; a seleção da agenda não destacava
nada. Compare por id.

**`Date.now()` durante o render** quebra a regra de pureza do React. Calcule uma
vez em `useState(() => ...)` ou fora do componente.

**`setState` síncrono no corpo de um `useEffect`** também é barrado pelo lint.
Nos callbacks da promise é permitido — e é o padrão correto.

### Ferramental

**ESLint com `globals.browser` aplicado ao servidor** marca `process` como
indefinido. Separe os blocos por pasta (`src/**` browser, `server/**` node).

**Regex complexa dentro de `node -e` quebra no Git Bash.** O shell come as barras
invertidas. Escreva o script num arquivo e execute o arquivo.

**Script fora da pasta do projeto não resolve `node_modules`.** Para testar com
dependências, o arquivo precisa estar dentro do projeto.

**O console do Windows embaralha acentos na saída** (`Degrad?`). É só exibição —
confirme no banco antes de sair caçando bug de encoding.

### Skills instaladas

`.claude/skills/` (ui-ux-pro-max) está no `.gitignore` **de propósito** — não sobe
com o repositório. Os caminhos de script dos `SKILL.md` vinham quebrados de
fábrica e foram corrigidos localmente; **`uipro update` desfaz essas correções**.
