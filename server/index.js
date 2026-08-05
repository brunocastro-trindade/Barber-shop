import express from "express";
import cookieParser from "cookie-parser";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

import { exigirLogin } from "./auth.js";
import { criarRateLimit } from "./rateLimit.js";
import authRoutes from "./routes/auth.js";
import publicoRoutes from "./routes/publico.js";
import clientesRoutes from "./routes/clientes.js";
import agendaRoutes from "./routes/agenda.js";
import filaRoutes from "./routes/fila.js";
import visitasRoutes from "./routes/visitas.js";
import assinaturasRoutes from "./routes/assinaturas.js";
import dashboardRoutes from "./routes/dashboard.js";
import { equipe, servicos, produtos, despesas, planos } from "./routes/catalogo.js";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const app = express();

app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());

app.get("/api/health", (req, res) => res.json({ ok: true }));

// Limites de requisições por IP contra abusos e força bruta
const limitAuth = criarRateLimit({ janelaMs: 15 * 60 * 1000, max: 20, mensagem: "Muitas tentativas de login/cadastro. Aguarde 15 minutos." });
const limitPublico = criarRateLimit({ janelaMs: 15 * 60 * 1000, max: 120, mensagem: "Muitas requisições públicas. Aguarde 15 minutos." });

// Login, cadastro e área do cliente são as rotas abertas (públicas).
app.use("/api/auth", limitAuth, authRoutes);
app.use("/api/publico", limitPublico, publicoRoutes);

// Daqui para baixo tudo exige sessão, e cada consulta é filtrada pelo
// barbeiro_id que veio do cookie assinado.
app.use("/api/clientes", exigirLogin, clientesRoutes);
app.use("/api/agendamentos", exigirLogin, agendaRoutes);
app.use("/api/fila", exigirLogin, filaRoutes);
app.use("/api/visitas", exigirLogin, visitasRoutes);
app.use("/api/assinaturas", exigirLogin, assinaturasRoutes);
app.use("/api/dashboard", exigirLogin, dashboardRoutes);

// Cadastros da barbearia — todos com o mesmo formato de CRUD (ver server/crud.js).
app.use("/api/equipe", exigirLogin, equipe);
app.use("/api/servicos", exigirLogin, servicos);
app.use("/api/produtos", exigirLogin, produtos);
app.use("/api/despesas", exigirLogin, despesas);
app.use("/api/planos", exigirLogin, planos);

app.use("/api", (req, res) => res.status(404).json({ erro: "Rota não encontrada" }));

// Em produção o mesmo processo entrega o front já compilado (npm run build).
const dist = path.join(raiz, "dist");
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.use((req, res) => res.sendFile(path.join(dist, "index.html")));
}

// Erros não tratados viram 500 genérico: o detalhe fica no log do servidor, não
// na resposta, para não vazar estrutura do banco.
app.use((err, req, res, next) => {
  console.error("[api]", err);
  if (res.headersSent) return next(err);
  res.status(500).json({ erro: "Erro interno do servidor." });
});

const porta = Number(process.env.PORT) || 3001;
app.listen(porta, () => {
  console.log(`[ControlCRM] API em http://localhost:${porta}`);
});
