import { Router } from "express";
import bcrypt from "bcryptjs";
import { sql } from "../db.js";
import { criarSessao, encerrarSessao, exigirLogin } from "../auth.js";

const router = Router();

const publico = (b) => ({
  id: b.id, nome: b.nome, barbearia: b.barbearia, email: b.email, whatsapp: b.whatsapp,
});

// Cadastro é fechado: exige um código de convite válido e ainda não usado.
// Isso mantém o produto no tamanho do suporte — a recuperação de senha é
// manual, então só faz sentido ter na base gente que você mesmo convidou.
router.post("/register", async (req, res) => {
  const nome = (req.body?.nome || "").trim();
  const barbearia = (req.body?.barbearia || "").trim();
  const whatsapp = (req.body?.whatsapp || "").trim();
  const email = (req.body?.email || "").trim().toLowerCase();
  const senha = req.body?.senha || "";
  const codigo = (req.body?.convite || "").trim();

  if (!codigo) return res.status(400).json({ erro: "Informe o código de convite." });
  if (!nome) return res.status(400).json({ erro: "Informe seu nome completo." });
  if (!barbearia) return res.status(400).json({ erro: "Informe o nome da barbearia." });
  if (!whatsapp) return res.status(400).json({ erro: "Informe seu WhatsApp." });
  if (!email.includes("@")) return res.status(400).json({ erro: "Informe um e-mail válido." });
  if (senha.length < 6) return res.status(400).json({ erro: "A senha deve ter pelo menos 6 caracteres." });

  const [convite] = await sql`
    select id, usado_em from convites where upper(codigo) = upper(${codigo})
  `;
  if (!convite) return res.status(403).json({ erro: "Código de convite inválido." });
  if (convite.usado_em) return res.status(409).json({ erro: "Este convite já foi utilizado." });

  const [existente] = await sql`select id from barbeiros where lower(email) = ${email}`;
  if (existente) return res.status(409).json({ erro: "Este e-mail já está cadastrado. Faça login." });

  const senhaHash = await bcrypt.hash(senha, 12);
  const [barbeiro] = await sql`
    insert into barbeiros (nome, barbearia, email, whatsapp, senha_hash)
    values (${nome}, ${barbearia}, ${email}, ${whatsapp}, ${senhaHash})
    returning id, nome, barbearia, email, whatsapp
  `;

  // Queima o convite só se ainda estiver livre. O `and usado_em is null` fecha
  // a corrida entre dois cadastros simultâneos com o mesmo código.
  const queimado = await sql`
    update convites set usado_em = now(), usado_por = ${barbeiro.id}
    where id = ${convite.id} and usado_em is null
    returning id
  `;
  if (!queimado.length) {
    await sql`delete from barbeiros where id = ${barbeiro.id}`;
    return res.status(409).json({ erro: "Este convite já foi utilizado." });
  }

  // A conta nasce vazia: sem catálogo padrão e sem dados de exemplo.
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
