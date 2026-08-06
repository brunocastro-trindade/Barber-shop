// ── Dinheiro ──────────────────────────────────────────────────────────────────

// Aceita "R$ 1.100", "R$ 12,50", "45.50" ou número e devolve number.
// Regra do ponto: com 3 dígitos depois (1.100) é separador de milhar; com 2
// (45.50) é decimal. A vírgula é sempre decimal.
export function paraNumero(valor) {
  if (typeof valor === "number") return Number.isFinite(valor) ? valor : 0;
  if (!valor) return 0;

  let s = String(valor).replace(/[^\d.,-]/g, "");
  if (s.includes(",")) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else {
    const partes = s.split(".");
    if (partes.length > 1 && partes[partes.length - 1].length !== 2) s = s.replace(/\./g, "");
  }

  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

export const emReais = (n) =>
  (Number(n) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// Versão curta para KPIs: R$ 18,4k
export const emReaisCurto = (n) => {
  const v = Number(n) || 0;
  if (Math.abs(v) >= 1000) return `R$ ${(v / 1000).toFixed(1).replace(".", ",")}k`;
  return emReais(v);
};

// ── Datas (sempre no fuso local, no formato YYYY-MM-DD) ───────────────────────
// Nunca usar toISOString() para extrair o dia: ele converte para UTC e, no
// Brasil, joga qualquer horário depois das 21h para o dia seguinte.

export const paraISO = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const hojeISO = () => paraISO(new Date());

export const doISO = (iso) => {
  const [ano, mes, dia] = String(iso).split("-").map(Number);
  return new Date(ano, mes - 1, dia);
};

export const somarDias = (iso, dias) => {
  const d = doISO(iso);
  d.setDate(d.getDate() + dias);
  return paraISO(d);
};

// Segunda-feira da semana que contém a data.
export const segundaDaSemana = (iso) => {
  const d = doISO(iso);
  const diaSemana = d.getDay();                       // 0 = domingo
  d.setDate(d.getDate() + (diaSemana === 0 ? -6 : 1 - diaSemana));
  return paraISO(d);
};

const NOMES_DIA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export const rotuloDia = (iso) => {
  const d = doISO(iso);
  return `${NOMES_DIA[d.getDay()]} ${String(d.getDate()).padStart(2, "0")}`;
};

export const dataCurta = (iso) => {
  if (!iso) return "Nenhuma";
  const d = doISO(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export const periodoDaSemana = (inicioISO, fimISO) => {
  const i = doISO(inicioISO);
  const f = doISO(fimISO);
  const mes = f.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return `Semana de ${i.getDate()} a ${f.getDate()} de ${mes}`;
};
