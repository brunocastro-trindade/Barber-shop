import { Router } from "express";
import bcrypt from "bcryptjs";
import { sql } from "../db.js";
import { criarSessao, encerrarSessao, exigirLogin } from "../auth.js";
import { criarDadosDemo } from "../seed.js";

const router = Router();

const publico = (b) => ({
  id: b.id, nome: b.nome, barbearia: b.barbearia, email: b.email, whatsapp: b.whatsapp,
});

router.post("/register", async (req, res) => {
  const nome = (req.body?.nome || "").trim();
  const barbearia = (req.body?.barbearia || "").trim();
  const whatsapp = (req.body?.whatsapp || "").trim();
  const email = (req.body?.email || "").trim().toLowerCase();
  const senha = req.body?.senha || "";

  if (!nome) return res.status(400).json({ erro: "Informe seu nome completo." });
  if (!barbearia) return res.status(400).json({ erro: "Informe o nome da barbearia." });
  if (!whatsapp) return res.status(400).json({ erro: "Informe seu WhatsApp." });
  if (!email.includes("@")) return res.status(400).json({ erro: "Informe um e-mail válido." });
  if (senha.length < 6) return res.status(400).json({ erro: "A senha deve ter pelo menos 6 caracteres." });

  const [existente] = await sql`select id from barbeiros where lower(email) = ${email}`;
  if (existente) return res.status(409).json({ erro: "Este e-mail já está cadastrado. Faça login." });

  const senhaHash = await bcrypt.hash(senha, 12);
  const [barbeiro] = await sql`
    insert into barbeiros (nome, barbearia, email, whatsapp, senha_hash)
    values (${nome}, ${barbearia}, ${email}, ${whatsapp}, ${senhaHash})
    returning id, nome, barbearia, email, whatsapp
  `;

  if (process.env.SEED_DEMO_DATA !== "false") {
    try {
      await criarDadosDemo(barbeiro.id);
    } catch (e) {
      // Dados de demonstração são um extra: se falharem, a conta continua válida.
      console.error("[seed] falha ao criar dados de demonstração:", e.message);
    }
  }

  criarSessao(res, barbeiro.id);
  res.status(201).json(publico(barbeiro));
});

router.post("/login", async (req, res) => {
  const email = (req.body?.email || "").trim().toLowerCase();
  const senha = req.body?.senha || "";
  if (!email || !senha) return res.status(400).json({ erro: "Preencha e-mail e senha." });

  const [barbeiro] = await sql`
    select id, nome, barbearia, email, whatsapp, senha_hash
    from barbeiros
    where lower(email) = ${email}
  `;

  // Mesma mensagem para e-mail inexistente e senha errada: não entrega para um
  // atacante quais e-mails estão cadastrados.
  const ok = barbeiro && (await bcrypt.compare(senha, barbeiro.senha_hash));
  if (!ok) return res.status(401).json({ erro: "E-mail ou senha incorretos." });

  criarSessao(res, barbeiro.id);
  res.json(publico(barbeiro));
});

router.post("/logout", (req, res) => {
  encerrarSessao(res);
  res.json({ ok: true });
});

router.get("/me", exigirLogin, (req, res) => {
  res.json(publico(req.barbeiro));
});

export default router;
