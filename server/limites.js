// Limites do plano, lidos do banco.
//
// O teto de funcionários por unidade é definido UMA vez, na função
// `cc_limite_equipe_por_unidade()` em db/schema.sql, e o banco o impõe por
// trigger. Este módulo apenas lê aquele valor para a API poder devolver uma
// mensagem decente e a tela mostrar "2 de 3" — nunca para decidir sozinho.
//
// A alternativa seria repetir o `3` aqui. Um limite escrito em dois lugares
// vira dois limites diferentes no dia em que alguém mudar só um deles: a tela
// prometeria 5 vagas e o banco recusaria a quarta.

import { sql } from "./db.js";

let cache = null;

export async function limiteEquipePorUnidade() {
  if (cache !== null) return cache;
  const [linha] = await sql`select cc_limite_equipe_por_unidade() as teto`;
  cache = Number(linha.teto);
  return cache;
}

// A trigger sinaliza o estouro com 'LIMITE_EQUIPE_UNIDADE:<teto>'. Traduzir
// aqui mantém a regra no banco e a mensagem em português numa camada só.
export const ehEstouroDeEquipe = (e) =>
  typeof e?.message === "string" && e.message.includes("LIMITE_EQUIPE_UNIDADE");

export const mensagemEstouro = (teto) =>
  `Esta unidade já tem ${teto} funcionários ativos, o limite da fase de validação. ` +
  `Desative alguém que saiu ou crie outra unidade.`;
