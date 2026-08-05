import { Router } from "express";
import { sql } from "../db.js";

const router = Router();

// Atendimentos realizados — alimenta os lançamentos do financeiro.
router.get("/", async (req, res) => {
  const limite = Math.min(Math.max(Number(req.query.limite) || 20, 1), 500);
  const visitas = await sql`
    select id, cliente_id, cliente_nome, servico_id, servico_nome, equipe_id, equipe_nome,
           to_char(data, 'YYYY-MM-DD') as data,
           valor::float8, comissao_pct::float8,
           round(valor * comissao_pct / 100, 2)::float8 as comissao_valor,
           origem
    from visitas
    where barbeiro_id = ${req.barbeiroId}
    order by data desc, criado_em desc
    limit ${limite}
  `;
  res.json(visitas);
});

router.get("/resumo", async (req, res) => {
  const id = req.barbeiroId;

  const [mes, porServico, meses, porBarbeiro] = await Promise.all([
    sql`
      select coalesce(sum(valor), 0)::float8                          as receita,
             count(*)::int                                            as atendimentos,
             coalesce(sum(valor * comissao_pct / 100), 0)::float8     as comissoes
      from visitas
      where barbeiro_id = ${id}
        and data >= date_trunc('month', (now() at time zone 'America/Sao_Paulo')::date)
    `,
    sql`
      select servico_nome, coalesce(sum(valor), 0)::float8 as total, count(*)::int as qtd
      from visitas
      where barbeiro_id = ${id}
        and data >= date_trunc('month', (now() at time zone 'America/Sao_Paulo')::date)
      group by servico_nome
      order by total desc
      limit 6
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
    // Comissão por barbeiro, com o percentual congelado de cada atendimento.
    sql`
      select coalesce(v.equipe_nome, 'Sem barbeiro')                  as equipe_nome,
             v.equipe_id,
             count(*)::int                                            as atendimentos,
             coalesce(sum(v.valor), 0)::float8                        as faturado,
             coalesce(sum(v.valor * v.comissao_pct / 100), 0)::float8 as comissao
      from visitas v
      where v.barbeiro_id = ${id}
        and v.data >= date_trunc('month', (now() at time zone 'America/Sao_Paulo')::date)
      group by v.equipe_id, v.equipe_nome
      order by faturado desc
    `,
  ]);

  res.json({
    receitaMes: mes[0]?.receita ?? 0,
    atendimentosMes: mes[0]?.atendimentos ?? 0,
    comissoesMes: mes[0]?.comissoes ?? 0,
    porServico,
    meses,
    porBarbeiro,
  });
});

export default router;
