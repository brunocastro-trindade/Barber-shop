import { Router } from "express";
import { sql } from "../db.js";
import { resolverServico, resolverEquipe, resolverCliente } from "../snapshots.js";

const router = Router();

const DATA_ISO = /^\d{4}-\d{2}-\d{2}$/;
const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

// Nota: `hora_inicio` sempre sai como to_char(..., 'HH24:MI'), porque Postgres
// devolveria 'HH:MM:SS' e a grade da tela trabalha com 'HH:MM'.
// A visita do /pagar é inserida inline, dentro da transação, e não pelo helper
// de snapshots — os valores já vieram congelados do próprio agendamento.

router.get("/", async (req, res) => {
  const { inicio, fim } = req.query;
  if (!DATA_ISO.test(inicio || "") || !DATA_ISO.test(fim || "")) {
    return res.status(400).json({ erro: "Informe inicio e fim no formato YYYY-MM-DD." });
  }

  const agendamentos = await sql`
    select id, cliente_id, cliente_nome, servico_id, servico_nome, equipe_id, equipe_nome,
           to_char(data, 'YYYY-MM-DD')     as data,
           to_char(hora_inicio, 'HH24:MI') as hora_inicio,
           duracao_min, valor::float8, comissao_pct::float8, status
    from agendamentos
    where barbeiro_id = ${req.barbeiroId} and data between ${inicio} and ${fim}
    order by data, hora_inicio
  `;
  res.json(agendamentos);
});

router.post("/", async (req, res) => {
  const { data, hora_inicio } = req.body || {};
  if (!DATA_ISO.test(data || "")) return res.status(400).json({ erro: "Data inválida." });
  if (!HORA.test(hora_inicio || "")) return res.status(400).json({ erro: "Horário inválido." });

  const servico = await resolverServico(req.barbeiroId, req.body?.servico_id);
  if (!servico) return res.status(400).json({ erro: "Selecione um serviço do catálogo." });

  const equipe = await resolverEquipe(req.barbeiroId, req.body?.equipe_id);
  if (!equipe) return res.status(400).json({ erro: "Selecione o barbeiro que vai atender." });

  const cliente = await resolverCliente(req.barbeiroId, req.body?.cliente_id);
  const clienteNome = cliente?.nome || (req.body?.cliente_nome || "").trim();
  if (!clienteNome) return res.status(400).json({ erro: "Informe o cliente." });

  // Preço, comissão e duração são congelados aqui: mudar o catálogo depois não
  // altera este agendamento nem a visita que ele vai gerar.
  try {
    const [novo] = await sql`
      insert into agendamentos (
        barbeiro_id, cliente_id, cliente_nome, servico_id, servico_nome,
        equipe_id, equipe_nome, data, hora_inicio, duracao_min, valor, comissao_pct
      ) values (
        ${req.barbeiroId}, ${cliente?.id ?? null}, ${clienteNome},
        ${servico.id}, ${servico.nome}, ${equipe.id}, ${equipe.nome},
        ${data}, ${hora_inicio}, ${servico.duracao_min}, ${servico.preco}, ${servico.comissao_pct}
      )
      returning id, cliente_id, cliente_nome, servico_id, servico_nome, equipe_id, equipe_nome,
                to_char(data, 'YYYY-MM-DD')     as data,
                to_char(hora_inicio, 'HH24:MI') as hora_inicio,
                duracao_min, valor::float8, comissao_pct::float8, status
    `;
    res.status(201).json(novo);
  } catch (e) {
    // A restrição de exclusão do banco é a autoridade sobre choque de horário —
    // inclusive quando duas pessoas marcam ao mesmo tempo.
    if (e.message?.includes("agendamentos_sem_sobreposicao")) {
      const fim = new Date(`2000-01-01T${hora_inicio}:00`);
      fim.setMinutes(fim.getMinutes() + servico.duracao_min);
      const hhmm = fim.toTimeString().slice(0, 5);
      return res.status(409).json({
        erro: `${equipe.nome} já tem atendimento nesse intervalo (${hora_inicio}–${hhmm}).`,
      });
    }
    throw e;
  }
});

router.post("/:id/cancelar", async (req, res) => {
  const [ag] = await sql`
    update agendamentos set status = 'Cancelado'
    where id = ${req.params.id} and barbeiro_id = ${req.barbeiroId} and status <> 'Pago'
    returning id, status
  `;
  if (!ag) return res.status(404).json({ erro: "Agendamento não encontrado ou já pago." });
  res.json(ag);
});

// Dar baixa gera a visita correspondente — é ela que alimenta ficha, financeiro
// e comissões. Os valores vêm do agendamento, já congelados na criação.
router.post("/:id/pagar", async (req, res) => {
  const [ag] = await sql`
    select id, cliente_id, cliente_nome, servico_id, servico_nome, equipe_id, equipe_nome,
           to_char(data, 'YYYY-MM-DD') as data, valor::float8, comissao_pct::float8, status
    from agendamentos
    where id = ${req.params.id} and barbeiro_id = ${req.barbeiroId}
  `;
  if (!ag) return res.status(404).json({ erro: "Agendamento não encontrado." });
  if (ag.status === "Pago") return res.status(409).json({ erro: "Este agendamento já foi pago." });
  if (ag.status === "Cancelado") return res.status(409).json({ erro: "Este agendamento foi cancelado." });

  await sql.transaction([
    sql`update agendamentos set status = 'Pago' where id = ${ag.id} and barbeiro_id = ${req.barbeiroId}`,
    sql`
      insert into visitas (
        barbeiro_id, cliente_id, cliente_nome, servico_id, servico_nome,
        equipe_id, equipe_nome, data, valor, comissao_pct, origem
      ) values (
        ${req.barbeiroId}, ${ag.cliente_id}, ${ag.cliente_nome},
        ${ag.servico_id}, ${ag.servico_nome}, ${ag.equipe_id}, ${ag.equipe_nome},
        ${ag.data}, ${ag.valor}, ${ag.comissao_pct}, 'agenda'
      )
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
