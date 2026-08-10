---
name: code-review-graph
description: >
  Explorar e revisar este projeto pelo grafo de código em vez de varrer arquivos.
  Monta um mapa persistente (tree-sitter + SQLite) de funções, imports e chamadas
  do ControlCRM e responde "quem chama isto", "o que quebra se eu mexer aqui" e
  "quais arquivos esta mudança realmente afeta" — sem ler o repositório inteiro.
  Use ao revisar alterações, rastrear o raio de impacto de um patch, procurar
  onde algo é usado, entender a arquitetura, ou antes de responder qualquer
  pergunta que normalmente exigiria vários Grep/Read encadeados.
  Fonte: github.com/tirth8205/code-review-graph (MIT).
---

# Code Review Graph — ControlCRM

Adaptação do `code-review-graph` para **este** repositório. A ferramenta original
é um servidor MCP + CLI em Python que parseia o código com tree-sitter e guarda
funções, classes, imports e relações de chamada num SQLite. A revisão passa a
consultar esse grafo em vez de despejar arquivos inteiros no contexto.

## Por que aqui

Este projeto tem ~70 arquivos de código divididos em duas metades que se falam
por um contrato estreito:

- `server/` — Express + Neon. Rotas, `crud.js` (fábrica genérica), `auth.js`.
- `src/` — React. As telas consomem tudo por `src/lib/api.js`.

O erro caro neste repositório é **mudar um lado e não perceber o outro**. Uma
rota renomeada em `server/routes/publico.js` quebra `src/lib/api.js`,
`src/cliente/AreaCliente.jsx`, `src/cliente/Estabelecimento.jsx` e
`src/lib/demo.js` de uma vez — foi exatamente o que aconteceu na correção de
segurança de agosto/2026 (ver `CONTEXT.md`). O grafo existe para essa pergunta
ser respondida em um comando, e não com sete `grep`.

## Estado da instalação

**A ferramenta ainda NÃO está instalada neste ambiente.** Este arquivo é a
adaptação da skill; instalar é um passo separado e deve ser aprovado por quem
mantém o projeto.

```bash
pip install code-review-graph      # requer Python 3.10+ (aqui: 3.11.15)
code-review-graph install          # configura Claude Code / MCP
code-review-graph build            # primeiro parse do repositório
```

Cobertura de linguagem confirmada para este projeto: `.js`, `.jsx` e `.mjs`
mapeiam para o parser `javascript`. `db/schema.sql` **não** entra no grafo — o
schema continua sendo lido à mão.

Antes de instalar, vale lembrar o que a auditoria em `CONTEXT.md` apurou: é um
pacote de terceiros do PyPI que roda como servidor MCP com acesso de leitura ao
repositório inteiro — inclusive `.env.local`, que guarda `DATABASE_URL` e
`JWT_SECRET`. Instale com a mesma desconfiança que a auditoria aplicou às outras
skills.

## Fluxo de trabalho

A regra central da ferramenta: **grafo primeiro, arquivo depois.**

1. `detect_changes_tool` — ponto de partida de qualquer revisão. Devolve as
   mudanças com nota de risco, em vez de um diff cru.
2. `get_impact_radius_tool` — o raio de impacto. Neste repositório, use sempre
   que tocar em `server/crud.js`, `server/auth.js`, `src/lib/api.js` ou
   `src/ui/base.jsx`: são os quatro pontos de onde tudo pende.
3. `get_affected_flows_tool` — quais caminhos de execução a mudança atravessa.
4. `query_graph_tool` — `callers_of`, `callees_of`, `imports_of`, `tests_for`.
5. `semantic_search_nodes_tool` — achar função/componente por nome ou ideia,
   no lugar do Grep.
6. `get_architecture_overview_tool` — visão geral, para quem chega agora.

Caia para Grep/Glob/Read **só** quando o grafo não cobrir o que você precisa —
e ele não cobre: SQL em `db/`, texto em `docs/`, e o conteúdo dos comentários.

## Pares que o grafo não enxerga

O grafo segue `import` e chamada de função. Estes acoplamentos deste projeto são
por **string**, então nenhuma ferramenta estática os liga — confira à mão:

| Se você mexer em | Verifique também |
| --- | --- |
| um caminho de rota em `server/routes/*.js` | o caminho correspondente em `src/lib/api.js` |
| a assinatura de um método de `api.publico` | `src/lib/demo.js` (o modo demonstração implementa a MESMA interface) |
| um nome de coluna em `db/schema.sql` | as queries em `server/` e os campos lidos nas telas |
| um campo devolvido por uma rota | `scripts/smoke.js`, que compara os nomes de campo |

`src/lib/demo.js` é a armadilha mais fácil de esquecer: ele não é importado pelas
telas, e sim injetado em `api.js` por `comQuedaParaDemo`. Uma assinatura que muda
de um lado e não do outro só aparece quando o servidor cai.

## Verificação obrigatória depois de qualquer mudança

O grafo aponta o impacto; quem prova que nada quebrou é isto:

```bash
npm run lint      # eslint em src, server e scripts
npm run build     # o build falha em import quebrado
npm run smoke     # contrato real contra a API (precisa da API no ar)
```

O `smoke` é o teste que importa: ele dispara contra a API os mesmos corpos que
as telas mandam e confere os campos que elas leem. Foi ele que pegou o bug do
`regexp_replace(telefone, '\D', ...)` descrito no `CONTEXT.md`.

## Regra de reporte

Antes de dar qualquer trabalho por concluído, leia a **Regra permanente** no
topo do `CONTEXT.md`. Mudança que encoste no backend, em validação ou em
dependência nova é reportada ao dono do projeto — não é decisão do agente.
