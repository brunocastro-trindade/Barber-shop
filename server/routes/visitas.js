import { Router } from "express";
import { sql } from "../db.js";

const router = Router();

// Lista de atendimentos — alimenta os "Pagamentos recentes" do financeiro.
router.get("/", async (req, res) => {
  const limite = Math.min(Math.max(Number(req.query.limite) || 20, 1), 200);
  const visitas = await sql`
    select id, cliente_id, cliente_nome, to_char(data, 'YYYY-MM-DD') as data,
           servico, profissional, valor::float8, origem
    from visitas
    where barbeiro_id = ${req.barbeiroId}
    order by data desc, criado_em desc
    limit ${limite}
  `;
  res.json(visitas);
});

router.get("/resumo", async (req, res) => {
  const id = req.barbeiroId;

  const [mes, porServico, meses] = await Promise.all([
    sql`
      select coalesce(sum(valor), 0)::float8 as receita, count(*)::int as atendimentos
      from visitas
      where barbeiro_id = ${id}
        and data >= date_trunc('month', (now() at time zone 'America/Sao_Paulo')::date)
    `,
    sql`
      select servico, coalesce(sum(valor), 0)::float8 as total, count(*)::int as qtd
      from visitas
      where barbeiro_id = ${id}
        and data >= date_trunc('month', (now() at time zone 'America/Sao_Paulo')::date)
      group by servico
      order by total desc
      limit 5
    `,
    sql`
      select to_char(d, 'YYYY-MM')                 as mes,
             coalesce(sum(v.valor), 0)::float8     as total
      from generate_series(
             date_trunc('month', (now() at time zone 'America/Sao_Paulo')::date) - interval '5 months',
             date_trunc('month', (now() at time zone 'America/Sao_Paulo')::date),
             interval '1 month') d
      left join visitas v
        on date_trunc('month', v.data) = d and v.barbeiro_id = ${id}
      group by d
      order by d
    `,
  ]);

  res.json({
    receitaMes: mes[0]?.receita ?? 0,
    atendimentosMes: mes[0]?.atendimentos ?? 0,
    porServico,
    meses,
  });
});

export default router;
