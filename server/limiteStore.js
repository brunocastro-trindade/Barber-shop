// Contador compartilhado para rate limit e bloqueio de login.
//
// Mora no Postgres, e não em memória, porque a aplicação pode rodar em mais de
// uma instância: com um `Map` por processo, o limite configurado virava o dobro
// (ou o triplo) sem ninguém perceber, e todo restart perdoava quem estava sendo
// barrado.
//
// Custo: uma ida ao banco por requisição limitada. É aceitável porque só as
// rotas sensíveis passam por aqui, e porque um limite só serve para alguma
// coisa se estiver certo justamente quando alguém está atacando.

import { sql } from "./db.js";

// Incrementa a contagem da chave dentro da janela e devolve o estado.
//
// É um único INSERT ... ON CONFLICT: ler-e-depois-escrever seriam dois passos,
// e requisições simultâneas leriam o mesmo valor antes de qualquer uma gravar —
// exatamente o cenário de uma rajada, que é quando o limite importa.
//
// `deslizante` decide o que acontece com o vencimento a cada acerto:
//   false → a janela é fixa: começa no primeiro evento e vence junto.
//           Serve para "N requisições a cada 15 minutos".
//   true  → a janela reinicia a cada evento. Serve para o bloqueio de login,
//           onde a contagem de erros precisa manter a porta fechada enquanto
//           as tentativas continuarem chegando.
export async function registrar(chave, janelaSegundos, { deslizante = false } = {}) {
  const [linha] = await sql`
    insert into limites_uso (chave, contagem, expira_em)
    values (${chave}, 1, now() + make_interval(secs => ${janelaSegundos}))
    on conflict (chave) do update set
      contagem = case
        when limites_uso.expira_em <= now() then 1
        else limites_uso.contagem + 1
      end,
      expira_em = case
        when limites_uso.expira_em <= now() or ${deslizante}
          then now() + make_interval(secs => ${janelaSegundos})
        else limites_uso.expira_em
      end
    returning contagem, extract(epoch from (expira_em - now()))::int as faltam
  `;
  return { contagem: linha.contagem, faltamSegundos: Math.max(0, linha.faltam) };
}

// Lê sem incrementar. Chave vencida ou inexistente conta como zerada.
export async function consultar(chave) {
  const [linha] = await sql`
    select contagem, extract(epoch from (expira_em - now()))::int as faltam
      from limites_uso
     where chave = ${chave} and expira_em > now()
  `;
  return linha
    ? { contagem: linha.contagem, faltamSegundos: Math.max(0, linha.faltam) }
    : { contagem: 0, faltamSegundos: 0 };
}

export async function zerar(chave) {
  await sql`delete from limites_uso where chave = ${chave}`;
}

// Varredura do que já venceu, para a tabela não crescer sem fim com chaves de
// visitantes de uma vez só. Roda a cada 10 minutos.
//
// `unref()` é o detalhe que importa: sem ele este timer seguraria o processo
// vivo e o encerramento em SIGTERM ficaria pendurado até o próximo disparo.
const timer = setInterval(() => {
  sql`delete from limites_uso where expira_em < now() - interval '1 hour'`
    .catch((e) => console.error(JSON.stringify({ nivel: "erro", onde: "limiteStore.limpeza", msg: e.message })));
}, 10 * 60 * 1000);
if (timer.unref) timer.unref();
