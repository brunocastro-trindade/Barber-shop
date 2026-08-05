// Middleware leve de rate limiting por IP sem dependências externas.
// Protege a API contra ataques de força bruta, spam de requisições e consumo excessivo de recursos.

export function criarRateLimit({
  janelaMs = 15 * 60 * 1000,
  max = 100,
  mensagem = "Muitas requisições deste IP. Tente novamente em alguns minutos.",
} = {}) {
  const conexoes = new Map();

  // Limpeza periódica de IPs expirados a cada 5 minutos
  const timer = setInterval(() => {
    const agora = Date.now();
    for (const [ip, reg] of conexoes.entries()) {
      if (agora > reg.expiraEm) conexoes.delete(ip);
    }
  }, 5 * 60 * 1000);
  if (timer.unref) timer.unref();

  return (req, res, next) => {
    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.ip ||
      req.socket?.remoteAddress ||
      "127.0.0.1";

    const agora = Date.now();
    const reg = conexoes.get(ip) || { contagem: 0, expiraEm: agora + janelaMs };

    if (agora > reg.expiraEm) {
      reg.contagem = 1;
      reg.expiraEm = agora + janelaMs;
    } else {
      reg.contagem += 1;
    }

    conexoes.set(ip, reg);

    if (reg.contagem > max) {
      res.setHeader("Retry-After", Math.ceil(janelaMs / 1000));
      return res.status(429).json({ erro: mensagem });
    }

    next();
  };
}
