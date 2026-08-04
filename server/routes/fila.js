import { Router } from "express";
import { sql } from "../db.js";

const router = Router();

const TIPOS = ["assinante", "avulso"];

router.get("/", async (req, res) => {
  const fila = await sql`
    select id, cliente_id, nome, servico, profissional, tipo,
           to_char(entrou_em at time zone 'America/Sao_Paulo', 'HH24:MI') as entrou
    from fila_espera
    where barbeiro_id = ${req.barbeiroId}
    order by entrou_em
  `;
  res.json(fila);
});

router.post("/", async (req, res) => {
  const nome = (req.body?.nome || "").trim();
  const servico = (req.body?.servico || "").trim();
  const tipo = req.body?.tipo || "avulso";

  if (!nome) return res.status(400).json({ erro: "Informe o nome do cliente." });
  if (!servico) return res.status(400).json({ erro: "Informe o serviço." });
  if (!TIPOS.includes(tipo)) return res.status(400).json({ erro: "Tipo de cliente inválido." });

  let clienteId = null;
  if (req.body?.cliente_id) {
    const [cliente] = await sql`
      select id from clientes where id = ${req.body.cliente_id} and barbeiro_id = ${req.barbeiroId}
    `;
    clienteId = cliente?.id ?? null;
  }

  const [novo] = await sql`
    insert into fila_espera (barbeiro_id, cliente_id, nome, servico, profissional, tipo)
    values (${req.barbeiroId}, ${clienteId}, ${nome}, ${servico},
            ${req.body?.profissional || "Qualquer"}, ${tipo})
    returning id, cliente_id, nome, servico, profissional, tipo,
              to_char(entrou_em at time zone 'America/Sao_Paulo', 'HH24:MI') as entrou
  `;
  res.status(201).json(novo);
});

// Atender = tirar da fila e registrar a visita (entra no faturamento do dia).
router.post("/:id/atender", async (req, res) => {
  const [item] = await sql`
    select * from fila_espera where id = ${req.params.id} and barbeiro_id = ${req.barbeiroId}
  `;
  if (!item) return res.status(404).json({ erro: "Cliente não está na fila." });

  const profissional = item.profissional === "Qualquer"
    ? (req.body?.profissional || "")
    : item.profissional;

  await sql.transaction([
    sql`
      insert into visitas (barbeiro_id, cliente_id, cliente_nome, servico, profissional, valor, origem)
      values (${req.barbeiroId}, ${item.cliente_id}, ${item.nome}, ${item.servico},
              ${profissional}, ${Number(req.body?.valor) || 0}, 'fila')
    `,
    sql`delete from fila_espera where id = ${item.id} and barbeiro_id = ${req.barbeiroId}`,
  ]);

  res.json({ ok: true });
});

router.delete("/:id", async (req, res) => {
  const apagados = await sql`
    delete from fila_espera where id = ${req.params.id} and barbeiro_id = ${req.barbeiroId}
    returning id
  `;
  if (!apagados.length) return res.status(404).json({ erro: "Cliente não está na fila." });
  res.json({ ok: true });
});

export default router;
