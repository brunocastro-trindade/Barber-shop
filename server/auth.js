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
const COOKIE_CLIENTE = "cc_cliente";
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias

// Os dois tipos de sessão usam a mesma chave, então o token carrega `tipo` e
// cada middleware exige o seu. Sem isso, bastaria copiar o valor do cookie de
// cliente para o cookie de dono para virar dono da barbearia.
const TIPO_BARBEIRO = "barbeiro";
const TIPO_CLIENTE = "cliente";

const opcoesCookie = {
  httpOnly: true,                                  // fora do alcance de JS no browser
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",   // exige HTTPS em produção
  maxAge: MAX_AGE_MS,
  path: "/",
};

export function criarSessao(res, barbeiroId) {
  const token = jwt.sign({ sub: barbeiroId, tipo: TIPO_BARBEIRO }, SECRET, { expiresIn: "7d" });
  res.cookie(COOKIE, token, opcoesCookie);
}

export function encerrarSessao(res) {
  res.clearCookie(COOKIE, { path: "/" });
}

export function criarSessaoCliente(res, clienteId) {
  const token = jwt.sign({ sub: clienteId, tipo: TIPO_CLIENTE }, SECRET, { expiresIn: "7d" });
  res.cookie(COOKIE_CLIENTE, token, opcoesCookie);
}

export function encerrarSessaoCliente(res) {
  res.clearCookie(COOKIE_CLIENTE, { path: "/" });
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

  // Token de cliente não vira sessão de dono. Tokens antigos (anteriores ao
  // campo `tipo`) não têm a marca e seguem valendo como barbeiro.
  if (payload.tipo === TIPO_CLIENTE) {
    encerrarSessao(res);
    return res.status(401).json({ erro: "Não autenticado" });
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

// Middleware da área do cliente: exige sessão de cliente e injeta req.clienteId.
//
// Existe pelo mesmo motivo do `exigirLogin`: antes, o id do cliente viajava na
// URL (`/publico/clientes/:clienteId/horarios`) e o servidor confiava nele. Quem
// tivesse um id lia o histórico, os valores gastos e cancelava agendamentos de
// outra pessoa. Agora o id só vem do cookie assinado, e a URL não tem como
// contradizê-lo.
export async function exigirCliente(req, res, next) {
  const token = req.cookies?.[COOKIE_CLIENTE];
  if (!token) return res.status(401).json({ erro: "Não autenticado" });

  let payload;
  try {
    payload = jwt.verify(token, SECRET);
  } catch {
    encerrarSessaoCliente(res);
    return res.status(401).json({ erro: "Sessão expirada" });
  }

  if (payload.tipo !== TIPO_CLIENTE) {
    encerrarSessaoCliente(res);
    return res.status(401).json({ erro: "Não autenticado" });
  }

  const [cliente] = await sql`
    select id, nome, telefone, tipo, barbeiro_id
    from clientes
    where id = ${payload.sub}
  `;
  if (!cliente) {
    encerrarSessaoCliente(res);
    return res.status(401).json({ erro: "Cadastro não encontrado" });
  }

  req.clienteId = cliente.id;
  req.cliente = cliente;
  next();
}
