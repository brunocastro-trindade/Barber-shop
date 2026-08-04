import jwt from "jsonwebtoken";
import { sql } from "./db.js";

const SECRET = process.env.JWT_SECRET;

if (!SECRET || SECRET.length < 32) {
  console.error(
    "\n[ControlCRM] JWT_SECRET ausente ou curta demais (mínimo 32 caracteres).\n" +
    "Gere uma com:  node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\"\n" +
    "e coloque em .env.local.\n"
  );
  process.exit(1);
}

const COOKIE = "cc_sessao";
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias

export function criarSessao(res, barbeiroId) {
  const token = jwt.sign({ sub: barbeiroId }, SECRET, { expiresIn: "7d" });
  res.cookie(COOKIE, token, {
    httpOnly: true,                                  // fora do alcance de JS no browser
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",   // exige HTTPS em produção
    maxAge: MAX_AGE_MS,
    path: "/",
  });
}

export function encerrarSessao(res) {
  res.clearCookie(COOKIE, { path: "/" });
}

// Middleware: exige sessão válida e injeta req.barbeiroId.
// Todas as rotas de dados passam por aqui — o id do dono NUNCA vem do corpo da
// requisição, sempre do cookie assinado, para uma conta não ler dados de outra.
export async function exigirLogin(req, res, next) {
  const token = req.cookies?.[COOKIE];
  if (!token) return res.status(401).json({ erro: "Não autenticado" });

  let payload;
  try {
    payload = jwt.verify(token, SECRET);
  } catch {
    encerrarSessao(res);
    return res.status(401).json({ erro: "Sessão expirada" });
  }

  const [barbeiro] = await sql`
    select id, nome, barbearia, email, whatsapp
    from barbeiros
    where id = ${payload.sub}
  `;
  if (!barbeiro) {
    encerrarSessao(res);
    return res.status(401).json({ erro: "Conta não encontrada" });
  }

  req.barbeiroId = barbeiro.id;
  req.barbeiro = barbeiro;
  next();
}
