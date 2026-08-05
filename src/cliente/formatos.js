// Formatação e estilos base da área do cliente. Ficam fora de ui.jsx porque
// aquele arquivo só exporta componentes (exigência do fast refresh do Vite).

import { LP } from "../lib/tema.js";
import { doISO } from "../lib/formato.js";

const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

export const diaSemana = (iso) => DIAS[doISO(iso).getDay()];
export const diaMes = (iso) => String(doISO(iso).getDate()).padStart(2, "0");

export const porExtenso = (iso) => {
  const d = doISO(iso);
  return `${DIAS[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]}`;
};

export const dataLonga = (d = new Date()) =>
  `${DIAS[d.getDay()]}, ${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`;

// Metros até uns 900; daí em diante, quilômetros.
export const distanciaCurta = (m) =>
  m >= 1000 ? `${(m / 1000).toFixed(1).replace(".", ",")} km` : `${m} m`;

export function mascaraTelefone(valor) {
  const d = String(valor || "").replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export const campoEstilo = {
  width: "100%", padding: "14px 16px", background: "rgba(255,255,255,0.04)",
  border: `1px solid ${LP.border}`, borderRadius: 14, color: LP.text,
  fontSize: 16, fontFamily: "inherit", outline: "none", boxSizing: "border-box",
};
