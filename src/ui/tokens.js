// Tokens visuais do painel.
//
// A área do cliente tem os seus (src/lib/tema.js) porque é outro produto, com
// outra linguagem visual: o painel é desktop-first e escuro; a área do cliente
// é mobile-first. Juntar os dois num tema só já foi tentado e só gerou tokens
// que ninguém sabia de quem eram.
import { Scissors } from "lucide-react";

export const B = {
  bg: "#121418", bg2: "#171A21", card: "#1D212A", card2: "#242934",
  border: "#2C3240", border2: "#394152",
  text: "#F1F5F9", muted: "#94A3B8", dim: "#64748B",
  purple: "#7C3AED", orange: "#FF5500", green: "#22C55E", red: "#EF4444", amber: "#FF5500", teal: "#14B8A6",
};

// Identidade da marca: Roxo principal (#7C3AED) com Laranja secundário (#FF5500)
export const N = {
  name: "Barbearia", icon: Scissors,
  color: "#7C3AED", secondary: "#FF5500",
};

// Base de todo campo de formulário do painel. Fica aqui, e não em base.jsx,
// porque um arquivo de componentes que também exporta constantes quebra o
// fast-refresh do Vite — o lint avisa.
export const inputBase = {
  background: B.bg2,
  border: `1px solid ${B.border}`,
  borderRadius: 11,
  color: B.text,
  fontFamily: "inherit",
  outline: "none",
};
