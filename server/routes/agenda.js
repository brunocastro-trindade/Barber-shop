import { Router } from "express";
import { sql } from "../db.js";

const router = Router();

const DATA_ISO = /^\d{4}-\d{2}-\d{2}$/;

router.get("/", async (req, res) => {
  const { inicio, fim } = req.query;
  if (!DATA_ISO.test(inicio || "") || !DATA_ISO.test(fim || "")) {
    return res.status(400).json({ erro: "Informe inicio e fim no formato YYYY-MM-DD." });
  }

  const agendamentos = await sql`
    select id, cliente_id, cliente_nome, to_char(data, 'YYYY-MM-DD') as data,
           hora, servico, profissional, valor::float8, status
    from agendamentos
    where barbeiro_id = ${req.barbeiroId} and data between ${inicio} and ${fim}
    order by data, hora
  `;
  res.json(agendamentos);
});

router.post("/", async (req, res) => {
  const { data, hora, servico } = req.body || {};
  const clienteNome = (req.body?.cliente_nome || "").trim();

  if (!DATA_ISO.test(data || "")) return res.status(400).json({ erro: "Data inválida." });
  if (!hora) return res.status(400).json({ erro: "Informe o horário." });
  if (!clienteNome) return res.status(400).json({ erro: "Informe o cliente." });
  if (!servico) return res.status(400).json({ erro: "Informe o serviço." });

  // Só aceita vincular a um cliente que pertença a esta conta.
  let clienteId = null;
  if (req.body?.cliente_id) {
    const [cliente] = await sql`
      select id from clientes where id = ${req.body.cliente_id} and barbeiro_id = ${req.barbeiroId}
    `;
    clienteId = cliente?.id ?? null;
  }

  const [ocupado] = await sql`
    select id from agendamentos
    where barbeiro_id = ${req.barbeiroId} and data = ${data} and hora = ${hora}
      and profissional = ${req.body?.profissional || ""} and status <> 'Cancelado'
  `;
  if (ocupado) return res.status(409).json({ erro: "Esse barbeiro já tem horário marcado nesse dia e hora." });

  const [novo] = await sql`
    insert into agendamentos (barbeiro_id, cliente_id, cliente_nome, data, hora, servico, profissional, valor)
    values (${req.barbeiroId}, ${clienteId}, ${clienteNome}, ${data}, ${hora}, ${servico},
            ${req.body?.profissional || ""}, ${Number(req.body?.valor) || 0})
    returning id, cliente_id, cliente_nome, to_char(data, 'YYYY-MM-DD') as data,
              hora, servico, profissional, valor::float8, status
  `;
  res.status(201).json(novo);
});

router.post("/:id/cancelar", async (req, res) => {
  const [ag] = await sql`
    update agendamentos set status = 'Cancelado'
    where id = ${req.params.id} and barbeiro_id = ${req.barbeiroId} and status <> 'Pago'
    returning id, cliente_id, cliente_nome, to_char(data, 'YYYY-MM-DD') as data,
              hora, servico, profissional, valor::float8, status
  `;
  if (!ag) return res.status(404).json({ erro: "Agendamento não encontrado ou já pago." });
  res.json(ag);
});

// Dar baixa no pagamento gera a visita correspondente — é ela que alimenta o
// histórico do cliente, o financeiro e os KPIs.
router.post("/:id/pagar", async (req, res) => {
  const [ag] = await sql`
    select id, cliente_id, cliente_nome, to_char(data, 'YYYY-MM-DD') as data,
           hora, servico, profissional, valor::float8, status
    from agendamentos
    where id = ${req.params.id} and barbeiro_id = ${req.barbeiroId}
  `;
  if (!ag) return res.status(404).json({ erro: "Agendamento não encontrado." });
  if (ag.status === "Pago") return res.status(409).json({ erro: "Este agendamento já foi pago." });
  if (ag.status === "Cancelado") return res.status(409).json({ erro: "Este agendamento foi cancelado." });

  await sql.transaction([
    sql`update agendamentos set status = 'Pago' where id = ${ag.id} and barbeiro_id = ${req.barbeiroId}`,
    sql`
      insert into visitas (barbeiro_id, cliente_id, cliente_nome, data, servico, profissional, valor, origem)
      values (${req.barbeiroId}, ${ag.cliente_id}, ${ag.cliente_nome}, ${ag.data},
              ${ag.servico}, ${ag.profissional}, ${ag.valor}, 'agenda')
    `,
  ]);

  res.json({ ...ag, status: "Pago" });
});

router.delete("/:id", async (req, res) => {
  const apagados = await sql`
    delete from agendamentos where id = ${req.params.id} and barbeiro_id = ${req.barbeiroId}
    returning id
  `;
  if (!apagados.length) return res.status(404).json({ erro: "Agendamento não encontrado." });
  res.json({ ok: true });
});

export default router;
