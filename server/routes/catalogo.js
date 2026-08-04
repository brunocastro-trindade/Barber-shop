import { sql } from "../db.js";
import { crudDeBarbearia, textoObrigatorio, numeroNaFaixa } from "../crud.js";

// Cadastros simples da barbearia. Cada um vira /api/equipe, /api/servicos, etc.

export const equipe = crudDeBarbearia({
  tabela: "equipe",
  colunas: ["nome", "ativo"],
  ordem: "ativo desc, nome",
  validar: (d) => textoObrigatorio(d.nome, "o nome do barbeiro"),
});

export const servicos = crudDeBarbearia({
  tabela: "servicos",
  colunas: ["nome", "duracao_min", "preco", "comissao_pct", "ativo"],
  ordem: "ativo desc, nome",
  validar: (d) =>
    textoObrigatorio(d.nome, "o nome do serviço") ||
    numeroNaFaixa(d.duracao_min, "A duração", 1, 480) ||
    numeroNaFaixa(d.preco, "O preço", 0, 1_000_000) ||
    numeroNaFaixa(d.comissao_pct, "A comissão", 0, 100),
});

export const produtos = crudDeBarbearia({
  tabela: "produtos",
  colunas: ["nome", "preco", "quantidade", "minimo"],
  ordem: "nome",
  validar: (d) =>
    textoObrigatorio(d.nome, "o nome do produto") ||
    numeroNaFaixa(d.preco, "O preço", 0, 1_000_000) ||
    numeroNaFaixa(d.quantidade, "A quantidade", 0, 1_000_000) ||
    numeroNaFaixa(d.minimo, "O estoque mínimo", 0, 1_000_000),
});

export const despesas = crudDeBarbearia({
  tabela: "despesas",
  colunas: ["descricao", "valor", "data", "status"],
  ordem: "data desc, criado_em desc",
  validar: (d) =>
    textoObrigatorio(d.descricao, "a descrição do gasto") ||
    numeroNaFaixa(d.valor, "O valor", 0, 1_000_000) ||
    (["Pago", "Pendente"].includes(d.status) ? null : "Status deve ser Pago ou Pendente."),
  // A data volta como texto para não sofrer conversão de fuso no caminho.
  aoListar: async (barbeiroId) => {
    const rows = await sql`
      select id, descricao, valor::float8, to_char(data, 'YYYY-MM-DD') as data, status
      from despesas where barbeiro_id = ${barbeiroId}
      order by data desc, criado_em desc
    `;
    return rows;
  },
});

export const planos = crudDeBarbearia({
  tabela: "planos",
  colunas: ["nome", "preco", "incluidos", "ativo"],
  ordem: "ativo desc, preco",
  validar: (d) =>
    textoObrigatorio(d.nome, "o nome do plano") ||
    numeroNaFaixa(d.preco, "O preço", 0, 1_000_000) ||
    (Array.isArray(d.incluidos) ? null : "Serviços incluídos deve ser uma lista."),
  // Traz quantos assinantes ativos cada plano tem, para a tela não precisar
  // de uma segunda chamada.
  aoListar: async (barbeiroId) => {
    const rows = await sql`
      select p.id, p.nome, p.preco::float8, p.incluidos, p.ativo,
             count(a.id) filter (where a.status = 'ativa')::int as assinantes
      from planos p
      left join assinaturas a on a.plano_id = p.id
      where p.barbeiro_id = ${barbeiroId}
      group by p.id
      order by p.ativo desc, p.preco
    `;
    return rows;
  },
});
