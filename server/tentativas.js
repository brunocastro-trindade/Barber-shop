// Limite de tentativas de login.
//
// Três erros de senha e o e-mail fica bloqueado por 15 minutos. Acertar zera a
// contagem.
//
// ── Três decisões que valem estar escritas ───────────────────────────────────
//
// 1. A contagem é por E-MAIL, não por IP. Por IP, um atacante com IPs rotativos
//    passa direto; e vários funcionários atrás do mesmo IP de loja se
//    bloqueariam entre si. O preço dessa escolha é que alguém que saiba o
//    e-mail do dono pode trancá-lo de fora por 15 min de propósito. Num piloto
//    fechado o risco é baixo, e a janela é curta justamente por isso.
//
// 2. O contador sobe MESMO para e-mail que não existe. Se só contasse para
//    e-mail cadastrado, a diferença de comportamento entregaria quais e-mails
//    estão na base — a mesma razão pela qual "e-mail ou senha incorretos" é uma
//    mensagem só.
//
// 3. Fica no BANCO, não em memória. Era um `Map` deste processo, e o próprio
//    comentário aqui avisava: com mais de uma instância, cada uma teria a sua
//    contagem e o limite real viraria 3 × número de instâncias. Reiniciar o
//    servidor também perdoava quem estava sendo barrado — e reiniciar é coisa
//    que todo deploy faz. Agora as instâncias somam a mesma contagem.

import { registrar, consultar, zerar } from "./limiteStore.js";

const MAX_FALHAS = 3;
const BLOQUEIO_SEGUNDOS = 15 * 60;

const chave = (email) => `login:${String(email || "").trim().toLowerCase()}`;

// Devolve os minutos que faltam se estiver bloqueado, ou 0 se pode tentar.
export async function minutosDeBloqueio(email) {
  try {
    const { contagem, faltamSegundos } = await consultar(chave(email));
    if (contagem < MAX_FALHAS || faltamSegundos <= 0) return 0;
    return Math.ceil(faltamSegundos / 60);
  } catch (e) {
    // Sem banco não há login de qualquer forma: a consulta seguinte falharia.
    // Deixar passar aqui dá a mensagem certa em vez de um 429 enganoso.
    console.error(JSON.stringify({ nivel: "erro", onde: "tentativas.consultar", msg: e.message }));
    return 0;
  }
}

export async function registrarFalha(email) {
  try {
    // Janela deslizante: cada erro novo empurra o vencimento para 15 minutos à
    // frente. Sem isso, quem errasse três vezes no fim da janela seria liberado
    // segundos depois.
    await registrar(chave(email), BLOQUEIO_SEGUNDOS, { deslizante: true });
  } catch (e) {
    console.error(JSON.stringify({ nivel: "erro", onde: "tentativas.registrar", msg: e.message }));
  }
}

export async function limparTentativas(email) {
  try {
    await zerar(chave(email));
  } catch (e) {
    console.error(JSON.stringify({ nivel: "erro", onde: "tentativas.zerar", msg: e.message }));
  }
}
