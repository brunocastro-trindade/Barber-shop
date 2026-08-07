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
2. **Comunicação com a API**: o frontend **nunca** usa URL absoluta. Todas as chamadas saem de `src/lib/api.js` para caminhos relativos `/api/...`, e o Vite faz o proxy para o servidor Node (`vite.config.js` → `http://localhost:3001`, ou a porta em `PORT`). Em produção os dois são servidos pela mesma origem, e é por isso que o cookie de sessão viaja sozinho, sem token no `localStorage`. Não alterar endpoints no backend — apenas ajustar as chamadas em `src/lib/api.js` se necessário.
3. **Não instalar pacotes de backend** (ex: `express`, `bcryptjs`, `jsonwebtoken`, etc.).
4. **Focar em**: React, JSX, CSS, componentes, navegação, estado, UX/UI.
   Não há **React Router** neste projeto — não está no `package.json` e não é
   importado em lugar nenhum. A navegação é manual: `src/App.jsx` guarda a tela
   atual em estado e usa `window.history.pushState`, e `/cliente` é reconhecido
   por regex sobre `window.location.pathname`. Não introduza um roteador sem
   pedir: é dependência nova.
5. **Stack frontend**: React 19, Vite, Lucide React, jsPDF (apenas para geração de PDFs no cliente).

## Convenções de Código

- Componentes em `PascalCase`
- Arquivos `.jsx` para componentes React
- Estilos via CSS vanilla: `src/index.css` para o global, e **estilos inline**
  no JSX para o resto. Não há CSS Modules no projeto (nenhum `.module.css`);
  os tokens de cor e espaçamento vivem em `src/ui/tokens.js` e `src/lib/tema.js`
- Sem TypeScript neste projeto — usar `.jsx` puro
