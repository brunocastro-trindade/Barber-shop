// Tokens visuais do painel.
//
// A área do cliente tem os seus (src/lib/tema.js) porque é outro produto, com
// outra linguagem visual: o painel é desktop-first e escuro; a área do cliente
// é mobile-first. Juntar os dois num tema só já foi tentado e só gerou tokens
// que ninguém sabia de quem eram.
import { Scissors } from "lucide-react";

export const B = {
  bg: "#060410", bg2: "#0B0817", card: "#100C1D", card2: "#161129",
  border: "#221B38", border2: "#2E2549",
  text: "#F2F0FA", muted: "#928CAB", dim: "#544E6B",
  green: "#22C55E", red: "#EF4444", amber: "#F59E0B", teal: "#14B8A6",
};

// Identidade da marca: só nome, ícone e cor. O catálogo (serviços, produtos,
// equipe, planos) vive no banco, por barbearia — a conta nasce vazia e o dono
// cadastra o que é dele.
export const N = {
  name: "Barbearia", icon: Scissors,
  color: "#8B5CF6", secondary: "#059669",
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
