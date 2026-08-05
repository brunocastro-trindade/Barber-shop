# Contrato da API — ControlCRM Barbearia

Referência de todos os endpoints que o front-end chama. Fonte da verdade do
lado do cliente: [`src/lib/api.js`](../src/lib/api.js).

Legenda: ✅ implementado · ⚠️ implementado mas com formato divergente do front ·
❌ ainda não existe.

Convenções:

- Base: `/api`. Em dev o Vite faz proxy da 5173 para a 3001.
- Sessão do dono: cookie `cc_sessao`, httpOnly, JWT de 7 dias.
- Erros: `{ "erro": "mensagem em português, para exibir ao usuário" }`.
  O front mostra `erro` cru na tela — escrever pensando nisso.
- Datas: `YYYY-MM-DD`. Horas: `HH:MM`. Dinheiro: número, não string.
- "Hoje" é sempre no fuso `America/Sao_Paulo`.

---

## 1. Autenticação do dono

### ✅ `POST /auth/register`

```jsonc
// req
{ "nome": "...", "barbearia": "...", "whatsapp": "...",
  "email": "...", "senha": "mínimo 6", "convite": "ABCD-1234" }
// res 201 — também emite o cookie de sessão
{ "id": "uuid", "nome": "...", "barbearia": "...", "email": "...", "whatsapp": "..." }
```

Erros: `400` campos, `403` convite inválido, `409` convite usado / e-mail já
cadastrado.

### ✅ `POST /auth/login`

```jsonc
{ "email": "...", "senha": "..." }   // → mesmo corpo do register
```

### ✅ `POST /auth/logout` · ✅ `GET /auth/me`

`/auth/me` devolve `401` quando não há sessão — o front usa isso para decidir
entre mostrar a landing e o painel.

---

## 2. Clientes

### ✅ `GET /clientes`

```jsonc
[{
  "id": "uuid", "nome": "...", "telefone": "...",
  "tipo": "assinante" | "avulso", "obs": "...",
  "equipe_pref": "uuid|null", "equipe_pref_nome": "string|null",
  "visitas": 12, "total_gasto": 840.0, "ultima_visita": "2026-08-03|null"
}]
```

> ⚠️ O front lê `barbeiro_pref`. Ver §5.1 do handoff.

### ✅ `POST /clientes` · ✅ `PATCH /clientes/:id` · ✅ `DELETE /clientes/:id`

```jsonc
// req — equipe_pref é UUID, não nome
{ "nome": "...", "telefone": "...", "tipo": "avulso", "obs": "", "equipe_pref": "uuid|null" }
```

Remover cliente **não** apaga as visitas: o dinheiro fica no caixa e o
`cliente_id` da visita vira `null`, preservando `cliente_nome`.

### ✅ `GET /clientes/:id/visitas`

```jsonc
[{ "id": "uuid", "data": "2026-08-03", "servico_nome": "Corte + Barba",
   "equipe_nome": "Rafael Silva", "valor": 75.0, "comissao_pct": 45.0,
   "origem": "agenda" | "fila" | "manual" }]
```

### ✅ `POST /clientes/:id/visitas` · ✅ `DELETE /clientes/:id/visitas/:visitaId`

```jsonc
{ "servico_id": "uuid", "equipe_id": "uuid|null", "valor": 75.0 }
```

`valor` é opcional; sem ele vale o preço do catálogo. Preço, comissão e nomes
são **congelados** no registro.

---

## 3. Agenda

### ✅ `GET /agendamentos?inicio=YYYY-MM-DD&fim=YYYY-MM-DD`

```jsonc
[{
  "id": "uuid", "cliente_id": "uuid|null", "cliente_nome": "...",
  "servico_id": "uuid|null", "servico_nome": "...",
  "equipe_id": "uuid|null", "equipe_nome": "...",
  "data": "2026-08-05", "hora_inicio": "10:00", "duracao_min": 45,
  "valor": 75.0, "comissao_pct": 45.0,
  "status": "Confirmado" | "Pago" | "Cancelado"
}]
```

> ⚠️ O front lê `hora`, `servico` e `profissional`.

### ✅ `POST /agendamentos`

```jsonc
{ "data": "2026-08-05", "hora_inicio": "10:00",
  "servico_id": "uuid", "equipe_id": "uuid",
  "cliente_id": "uuid|null", "cliente_nome": "usado quando não há ficha" }
```

`409` quando o barbeiro já tem atendimento no intervalo — a restrição de
exclusão do banco é a autoridade, inclusive em requisições simultâneas.

### ✅ `POST /agendamentos/:id/cancelar` · ✅ `POST /agendamentos/:id/pagar` · ✅ `DELETE /agendamentos/:id`

`pagar` marca `Pago` **e** gera a visita correspondente, na mesma transação.

---

## 4. Fila de espera

### ✅ `GET /fila`

```jsonc
[{ "id": "uuid", "cliente_id": "uuid|null", "nome": "...",
   "servico_id": "uuid|null", "servico_nome": "...",
   "equipe_id": "uuid|null", "equipe_nome": "string|null",
   "preco": 45.0, "tipo": "avulso", "entrou": "09:12" }]
```

### ✅ `POST /fila` · ✅ `POST /fila/:id/atender` · ✅ `DELETE /fila/:id`

`atender` remove da fila e cria a visita, na mesma transação.

---

## 5. Visitas e financeiro

### ✅ `GET /visitas?limite=30`

```jsonc
[{ "id": "uuid", "cliente_nome": "...", "servico_nome": "...",
   "equipe_nome": "...", "data": "2026-08-03",
   "valor": 75.0, "comissao_pct": 45.0, "comissao_valor": 33.75,
   "origem": "agenda" }]
```

### ✅ `GET /visitas/resumo`

```jsonc
{ "receitaMes": 7240.0, "atendimentosMes": 104, "comissoesMes": 2980.0,
  "porServico": [{ "servico_nome": "...", "total": 0, "qtd": 0 }],
  "meses": [{ "mes": "2026-08", "total": 0 }],
  "porBarbeiro": [{ "equipe_nome": "...", "equipe_id": "uuid",
                    "atendimentos": 0, "faturado": 0, "comissao": 0 }] }
```

### ✅ `GET /dashboard`

```jsonc
{ "receitaMes": 0, "atendimentosMes": 0, "comissoesMes": 0, "ticketMedio": 0,
  "clientes": 0, "assinantes": 0, "naFila": 0,
  "assinaturasAtivas": 0, "assinaturasVencidas": 0, "mrr": 0, "estoqueBaixo": 0,
  "semana":   [{ "data": "2026-08-05", "total": 0 }],
  "proximos": [/* agendamentos Confirmado, data >= hoje, limit 5 */],
  "atividade":[/* últimas 5 visitas */] }
```

---

## 6. Catálogo — CRUD genérico

✅ Implementados em `server/routes/catalogo.js`, **ainda não consumidos pelo front**.

Todos seguem o mesmo formato: `GET /`, `POST /`, `PATCH /:id`, `DELETE /:id`.

| Rota | Colunas editáveis |
|---|---|
| `/equipe` | `nome`, `ativo` |
| `/servicos` | `nome`, `duracao_min`, `preco`, `comissao_pct`, `ativo` |
| `/produtos` | `nome`, `preco`, `quantidade`, `minimo` |
| `/despesas` | `descricao`, `valor`, `data`, `status` |
| `/planos` | `nome`, `preco`, `incluidos[]`, `ativo` |

---

## 7. Assinaturas

✅ `GET /assinaturas` · `POST /assinaturas` · `POST /assinaturas/:id/pagar` ·
`POST /assinaturas/:id/cancelar`

"Vencida" não é status gravado: é `vencimento < hoje`. Dar baixa empurra o
vencimento para o mês seguinte.

---

## 8. ❌ Área do cliente — `/api/publico/*`

**Nada disto existe ainda.** É o grosso do trabalho novo.

Não exigem o cookie do dono. Sobre autenticação do cliente final, ler a §7 do
handoff — **as assinaturas abaixo assumem o modelo atual (telefone sem
verificação) e devem mudar para sessão quando o OTP entrar**.

Formatos abaixo são exatamente os que o front consome hoje (via
`src/lib/demo.js`). Manter os nomes de campo evita mexer no front.

### ❌ `GET /publico/barbearias?termo=&modo=nome|cidade|proximas`

Lista para a aba Buscar. `modo` filtra por nome ou cidade; `proximas` ignora o
termo e ordena por distância. Só barbearias com `publico = true`.

```jsonc
[{
  "id": "uuid", "nome": "Barbearia do Hugo", "sigla": "BH", "cor": "#8B5CF6",
  "endereco": "Rua das Tesouras, 120 — Centro", "cidade": "Itajaí/SC",
  "distancia": 550,          // metros; calcular a partir da geo do cliente
  "nota": 5.0,               // avg(avaliacoes.nota), 1 casa
  "favorito": true,          // depende do cliente logado
  "daCasa": false            // usado só pela demo, pode sair
}]
```

`sigla` e `cor` são o fallback de logo enquanto não houver upload de imagem.
Quando houver, acrescentar `logo_url` e o front passa a preferi-lo.

### ❌ `GET /publico/barbearias/:id?acesso=1`

Ficha completa. Com `acesso=1`, registrar em `acessos` (alimenta "Últimos
acessos" da tela inicial).

```jsonc
{
  // tudo do resumo acima, mais:
  "sobre": "...", "telefone": "(47) 3344-1122",
  "comodidades": ["wifi", "cartao", "cafe", "tv"],
  "expediente": [["Segunda-feira", "13:00 - 20:00"], ["Domingo", "Fechado"]],
  "grade": ["08:00", "09:00", "10:00", "11:00", "14:00"],
  "servicos":  [{ "nome": "Corte + Barba", "preco": 75.0, "duracao": 45 }],
  "barbeiros": [{ "nome": "Rafael Silva", "cargo": "Barbeiro sênior", "nota": 5.0 }],
  "avaliacoes":[{ "nome": "João", "data": "2026-05-23", "nota": 5,
                  "texto": "", "minha": false }]
}
```

`expediente` vai de segunda a domingo, nessa ordem — o front usa o índice para
marcar "Hoje". `grade` são os horários agendáveis daquela barbearia.

> Quando o catálogo virar banco, `servicos` deve incluir `id` (uuid) e o front
> passa a mandar `servico_id` em `agendar`.

### ❌ `POST /publico/identificar`

```jsonc
// req
{ "telefone": "(11) 98811-2233", "nome": "opcional" }
// res 200 — cliente encontrado ou recém-criado
{ "id": "uuid", "nome": "Lucas Almeida", "telefone": "...",
  "tipo": "assinante", "novo": false }
```

Comportamento esperado pelo front, importante: quando o telefone **não existe**
e `nome` veio vazio, responder `404` com um marcador que o front reconheça como
"precisa do nome" — hoje a demo lança um erro com `precisaNome: true`. Sugestão
de contrato:

```jsonc
// 404
{ "erro": "Não encontramos seu cadastro. Informe seu nome.", "precisaNome": true }
```

O front já trata isso: mostra o campo de nome em vez de exibir erro. Se mudar o
formato, ajustar `Entrada` em `src/cliente/AreaCliente.jsx`.

Comparação de telefone: **só dígitos**, para `(11) 98811-2233` e `11988112233`
baterem.

### ❌ `GET /publico/clientes/:id/inicio`

Tela inicial.

```jsonc
{
  "proximo": {           // próximo Confirmado, ou null
    "id": "uuid", "data": "2026-08-07", "hora": "11:00",
    "servico": "Barba completa", "profissional": "Carlos Lima", "valor": 35.0,
    "barbearia": { /* resumo */ }
  },
  "favoritos": [ /* resumos */ ],
  "recentes":  [ /* resumos, mais recente primeiro, máx. 8 */ ]
}
```

### ❌ `POST /publico/clientes/:id/favoritos/:barbeariaId`

Alterna favorito. `{ "favorito": true }`.

### ❌ `GET /publico/barbearias/:id/horarios?data=YYYY-MM-DD&profissional=`

```jsonc
[{ "hora": "09:00", "livre": true }, { "hora": "10:00", "livre": false }]
```

Regras que o front assume:

- Horário no passado do dia de hoje → `livre: false`.
- Com `profissional` vazio ou `"Qualquer"`, o horário só fecha quando **todos**
  os barbeiros estão ocupados.
- Com barbeiro específico, fecha se aquele barbeiro estiver ocupado.
- A base é a `grade` da barbearia, não uma grade global.

### ❌ `POST /publico/agendar`

```jsonc
// req
{ "cliente_id": "uuid", "barbearia_id": "uuid",
  "servico": "Corte + Barba",        // vira servico_id quando o catálogo for banco
  "profissional": "Qualquer" | "Rafael Silva",
  "data": "2026-08-10", "hora": "14:00" }
// res 201
{ "id": "uuid", "data": "...", "hora": "14:00", "servico": "...",
  "profissional": "Rafael Silva", "valor": 75.0, "status": "Confirmado",
  "barbearia": { /* resumo */ } }
```

Regras já implementadas na demo, replicar:

1. Com `"Qualquer"`, escolher o primeiro barbeiro livre no horário.
2. Recusar se o cliente já tem um `Confirmado` naquele dia
   (`"Você já tem um horário marcado neste dia."`).
3. Se o horário foi tomado no meio do caminho, responder `409` com mensagem
   contendo **"preenchido"** — o front detecta essa palavra e devolve o usuário
   ao passo de escolher horário.
4. Garantir a ficha em `clientes` daquela barbearia (ver §6.3 do handoff) antes
   de inserir o agendamento.

### ❌ `GET /publico/clientes/:id/horarios?barbearia=`

Aba Agendamentos. `barbearia` é filtro opcional.

```jsonc
{
  "proximos":  [ /* Confirmado e data >= hoje, com "barbearia" embutida */ ],
  "passados":  [ /* o resto, mais recente primeiro, máx. 20 */ ],
  "historico": [ /* visitas concluídas, máx. 20 */ ],
  "resumo": { "visitas": 51, "totalGasto": 3710.0,
              "favorito": "Carlos Lima",   // barbeiro que mais atendeu
              "tipo": "assinante" }
}
```

Cada item de `proximos`/`passados` carrega `id, data, hora, servico,
profissional, valor, status` e o objeto `barbearia` (resumo).

### ❌ `POST /publico/clientes/:id/horarios/:agendamentoId/cancelar`

Só pode cancelar agendamento do próprio cliente. `{ "ok": true }`.

### ❌ `GET /publico/clientes/:id/fidelidade/:barbeariaId`

```jsonc
{ "pontos": 3710, "visitas": 51,
  "premios": [{ "nome": "Pezinho grátis", "custo": 300, "liberado": true }] }
```

Regra atual: **1 ponto por real gasto naquela barbearia**, derivado de
`sum(visitas.valor)`. A lista de prêmios está fixa no código; o natural é virar
cadastro por barbearia.

### ❌ `POST /publico/clientes/:id/avaliacoes/:barbeariaId`

```jsonc
{ "nota": 5, "texto": "opcional" }   // → { "ok": true }
```

Uma avaliação por pessoa por barbearia (upsert). Idealmente só liberar para
quem tem ao menos uma visita concluída ali — a demo não checa isso.

---

## 9. Resumo do que falta

| Endpoint | Prioridade |
|---|---|
| Alinhar `*_id` / `*_nome` no painel | 🔴 bloqueia tudo |
| Ligar catálogo (equipe, serviços, produtos, planos, despesas) | 🔴 alta |
| Autenticação do cliente final (OTP) | 🔴 antes de publicar |
| `GET /publico/barbearias` + `/:id` | 🟠 |
| `POST /publico/identificar` | 🟠 |
| `GET /publico/barbearias/:id/horarios` | 🟠 |
| `POST /publico/agendar` | 🟠 |
| `GET /publico/clientes/:id/horarios` + cancelar | 🟠 |
| `GET /publico/clientes/:id/inicio` + favoritos | 🟡 |
| Fidelidade e avaliações | 🟡 |
| Tela de perfil público no painel | 🟡 front novo |
