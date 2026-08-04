import { Router } from "express";
import { sql } from "../db.js";

const router = Router();

// "Hoje" é sempre o dia no fuso de Brasília, e não o UTC do servidor — por isso
// (now() at time zone 'America/Sao_Paulo')::date aparece no lugar de current_date.
router.get("/", async (req, res) => {
  const id = req.barbeiroId;

  const [mes, clientes, fila, semana, proximos, atividade] = await Promise.all([
    sql`
      select coalesce(sum(valor), 0)::float8 as receita,
             count(*)::int                   as atendimentos
      from visitas
      where barbeiro_id = ${id}
        and data >= date_trunc('month', (now() at time zone 'America/Sao_Paulo')::date)
    `,
    sql`
      select count(*)::int                                          as total,
             count(*) filter (where tipo = 'assinante')::int         as assinantes
      from clientes where barbeiro_id = ${id}
    `,
    sql`select count(*)::int as total from fila_espera where barbeiro_id = ${id}`,
    sql`
      -- Sem rótulo de dia aqui: to_char devolveria o nome em inglês conforme o
      -- lc_time do banco. O front formata a partir da data.
      select to_char(d::date, 'YYYY-MM-DD')    as data,
             coalesce(sum(v.valor), 0)::float8 as total
      from generate_series(
             (now() at time zone 'America/Sao_Paulo')::date - interval '6 days',
             (now() at time zone 'America/Sao_Paulo')::date,
             interval '1 day') d
      left join visitas v on v.data = d::date and v.barbeiro_id = ${id}
      group by d
      order by d
    `,
    sql`
      select id, cliente_nome, to_char(data, 'YYYY-MM-DD') as data, hora, servico,
             profissional, valor::float8
      from agendamentos
      where barbeiro_id = ${id}
        and status = 'Confirmado'
        and data >= (now() at time zone 'America/Sao_Paulo')::date
      order by data, hora
      limit 5
    `,
    sql`
      select cliente_nome, servico, valor::float8, origem,
             to_char(data, 'YYYY-MM-DD') as data, criado_em
      from visitas
      where barbeiro_id = ${id}
      order by criado_em desc
      limit 5
    `,
  ]);

  const receita = mes[0]?.receita ?? 0;
  const atendimentos = mes[0]?.atendimentos ?? 0;

  res.json({
    receitaMes: receita,
    atendimentosMes: atendimentos,
    ticketMedio: atendimentos ? receita / atendimentos : 0,
    clientes: clientes[0]?.total ?? 0,
    assinantes: clientes[0]?.assinantes ?? 0,
    naFila: fila[0]?.total ?? 0,
    semana,
    proximos,
    atividade,
  });
});

export default router;
