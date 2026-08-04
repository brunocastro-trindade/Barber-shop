# ControlCRM — Barbearia

MVP de CRM para barbearias. Interface completa e navegável, com dados em memória
(sem banco de dados).

## Funcionalidades

- **Visão geral** com KPIs, faturamento da semana e atividade recente
- **Agenda** semanal com criação de horários, cancelamento e baixa de pagamento
- **Fila de espera** em tempo real para clientes walk-in
- **Fichas de clientes** com preferências de corte, barbeiro preferido e histórico de visitas
- **Serviços** com duração, preço e comissão do barbeiro
- **Estoque** de produtos com alerta de reposição
- **Financeiro** com recebimentos, despesas e resultado do mês
- **Assinaturas mensais** — planos, serviços incluídos, assinantes e MRR
- **Equipe** de barbeiros com registro de ponto e comissão estimada
- **Lembretes & Remarketing** para retorno e recorrência
- **Integrações** (WhatsApp / e-mail) e **Taxas & Configurações**
- **Exportação PDF** por seção ou completa, para migração ou backup

## Persistência

### No banco (Neon / Postgres)

| Tabela | Guarda |
|---|---|
| `barbeiros` | Quem assinou o sistema: nome, barbearia, e-mail, WhatsApp e senha em hash bcrypt |
| `clientes` | Clientes da barbearia, com tipo (assinante/avulso), observações de corte e barbeiro preferido |
| `visitas` | Atendimentos concluídos — é o livro-caixa que alimenta ficha, financeiro e KPIs |
| `agendamentos` | Horários marcados, com status Confirmado / Pago / Cancelado |
| `fila_espera` | Fila de walk-in do dia |

Toda linha carrega `barbeiro_id`, e **todas** as consultas filtram por ele usando o
id que vem do cookie de sessão — nunca um id enviado pelo navegador. É isso que
impede uma conta de enxergar dados de outra.

Visitas nascem de três lugares: baixa de pagamento na agenda, "Atender" na fila,
ou registro manual na ficha do cliente. Contadores como total gasto, número de
visitas e última visita não são colunas: saem de `SUM`/`COUNT`/`MAX` sobre
`visitas`, então nunca ficam dessincronizados.

### Ainda em memória

Serviços, estoque, planos de assinatura, despesas do financeiro e a lista de
barbeiros da equipe voltam ao padrão quando a página recarrega. O catálogo fica
no objeto `N`, no topo de `src/App.jsx`.

## Segurança

- Senhas são gravadas só como hash **bcrypt** (custo 12) — nunca em texto puro.
- A sessão é um **JWT em cookie `httpOnly`**, invisível para JavaScript no browser.
- A connection string do Neon vive apenas no servidor. O front nunca fala com o
  banco direto: só chama `/api/...`.
- Todas as queries usam template tags parametrizadas (`sql\`... ${valor}\``), então
  não há concatenação de SQL.

## Stack

- Vite + React 19 (JSX, sem TypeScript)
- Express 5 + `@neondatabase/serverless` (API)
- bcryptjs + jsonwebtoken (autenticação)
- Lucide React (ícones) · jsPDF (exportação)
- Inline styles (sem CSS framework)

## Configurar

**1. Crie um projeto no Neon** em [neon.tech](https://neon.tech) (o plano free serve).

**2. Preencha o `.env.local`** na raiz (já existe, com `JWT_SECRET` gerado). Copie a
connection string em *Neon Console → seu projeto → Connect → Pooled connection* e
cole em `DATABASE_URL`. Modelo completo em `.env.example`.

**3. Crie as tabelas:**

```bash
npm run db:migrate
```

O script é idempotente — rodar de novo não apaga nada.

**4. Suba a aplicação:**

```bash
npm run dev
```

Sobe a API na porta 3001 e o Vite na 5173, com proxy de `/api` já configurado.
Acesse `http://localhost:5173` e crie uma conta.

> Cada conta nova nasce com clientes, atendimentos e agendamentos de exemplo para
> o painel não abrir vazio. Para contas limpas, use `SEED_DEMO_DATA=false`.

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | API + front juntos (uso normal) |
| `npm run dev:api` | Só a API, com reload automático |
| `npm run dev:web` | Só o Vite |
| `npm run db:migrate` | Aplica `db/schema.sql` no Neon |
| `npm run build` | Compila o front para `dist/` |
| `npm start` | Roda a API servindo o `dist/` — para produção |
| `npm run lint` | ESLint no front e no servidor |
