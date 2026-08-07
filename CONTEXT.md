# CONTEXT — ControlCRM (Barber-shop)

Documento de contexto do projeto. Quem chega agora — pessoa ou agente — lê isto
antes de mexer em qualquer coisa.

---

## ⚠️ Regra permanente — todo agente deve ler antes de trabalhar

**Este projeto teve o front alterado.** As telas da área do cliente
(`src/cliente/`), o cliente HTTP (`src/lib/api.js`), o modo demonstração
(`src/lib/demo.js`) e a ficha de clientes do painel (`src/painel/Clientes.jsx`)
mudaram junto com uma correção de segurança no servidor.

A partir daqui, vale o seguinte:

> Se a alteração encostar no **backend** (`server/`, `db/`, `scripts/`), em
> **qualquer validação** (regra de entrada, permissão, autenticação,
> restrição de schema) ou introduzir **dependência nova** (npm, pip, serviço
> externo, ferramenta de terceiros), **ela deve ser reportada ao dono do
> projeto antes de ser dada por concluída.**

O reporte é obrigatório mesmo quando a mudança parece pequena, mesmo quando o
lint e o build passam, e mesmo quando ela foi pedida explicitamente. Descrever o
que mudou, por que, e o que passa a depender daquilo.

Não vale decidir sozinho que "é só um ajuste de front" quando o ajuste depende de
um campo novo na resposta da API — isso é backend. Na dúvida sobre a fronteira,
reporte.

### Por que esta regra existe

O front e o servidor deste projeto se falam por um contrato estreito e não
verificado por tipos. Uma rota renomeada em `server/routes/publico.js` quebra
`src/lib/api.js`, `src/cliente/AreaCliente.jsx`, `src/cliente/Estabelecimento.jsx`
e `src/lib/demo.js` ao mesmo tempo — e o modo demonstração só falha quando o
servidor cai, ou seja, em produção degradada. Validação e dependência entram na
regra porque foram as duas coisas que a auditoria encontrou quebradas.

---

## Como verificar qualquer mudança

```bash
npm run lint      # eslint em src, server e scripts
npm run build     # falha em import quebrado
npm run db:migrate  # idempotente; aplica db/schema.sql
npm run smoke     # contrato real contra a API (precisa da API no ar)
```

O `smoke` (`scripts/smoke.js`) é o que importa: dispara contra a API os mesmos
corpos que as telas mandam e confere os campos que elas leem. É o único ponto do
projeto que impede front e servidor de voltarem a discordar sobre nomes de campo.

---

# Auditoria de segurança — 07/08/2026

## Escopo e método

Auditados **211 arquivos**: as 7 skills de terceiros em `.claude/skills/` e todo
o código-fonte da aplicação. Fora do escopo: `node_modules/` (390 MB de
dependências npm) e `dist/` (build gerado a partir de `src/`, já varrido).

Método em duas passadas, seguindo a metodologia do `skill-auditor`:

1. **Passada determinística** — um scanner estático (tree de detecção:
   caracteres invisíveis, overrides bidirecionais/Trojan Source, homóglifos,
   padding de layout, blobs base64/hex, sinais de capacidade, procedência de
   dependências, frases de prompt injection, arquivos órfãos). O scanner foi
   escrito para esta auditoria e **validado contra uma fixture maliciosa** antes
   do uso — detectou os seis tipos de truque plantados.
2. **Passada de julgamento** — leitura dirigida só do que o scanner apontou,
   mais o raciocínio de raio de alcance que script nenhum faz.

O scanner nunca executa o alvo; só lê.

## Veredito

| Alvo | Veredito |
| --- | --- |
| Skills de terceiros (`.claude/skills/`) | **LOW-RISK** — 0 achados críticos |
| Código da aplicação | **HIGH-RISK** — autenticação da área do cliente quebrada |

O risco real do projeto não estava nas skills instaladas. Estava em
`server/routes/publico.js`.

## Raio de alcance

O que uma skill em execução alcança: o repositório inteiro e, sobretudo,
`.env.local` — que guarda `DATABASE_URL` (connection string do Neon) e
`JWT_SECRET`. Quem lê esse arquivo tem o banco inteiro e pode forjar sessão de
qualquer barbeiro.

Verificado: **nenhuma das 7 skills lê `.env.local`, e nenhuma tem canal de rede
bruto** (zero `requests`, `urllib`, `socket`, `axios`, `fetch` em scripts). A
única egressão é via SDK `google-genai`, na skill `design`. A trifecta letal não
fecha.

## Achados na aplicação — todos corrigidos

### 1. ALTA — Autenticação do cliente quebrada

`POST /api/publico/identificar` recebia um telefone e devolvia o registro do
cliente buscando em *qualquer* barbearia, sem código, sem OTP, sem nada. O
`cliente_id` devolvido era a única credencial das rotas seguintes. Com o telefone
de alguém, um atacante obtinha histórico completo com valores, total gasto,
profissional favorito, e podia cancelar agendamentos, favoritar e avaliar como
aquela pessoa. A rota ainda confirmava se um telefone estava cadastrado
(`precisaNome: true`), permitindo enumeração da base.

**Correção.** Passou a exigir **telefone + código de acesso**. Como não há canal
de verificação no projeto (sem WhatsApp/SMS) e o barbeiro cadastra cada cliente à
mão, o código nasce junto com a ficha e é entregue pessoalmente — a prova de
posse acontece no balcão. Gerado com `crypto.randomInt` (CSPRNG, sem viés) num
alfabeto de 32 símbolos sem O/0/I/1, porque é ditado em voz alta.
Ver `server/codigoAcesso.js`.

### 2. ALTA — IDOR nas rotas da área do cliente

O `clienteId` viajava na URL (`/publico/clientes/:clienteId/horarios`) e o
servidor acreditava nele.

**Correção.** As rotas viraram `/publico/eu/*` sob o middleware `exigirCliente`
(`server/auth.js`), que lê a identidade de um cookie assinado httpOnly. O id
saiu das URLs e do `localStorage`. Os tokens carregam um claim `tipo`, então um
cookie de cliente não vira sessão de dono — e o `smoke` testa exatamente isso.

### 3. ALTA — Rate limit contornável

`server/rateLimit.js` lia `x-forwarded-for` cru, sem `trust proxy`. Bastava
mandar um valor aleatório por requisição para o limite virar decorativo.

**Correção.** Passou a usar `req.ip`, com `trust proxy` desligado por padrão e
configurável por `TRUST_PROXY` (documentado em `.env.example`). `/identificar`
ganhou limite próprio: 10 tentativas por 15 minutos.

### 4. MÉDIA — Cliente novo caía na barbearia errada

`select id from barbeiros order by criado_em limit 1` criava todo cliente novo
sob a **primeira barbearia do banco**, independentemente de onde ele agendava —
misturando a base de clientes entre contas num sistema multi-inquilino.

**Correção.** O auto-cadastro público foi removido inteiro. Quem cadastra cliente
é o barbeiro, no painel, que é o fluxo real de trabalho.

### 5. MÉDIA — Avaliações sem restrição

`avaliacoes` não tinha `unique(cliente_id, barbeiro_id)` — ao contrário de
`favoritos`, que tinha — e a rota não checava se o cliente já visitara. Como a
nota pública sai de `avg(nota)`, dava para afundar ou inflar a reputação de
qualquer barbearia em laço.

**Correção.** Índice único `avaliacoes_cliente_barbeiro_uk` com dedupe das
duplicatas anteriores, e a rota agora exige visita registrada. Reavaliar
substitui a nota em vez de somar outra.

### 6. BAIXA — WhatsApp dos donos exposto

`GET /api/publico/barbearias` devolvia o telefone do proprietário de todas as
barbearias, sem autenticação e sem paginação.

**Correção.** `resumoBarbearia` ganhou o parâmetro `contato`. A listagem sai sem
telefone; a ficha individual mantém, porque ali é o contato que o cliente foi
buscar.

## Bug latente descoberto durante a correção

`regexp_replace(telefone, '\D', '', 'g')` dentro de um template literal do
JavaScript. Em template literal, `\D` é escape desconhecido e a barra some — o
SQL chegava como `regexp_replace(telefone, 'D', ...)`, que remove a letra "D" em
vez dos não-dígitos. **Nenhum telefone jamais casava.**

O bug já existia no `/identificar` original e estava invisível porque a busca
falhando caía direto no auto-cadastro, criando um cliente novo a cada acesso. O
`smoke` o pegou na primeira execução. Corrigido com `'\\D'` em
`server/routes/publico.js`, que agora casa com o índice `clientes_acesso_idx`
definido em `db/schema.sql` (arquivo `.sql` não passa pelo escape do JS).

## Achados nas skills de terceiros

**0 críticos.** Zero caracteres bidirecionais, zero homóglifos, zero blobs
codificados em 211 arquivos. A superfície de ocultação está limpa.

Dos 70 achados `high` do scanner, a apuração descartou como falso positivo:

- **20 `hidden_char.invisible`** — todos U+FE0F, o seletor de emoji do ⚠️.
  (No código do projeto, os equivalentes são BOMs — U+FEFF — em 6 arquivos.)
- **15 `prompt_injection`** — a palavra "silently" em orientação legítima de UX.
- **9 `exfiltration_shape`** — `.post(` em exemplos de Express dentro de CSVs.
- **1235 `layout.long_line`** — linhas de dados em CSV.

O que sobrou como real:

- `design/scripts/{logo,icon,cip}/generate.py` carregavam `~/.claude/.env` e
  `~/.claude/skills/.env` **inteiros** para `os.environ`, embora só usem
  `GEMINI_API_KEY`. **Mitigado** — ver a seção abaixo.
- `ui-styling/scripts/shadcn_add.py` executa `npx shadcn@<versão> add` — baixa e
  roda código remoto em runtime. É o propósito declarado, mas é supply chain.
  Segue **aceito**.
- `.pyc` em `__pycache__` — binários não auditáveis. **Removidos.**
- `ui-ux-pro-max/SKILL.md` tem ~460 caracteres em chinês (1% do arquivo).
  Procurei diretivas imperativas ali (sobrescrever, executar, silenciar, chave,
  enviar) — não há nenhuma. Fica como nota de auditabilidade. **Aceito.**

As skills **não estão no git** (`.gitignore`), vieram de
`npx -p ui-ux-pro-max-cli uipro init --ai claude`. O conteúdo local está limpo,
mas uma atualização futura não estará auditada.

## Mitigações aplicadas nas skills — e por que elas são frágeis

> **Estas mudanças não estão versionadas e somem na próxima reinstalação.**
> `.claude/skills/` está no `.gitignore` (só `code-review-graph/` é exceção).
> Rodar `npx -p ui-ux-pro-max-cli uipro init` de novo, ou qualquer atualização
> das skills, **sobrescreve tudo abaixo sem avisar.** Quem atualizar precisa
> reaplicar. É por isso que este registro existe.

### 1. Lista de permissão no `load_env()` da skill `design`

Nos três `scripts/{cip,icon,logo}/generate.py`, o carregamento do `.env` deixou
de ser irrestrito:

```python
CHAVES_PERMITIDAS = {"GEMINI_API_KEY", "GOOGLE_API_KEY"}
...
key, value = line.split("=", 1)
key = key.strip()
if key in CHAVES_PERMITIDAS and key not in os.environ:
    os.environ[key] = value.strip('"\'')
```

Antes, qualquer chave presente naqueles arquivos entrava no ambiente do
processo. Agora só as duas que os scripts de fato consomem. Os caminhos lidos
continuam os mesmos e nenhum deles alcança o `.env.local` deste projeto.

### 2. Bytecode removido

Apagados os `__pycache__/` sob `.claude/skills/`. Todos os `.pyc` tinham o `.py`
correspondente ao lado, então são regeneráveis. Um `.pyc` é binário: não dá para
auditar lendo, e um adulterado pode divergir do `.py` que está ao lado.

### 3. Como reauditar

```bash
# Windows: use `python`, não `python3`. PYTHONIOENCODING evita o crash de
# console ao imprimir caracteres não-ASCII (cp1252).
set PYTHONIOENCODING=utf-8
python %USERPROFILE%\.claude\skills\skill-auditor\scripts\scan_skill.py .claude\skills\<nome> --json rel.json
```

**Não leia a contagem de achados como medida de risco.** O scanner casa padrões
de texto: a mitigação 1 mudou o comportamento e a contagem de
`capability.credential_access` não caiu — os literais `.env` e `GEMINI_API_KEY`
continuam no arquivo, e a própria linha de mitigação contém um deles. O scanner
também **ignora `__pycache__`**, então os `.pyc` nunca apareceram no inventário
dele. Julgue pelo diff e pelo alcance, nunca pelo número.

## O que já estava certo e deve ser preservado

- SQL 100% parametrizado: tagged templates do Neon e `$n` em `sql.query`.
- O filtro `barbeiro_id` centralizado em `server/crud.js` — boa decisão de
  segurança, escrita uma vez só para que nenhuma rota consiga esquecê-la.
- bcrypt com custo 12; mensagem de erro uniforme no login; bloqueio por e-mail
  (não por IP) em `server/tentativas.js`.
- Cookie `httpOnly` + `sameSite` + `secure` em produção; `JWT_SECRET` validado
  em tamanho; erros 500 genéricos que não vazam estrutura do banco.
- `.env.local` **nunca foi commitado** — confirmado no histórico completo.

## Verificação da correção

Lint limpo, build OK, migração aplicada no Neon, e `npm run smoke` passou
inteiro — incluindo 11 asserções novas que cobrem a área do cliente: código
gerado no cadastro, telefone sozinho recusado, código errado recusado, rota
negada sem sessão, entrada válida, telefone não devolvido na resposta, histórico
lido pela sessão, avaliação exigindo visita, reavaliação substituindo, contagem
única no banco, e token de cliente não virando sessão de dono.

O scanner foi reexecutado sobre o código alterado: nenhum caractere oculto novo.

## Pendência conhecida (não é segurança)

`resumoBarbearia` em `server/routes/publico.js` devolve endereço, bairro, cidade
e comodidades **fixos e inventados**, e usa `4.9` com `12 avaliações` como
padrão quando não há nenhuma. Isso chega ao cliente final como se fosse dado
real. Não foi corrigido: mexer ali muda o que a tela exibe e é decisão de
produto, não de segurança.

## Limites honestos desta auditoria

Análise estática não prova ausência de ameaça. As skills estão limpas quanto ao
que se detecta lendo; ofuscação nova escapa de regra fixa. Para instalação de
alto risco, combine com execução em sandbox descartável, menor privilégio e
humano no circuito para ações irreversíveis.

---

## Ferramenta de apoio

`.claude/skills/code-review-graph/SKILL.md` — adaptação do
[code-review-graph](https://github.com/tirth8205/code-review-graph) (MIT) para
este repositório: revisar pelo grafo de código em vez de varrer arquivos, com a
tabela dos acoplamentos por string que o grafo **não** enxerga. A ferramenta
ainda não está instalada; instalá-la é dependência nova e, pela regra do topo
deste documento, precisa ser reportada e aprovada.
