import { Router } from "express";
import { sql } from "../db.js";

const router = Router();

// O sistema registra vencimento; a cobrança acontece fora dele. "Vencida" não é
// status gravado: é vencimento < hoje, calculado na consulta. Assim não depende
// de nenhuma rotina diária rodando para os números ficarem certos.
const CAMPOS = `
  a.id, a.cliente_id, a.plano_id, a.status,
  c.nome  as cliente_nome,
  p.nome  as plano_nome,
  p.preco::float8 as preco,
  to_char(a.inicio, 'YYYY-MM-DD')     as inicio,
  to_char(a.vencimento, 'YYYY-MM-DD') as vencimento,
  (a.status = 'ativa' and a.vencimento < (now() at time zone 'America/Sao_Paulo')::date) as vencida
`;

router.get("/", async (req, res) => {
  const linhas = await sql.query(
    `select ${CAMPOS}
     from assinaturas a
     join clientes c on c.id = a.cliente_id
     join planos   p on p.id = a.plano_id
     where a.barbeiro_id = $1
     order by a.status, a.vencimento`,
    [req.barbeiroId]
  );
  res.json(linhas);
});

router.post("/", async (req, res) => {
  const [cliente] = await sql`
    select id from clientes where id = ${req.body?.cliente_id} and barbeiro_id = ${req.barbeiroId}
  `;
  if (!cliente) return res.status(400).json({ erro: "Selecione um cliente da sua lista." });

  const [plano] = await sql`
    select id from planos where id = ${req.body?.plano_id} and barbeiro_id = ${req.barbeiroId}
  `;
  if (!plano) return res.status(400).json({ erro: "Selecione um plano válido." });

  try {
    const [nova] = await sql`
      insert into assinaturas (barbeiro_id, cliente_id, plano_id, vencimento)
      values (${req.barbeiroId}, ${cliente.id}, ${plano.id},
              ((now() at time zone 'America/Sao_Paulo')::date + interval '1 month')::date)
      returning id
    `;
    // Assinar marca o cliente como assinante na ficha — os dois lugares que
    // mostram isso passam a concordar.
    await sql`update clientes set tipo = 'assinante' where id = ${cliente.id} and barbeiro_id = ${req.barbeiroId}`;
    res.status(201).json(nova);
  } catch (e) {
    if (e.message?.includes("assinaturas_cliente_ativa_uk")) {
      return res.status(409).json({ erro: "Este cliente já tem uma assinatura ativa." });
    }
    throw e;
  }
});

// Baixa de pagamento: empurra o vencimento um mês à frente. Parte sempre do
// vencimento anterior, e não de hoje, para quem paga atrasado não ganhar dias.
router.post("/:id/pagar", async (req, res) => {
  const [ass] = await sql`
    update assinaturas
    set vencimento = (vencimento + interval '1 month')::date
    where id = ${req.params.id} and barbeiro_id = ${req.barbeiroId} and status = 'ativa'
    returning id, to_char(vencimento, 'YYYY-MM-DD') as vencimento
  `;
  if (!ass) return res.status(404).json({ erro: "Assinatura ativa não encontrada." });
  res.json(ass);
});

router.post("/:id/cancelar", async (req, res) => {
  const [ass] = await sql`
    update assinaturas set status = 'cancelada'
    where id = ${req.params.id} and barbeiro_id = ${req.barbeiroId} and status = 'ativa'
    returning id, cliente_id
  `;
  if (!ass) return res.status(404).json({ erro: "Assinatura ativa não encontrada." });

  await sql`update clientes set tipo = 'avulso' where id = ${ass.cliente_id} and barbeiro_id = ${req.barbeiroId}`;
  res.json({ ok: true });
});

export default router;
