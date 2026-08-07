# Regras do Workspace — Barber-shop (Frontend Only)

## Escopo de Trabalho

Este agente atua **exclusivamente no Front-End** deste projeto.

### ✅ Diretórios e arquivos PERMITIDOS

| Caminho | Descrição |
|---|---|
| `src/` | Todo o código frontend (React, JSX, CSS) |
| `src/App.jsx` | Componente raiz da aplicação |
| `src/main.jsx` | Entry point Vite |
| `src/index.css` | Estilos globais |
| `src/auth/` | Páginas e lógica de autenticação (UI) |
| `src/cliente/` | Área do cliente (UI) |
| `src/landing/` | Landing page |
| `src/painel/` | Painel administrativo (UI) |
| `src/ui/` | Componentes de UI reutilizáveis |
| `src/lib/` | Utilitários e helpers do frontend |
| `public/` | Assets estáticos públicos |
| `index.html` | HTML raiz |
| `vite.config.js` | Configuração do Vite |
| `eslint.config.js` | Configuração do ESLint |

---

### ❌ Diretórios e arquivos PROIBIDOS (Backend / Infra)

Nunca ler, modificar ou criar arquivos nos caminhos abaixo sem autorização explícita do usuário:

| Caminho | Motivo |
|---|---|
| `server/` | API Express (backend Node.js) |
| `server/index.js` | Entry point do servidor |
| `server/routes/` | Rotas da API REST |
| `server/auth.js` | Lógica de autenticação server-side |
| `server/crud.js` | Operações de banco de dados |
| `server/db.js` | Conexão com banco (Neon/Postgres) |
| `server/rateLimit.js` | Rate limiting da API |
| `server/snapshots.js` | Snapshots de dados |
| `server/tentativas.js` | Controle de tentativas de login |
| `db/` | Migrations e schema do banco |
| `scripts/` | Scripts de manutenção (migrate, reset, etc.) |
| `.env` / `.env.local` | Variáveis de ambiente sensíveis |

---

## Regras de Comportamento

1. **Nunca propor mudanças no backend** a menos que o usuário peça explicitamente.
2. **Comunicação com a API**: o frontend consome a API via `fetch` para `http://localhost:3000`. Não alterar endpoints no backend — apenas ajustar chamadas no `src/lib/` se necessário.
3. **Não instalar pacotes de backend** (ex: `express`, `bcryptjs`, `jsonwebtoken`, etc.).
4. **Focar em**: React, JSX, CSS, componentes, rotas frontend (React Router), estado, UX/UI.
5. **Stack frontend**: React 19, Vite, Lucide React, jsPDF (apenas para geração de PDFs no cliente).

## Convenções de Código

- Componentes em `PascalCase`
- Arquivos `.jsx` para componentes React
- Estilos via CSS Vanilla (`index.css` e estilos inline/módulos)
- Sem TypeScript neste projeto — usar `.jsx` puro
