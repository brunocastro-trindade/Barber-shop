import { Router } from "express";
import { sql } from "../db.js";
// A visita é inserida inline, dentro da transação que também tira o cliente da
// fila — as duas coisas precisam acontecer juntas ou nenhuma.
import { resolverServico, resolverEquipe, resolverCliente } from "../snapshots.js";

const router = Router();
const TIPOS = ["assinante", "avulso"];

router.get("/", async (req, res) => {
  const fila = await sql`
    select f.id, f.cliente_id, f.nome, f.servico_id, f.servico_nome, f.equipe_id, f.tipo,
           e.nome as equipe_nome,
           s.preco::float8 as preco,
           to_char(f.entrou_em at time zone 'America/Sao_Paulo', 'HH24:MI') as entrou
    from fila_espera f
    left join equipe   e on e.id = f.equipe_id
    left join servicos s on s.id = f.servico_id
    where f.barbeiro_id = ${req.barbeiroId}
    order by f.entrou_em
  `;
  res.json(fila);
});

router.post("/", async (req, res) => {
  const tipo = req.body?.tipo || "avulso";
  if (!TIPOS.includes(tipo)) return res.status(400).json({ erro: "Tipo de cliente inválido." });

  const servico = await resolverServico(req.barbeiroId, req.body?.servico_id);
  if (!servico) return res.status(400).json({ erro: "Selecione um serviço do catálogo." });

  // Barbeiro é opcional na fila: "qualquer um que liberar" é caso normal.
  const equipe = await resolverEquipe(req.barbeiroId, req.body?.equipe_id);

  const cliente = await resolverCliente(req.barbeiroId, req.body?.cliente_id);
  const nome = cliente?.nome || (req.body?.nome || "").trim();
  if (!nome) return res.status(400).json({ erro: "Informe o nome do cliente." });

  const [novo] = await sql`
    insert into fila_espera (barbeiro_id, cliente_id, nome, servico_id, servico_nome, equipe_id, tipo)
    values (${req.barbeiroId}, ${cliente?.id ?? null}, ${nome},
            ${servico.id}, ${servico.nome}, ${equipe?.id ?? null}, ${tipo})
    returning id, cliente_id, nome, servico_id, servico_nome, equipe_id, tipo,
              to_char(entrou_em at time zone 'America/Sao_Paulo', 'HH24:MI') as entrou
  `;
  res.status(201).json({ ...novo, equipe_nome: equipe?.nome ?? null, preco: servico.preco });
});

// Atender = sair da fila e virar visita, num movimento só.
router.post("/:id/atender", async (req, res) => {
  const [item] = await sql`
    select * from fila_espera where id = ${req.params.id} and barbeiro_id = ${req.barbeiroId}
  `;
  if (!item) return res.status(404).json({ erro: "Cliente não está na fila." });

  const servico = await resolverServico(req.barbeiroId, item.servico_id);

  // Quem entrou sem barbeiro definido precisa informar quem atendeu agora.
  const equipe = await resolverEquipe(req.barbeiroId, req.body?.equipe_id ?? item.equipe_id);
  if (!equipe) return res.status(400).json({ erro: "Informe qual barbeiro atendeu." });

  const cliente = item.cliente_id
    ? { id: item.cliente_id, nome: item.nome }
    : null;

  await sql.transaction([
    sql`
      insert into visitas (
        barbeiro_id, cliente_id, cliente_nome, servico_id, servico_nome,
        equipe_id, equipe_nome, valor, comissao_pct, origem
      ) values (
        ${req.barbeiroId}, ${cliente?.id ?? null}, ${item.nome},
        ${servico?.id ?? null}, ${item.servico_nome},
        ${equipe.id}, ${equipe.nome},
        ${req.body?.valor !== undefined ? Number(req.body.valor) : (servico?.preco ?? 0)},
        ${servico?.comissao_pct ?? 0},
        'fila'
      )
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
