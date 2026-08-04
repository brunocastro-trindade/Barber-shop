import express from "express";
import cookieParser from "cookie-parser";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

import { exigirLogin } from "./auth.js";
import authRoutes from "./routes/auth.js";
import clientesRoutes from "./routes/clientes.js";
import agendaRoutes from "./routes/agenda.js";
import filaRoutes from "./routes/fila.js";
import visitasRoutes from "./routes/visitas.js";
import dashboardRoutes from "./routes/dashboard.js";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const app = express();

app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());

app.get("/api/health", (req, res) => res.json({ ok: true }));

// Login e cadastro são as únicas rotas abertas.
app.use("/api/auth", authRoutes);

// Daqui para baixo tudo exige sessão, e cada consulta é filtrada pelo
// barbeiro_id que veio do cookie assinado.
app.use("/api/clientes", exigirLogin, clientesRoutes);
app.use("/api/agendamentos", exigirLogin, agendaRoutes);
app.use("/api/fila", exigirLogin, filaRoutes);
app.use("/api/visitas", exigirLogin, visitasRoutes);
app.use("/api/dashboard", exigirLogin, dashboardRoutes);

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
