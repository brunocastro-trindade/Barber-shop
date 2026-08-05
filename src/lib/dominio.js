// Vocabulário do domínio da barbearia — o que as telas precisam saber sobre as
// regras, sem saber desenhar nada.

import { B } from "../ui/tokens.js";

// Grade de horários que a agenda desenha. Almoço entre 12h e 14h, por isso o
// buraco. Não é regra de negócio: quem decide se dois atendimentos cabem juntos
// é a restrição de exclusão do banco, comparando intervalos reais.
export const HORARIOS = [
  "08:00", "09:00", "10:00", "11:00",
  "14:00", "15:00", "16:00", "17:00", "18:00", "19:00",
];

export const emMinutos = (hhmm) => {
  const [h, m] = String(hhmm || "0:0").split(":").map(Number);
  return h * 60 + m;
};

export const TIPO_CLIENTE = {
  assinante: { label: "Assinante", color: B.teal },
  avulso: { label: "Avulso", color: B.amber },
};

// Só os registros ativos: desativar tira das listas de escolha sem apagar o
// histórico de quem já foi atendido por eles.
export const somente = (lista, campo = "ativo") => (lista || []).filter(x => x[campo]);

// Opções de <select> a partir de uma lista do banco: sempre o id como valor,
// para nenhuma tela voltar a casar registro por nome — erro que já fez dois
// "Carlos" receberem a comissão um do outro.
export const opcoes = (lista, rotulo = (x) => x.nome) =>
  (lista || []).map(x => ({ valor: x.id, rotulo: rotulo(x) }));
