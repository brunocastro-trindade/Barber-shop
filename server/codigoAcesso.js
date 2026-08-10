// Código de acesso do cliente à área pública.
//
// O barbeiro cadastra cada cliente à mão e entrega o código pessoalmente — é a
// prova de posse que substitui o SMS/WhatsApp que o projeto ainda não tem.
// Por isso o código é DITADO em voz alta no balcão, e o alfabeto reflete isso:
// sem O/0 e sem I/1, que se confundem falados e escritos.
//
// 32 símbolos em 6 posições = ~1,07 bilhão de combinações. Sozinho não seria
// grande coisa; o que segura a força bruta é precisar acertar o código E o
// telefone da mesma ficha, com o limite estrito de tentativas em
// server/index.js sobre /api/publico/identificar.

import { randomInt } from "node:crypto";

const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const TAMANHO = 6;

// randomInt (CSPRNG, sem viés de módulo) em vez de Math.random: é uma
// credencial, e Math.random é previsível a partir de saídas observadas.
export function gerarCodigoAcesso() {
  let codigo = "";
  for (let i = 0; i < TAMANHO; i++) codigo += ALFABETO[randomInt(ALFABETO.length)];
  return codigo;
}

// O cliente digita como quiser: minúscula, com espaço, com hífen.
export const normalizarCodigo = (valor) =>
  String(valor || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
