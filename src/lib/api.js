// Cliente HTTP da API. O Vite faz proxy de /api para o servidor Node em dev, e
// em produção os dois são servidos pela mesma origem — por isso o cookie de
// sessão viaja sozinho, sem token no localStorage.

export class ErroApi extends Error {
  constructor(mensagem, status) {
    super(mensagem);
    this.name = "ErroApi";
    this.status = status;
  }
}

async function pedir(metodo, caminho, corpo) {
  let resposta;
  try {
    resposta = await fetch(`/api${caminho}`, {
      method: metodo,
      headers: corpo === undefined ? undefined : { "Content-Type": "application/json" },
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
      credentials: "same-origin",
    });
  } catch {
    throw new ErroApi("Não foi possível falar com o servidor. Ele está rodando?", 0);
  }

  const texto = await resposta.text();
  let dados = null;
  try {
    dados = texto ? JSON.parse(texto) : null;
  } catch {
    // Resposta não-JSON (página de erro, proxy fora do ar, etc.)
    if (!resposta.ok) throw new ErroApi(`Erro ${resposta.status} no servidor.`, resposta.status);
  }

  if (!resposta.ok) {
    throw new ErroApi(dados?.erro || `Erro ${resposta.status} no servidor.`, resposta.status);
  }
  return dados;
}

const get = (c) => pedir("GET", c);
const post = (c, corpo) => pedir("POST", c, corpo ?? {});
const patch = (c, corpo) => pedir("PATCH", c, corpo);
const remove = (c) => pedir("DELETE", c);

export const api = {
  auth: {
    eu: () => get("/auth/me"),
    entrar: (dados) => post("/auth/login", dados),
    cadastrar: (dados) => post("/auth/register", dados),
    sair: () => post("/auth/logout"),
  },
  clientes: {
    listar: () => get("/clientes"),
    criar: (dados) => post("/clientes", dados),
    atualizar: (id, dados) => patch(`/clientes/${id}`, dados),
    remover: (id) => remove(`/clientes/${id}`),
    visitas: (id) => get(`/clientes/${id}/visitas`),
    registrarVisita: (id, dados) => post(`/clientes/${id}/visitas`, dados),
    removerVisita: (id, visitaId) => remove(`/clientes/${id}/visitas/${visitaId}`),
  },
  agenda: {
    listar: (inicio, fim) => get(`/agendamentos?inicio=${inicio}&fim=${fim}`),
    criar: (dados) => post("/agendamentos", dados),
    cancelar: (id) => post(`/agendamentos/${id}/cancelar`),
    pagar: (id) => post(`/agendamentos/${id}/pagar`),
    remover: (id) => remove(`/agendamentos/${id}`),
  },
  fila: {
    listar: () => get("/fila"),
    entrar: (dados) => post("/fila", dados),
    atender: (id, dados) => post(`/fila/${id}/atender`, dados),
    remover: (id) => remove(`/fila/${id}`),
  },
  visitas: {
    listar: (limite = 20) => get(`/visitas?limite=${limite}`),
    resumo: () => get("/visitas/resumo"),
  },
  dashboard: {
    carregar: () => get("/dashboard"),
  },
};
