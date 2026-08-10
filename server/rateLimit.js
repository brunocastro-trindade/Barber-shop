// Rate limiting por IP, com a contagem compartilhada no banco.
//
// Protege a API contra força bruta, spam de requisições e consumo excessivo.
// A contagem vive em `limites_uso` (ver server/limiteStore.js), e não num Map
// deste processo: com mais de uma instância, um Map por processo faria o limite
// real ser N vezes o configurado.

import { registrar } from "./limiteStore.js";

export function criarRateLimit({
  janelaMs = 15 * 60 * 1000,
  max = 100,
  escopo = "geral",
  mensagem = "Muitas requisições deste IP. Tente novamente em alguns minutos.",
} = {}) {
  const janelaSegundos = Math.ceil(janelaMs / 1000);

  return async (req, res, next) => {
    // `req.ip` e NÃO o header X-Forwarded-For cru.
    //
    // Ler o header direto tornava este limitador decorativo: qualquer um manda
    // `X-Forwarded-For: <aleatório>` a cada requisição e cada uma delas conta
    // como um IP novo. O Express só confia nesse header quando `trust proxy`
    // está ligado (ver server/index.js), e aí respeitando a quantidade de
    // proxies configurada — o resto vira o endereço real do socket, que o
    // cliente não escolhe.
    const ip = req.ip || req.socket?.remoteAddress || "127.0.0.1";

    try {
      const { contagem, faltamSegundos } = await registrar(`ip:${escopo}:${ip}`, janelaSegundos);

      if (contagem > max) {
        res.setHeader("Retry-After", Math.max(1, faltamSegundos));
        return res.status(429).json({ erro: mensagem });
      }
    } catch (e) {
      // Banco fora do ar: deixa passar em vez de derrubar a aplicação inteira.
      // A alternativa seria recusar tudo — e sem banco a requisição vai falhar
      // adiante de qualquer jeito, com uma mensagem melhor do que "429".
      console.error(JSON.stringify({ nivel: "erro", onde: "rateLimit", msg: e.message }));
    }

    next();
  };
}
