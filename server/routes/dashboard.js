import { Router } from "express";
import { sql } from "../db.js";

const router = Router();

// "Hoje" é sempre o dia no fuso de Brasília, e não o UTC do servidor — por isso
// (now() at time zone 'America/Sao_Paulo')::date no lugar de current_date.
router.get("/", async (req, res) => {
  const id = req.barbeiroId;

  const [mes, clientes, fila, assinaturas, semana, proximos, atividade, alertas] = await Promise.all([
    sql`
      select coalesce(sum(valor), 0)::float8                      as receita,
             count(*)::int                                        as atendimentos,
             coalesce(sum(valor * comissao_pct / 100), 0)::float8 as comissoes
      from visitas
      where barbeiro_id = ${id}
        and data >= date_trunc('month', (now() at time zone 'America/Sao_Paulo')::date)
    `,
    sql`
      select count(*)::int                                  as total,
             count(*) filter (where tipo = 'assinante')::int as assinantes
      from clientes where barbeiro_id = ${id}
    `,
    sql`select count(*)::int as total from fila_espera where barbeiro_id = ${id}`,
    sql`
      select count(*) filter (where status = 'ativa')::int as ativas,
             count(*) filter (
               where status = 'ativa'
                 and vencimento < (now() at time zone 'America/Sao_Paulo')::date
             )::int as vencidas,
             coalesce(sum(p.preco) filter (where a.status = 'ativa'), 0)::float8 as mrr
      from assinaturas a join planos p on p.id = a.plano_id
      where a.barbeiro_id = ${id}
    `,
    // Sem rótulo de dia aqui: to_char devolveria o nome em inglês conforme o
    // lc_time do banco. O front formata a partir da data.
    sql`
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
      select id, cliente_nome, servico_nome, equipe_nome,
             to_char(data, 'YYYY-MM-DD')     as data,
             to_char(hora_inicio, 'HH24:MI') as hora_inicio,
             duracao_min, valor::float8
      from agendamentos
      where barbeiro_id = ${id}
        and status = 'Confirmado'
        and data >= (now() at time zone 'America/Sao_Paulo')::date
      order by data, hora_inicio
      limit 5
    `,
    sql`
      select cliente_nome, servico_nome, equipe_nome, valor::float8, origem,
             to_char(data, 'YYYY-MM-DD') as data
      from visitas
      where barbeiro_id = ${id}
      order by criado_em desc
      limit 5
    `,
    sql`
      select count(*)::int as estoque_baixo
      from produtos where barbeiro_id = ${id} and quantidade < minimo
    `,
  ]);

  const receita = mes[0]?.receita ?? 0;
  const atendimentos = mes[0]?.atendimentos ?? 0;

  res.json({
    receitaMes: receita,
    atendimentosMes: atendimentos,
    comissoesMes: mes[0]?.comissoes ?? 0,
    ticketMedio: atendimentos ? receita / atendimentos : 0,
    clientes: clientes[0]?.total ?? 0,
    assinantes: clientes[0]?.assinantes ?? 0,
    naFila: fila[0]?.total ?? 0,
    assinaturasAtivas: assinaturas[0]?.ativas ?? 0,
    assinaturasVencidas: assinaturas[0]?.vencidas ?? 0,
    mrr: assinaturas[0]?.mrr ?? 0,
    estoqueBaixo: alertas[0]?.estoque_baixo ?? 0,
    semana,
    proximos,
    atividade,
  });
});

export default router;
