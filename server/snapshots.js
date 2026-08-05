import { sql } from "./db.js";

// Resolve serviço, barbeiro e cliente dentro da barbearia e devolve os dados
// que serão CONGELADOS no atendimento.
//
// A regra: o id aponta para o cadastro atual, mas nome, preço e comissão são
// cópias do dia. Reajustar um preço amanhã não pode reescrever o que foi pago
// ontem, e remover um barbeiro não pode apagar o nome de quem atendeu.
//
// Também é a barreira de posse: só resolve o que pertence a esta barbearia,
// então um id de outra conta simplesmente não existe daqui.

export async function resolverServico(barbeiroId, servicoId) {
  if (!servicoId) return null;
  const [s] = await sql`
    select id, nome, duracao_min, preco::float8, comissao_pct::float8
    from servicos
    where id = ${servicoId} and barbeiro_id = ${barbeiroId}
  `;
  return s || null;
}

export async function resolverEquipe(barbeiroId, equipeId) {
  if (!equipeId) return null;
  const [e] = await sql`
    select id, nome from equipe
    where id = ${equipeId} and barbeiro_id = ${barbeiroId}
  `;
  return e || null;
}

export async function resolverCliente(barbeiroId, clienteId) {
  if (!clienteId) return null;
  const [c] = await sql`
    select id, nome from clientes
    where id = ${clienteId} and barbeiro_id = ${barbeiroId}
  `;
  return c || null;
}

// Insere a visita com tudo congelado. `valor` e `comissaoPct` podem vir
// explícitos (o dono ajustou na hora) ou herdar o que o serviço cobrava.
// `data` nula cai no dia corrente em Brasília, resolvido pelo próprio banco.
export function inserirVisita({
  barbeiroId, cliente, servico, equipe,
  valor, comissaoPct, origem, data = null,
}) {
  return sql`
    insert into visitas (
      barbeiro_id, cliente_id, cliente_nome, servico_id, servico_nome,
      equipe_id, equipe_nome, data, valor, comissao_pct, origem
    ) values (
      ${barbeiroId},
      ${cliente?.id ?? null}, ${cliente?.nome ?? "Sem ficha"},
      ${servico?.id ?? null}, ${servico?.nome ?? "Serviço avulso"},
      ${equipe?.id ?? null},  ${equipe?.nome ?? ""},
      coalesce(${data}::date, (now() at time zone 'America/Sao_Paulo')::date),
      ${valor ?? servico?.preco ?? 0},
      ${comissaoPct ?? servico?.comissao_pct ?? 0},
      ${origem}
    )
  `;
}
