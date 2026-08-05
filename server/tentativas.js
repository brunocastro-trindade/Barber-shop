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
// 3. Fica em memória, não no banco. O ataque que isto barra é adivinhação de
//    senha, e quem ataca não reinicia o nosso servidor. Reiniciar zera os
//    contadores, e é aceitável enquanto for um processo só. **Se um dia rodar
//    em mais de uma instância, isto precisa ir para o banco** — cada processo
//    teria a sua contagem, e o limite real viraria 3 × número de instâncias.

const MAX_FALHAS = 3;
const BLOQUEIO_MS = 15 * 60 * 1000;

// email → { falhas, bloqueadoAte }
const registro = new Map();

const chave = (email) => String(email || "").trim().toLowerCase();

// Varre o mapa de vez em quando para ele não crescer sem limite com e-mails
// tentados uma vez e nunca mais. Barato: roda a cada 200 chamadas.
let desdeALimpeza = 0;
function limparVencidos(agora) {
  if (++desdeALimpeza < 200) return;
  desdeALimpeza = 0;
  for (const [email, dados] of registro) {
    if (!dados.bloqueadoAte || dados.bloqueadoAte <= agora) registro.delete(email);
  }
}

// Devolve os minutos que faltam se estiver bloqueado, ou 0 se pode tentar.
export function minutosDeBloqueio(email) {
  const dados = registro.get(chave(email));
  if (!dados?.bloqueadoAte) return 0;

  const restante = dados.bloqueadoAte - Date.now();
  if (restante <= 0) {
    registro.delete(chave(email));
    return 0;
  }
  return Math.ceil(restante / 60000);
}

export function registrarFalha(email) {
  const agora = Date.now();
  limparVencidos(agora);

  const k = chave(email);
  const dados = registro.get(k) || { falhas: 0, bloqueadoAte: 0 };
  dados.falhas += 1;
  if (dados.falhas >= MAX_FALHAS) dados.bloqueadoAte = agora + BLOQUEIO_MS;
  registro.set(k, dados);
}

export function limparTentativas(email) {
  registro.delete(chave(email));
}
