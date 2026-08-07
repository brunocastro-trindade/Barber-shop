import { Router } from "express";
import bcrypt from "bcryptjs";
import { sql } from "../db.js";
import { criarSessao, encerrarSessao, exigirLogin } from "../auth.js";
import { minutosDeBloqueio, registrarFalha, limparTentativas } from "../tentativas.js";

const router = Router();

const publico = (b) => ({
  id: b.id, nome: b.nome, barbearia: b.barbearia, email: b.email, whatsapp: b.whatsapp,
});

// Cadastro de barbeiros e salões (SaaS B2B): aberto para novos clientes do sistema.
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

  // A conta nasce vazia de catálogo e de dados de exemplo — mas COM uma
  // unidade. Todo funcionário pertence a uma unidade, e o teto de equipe é por
  // unidade; sem esta linha o primeiro cadastro de funcionário não teria onde
  // cair, e a conta abriria num estado impossível de usar.
  await sql`insert into unidades (barbeiro_id, nome) values (${barbeiro.id}, 'Unidade principal')`;

  criarSessao(res, barbeiro.id);
  res.status(201).json(publico(barbeiro));
});

router.post("/login", async (req, res) => {
  const email = (req.body?.email || "").trim().toLowerCase();
  const senha = req.body?.senha || "";
  if (!email || !senha) return res.status(400).json({ erro: "Preencha e-mail e senha." });

  // Bloqueio antes de tocar no banco: nem consulta, nem compara hash. Além de
  // barrar a adivinhação, evita gastar bcrypt (que é caro de propósito) com
  // quem já estourou o limite.
  const minutos = minutosDeBloqueio(email);
  if (minutos > 0) {
    return res.status(429).json({
      erro: `Muitas tentativas. Tente novamente em ${minutos} minuto${minutos > 1 ? "s" : ""}.`,
    });
  }

  const [barbeiro] = await sql`
    select id, nome, barbearia, email, whatsapp, senha_hash
    from barbeiros
    where lower(email) = ${email}
  `;

  // Mesma mensagem para e-mail inexistente e senha errada: não entrega para um
  // atacante quais e-mails estão cadastrados.
  const ok = barbeiro && (await bcrypt.compare(senha, barbeiro.senha_hash));
  if (!ok) {
    registrarFalha(email);
    return res.status(401).json({ erro: "E-mail ou senha incorretos." });
  }

  // Entrou: a contagem zera, para um erro de digitação de ontem não somar com o
  // de hoje.
  limparTentativas(email);
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
