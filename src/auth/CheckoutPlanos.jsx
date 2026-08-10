import { useState } from "react";
import { Check, CreditCard, QrCode, ShieldCheck, Zap } from "lucide-react";
import { B, N } from "../ui/tokens.js";
import { Girando } from "../ui/base.jsx";

// Os limites por plano descritos aqui NAO sao aplicados pelo sistema.
//
// Estas telas prometiam "1 barbeiro", "ate 5" e "ilimitados" conforme o plano.
// O sistema impoe 3 funcionarios ativos POR UNIDADE para todo mundo — o teto
// vem de `cc_limite_equipe_por_unidade()` em db/schema.sql — e o plano
// escolhido aqui nao e gravado em lugar nenhum: nao ha coluna, nao ha cobranca
// e nada muda de comportamento depois do cadastro.
//
// Enquanto for assim, o texto diz a verdade. Ao ligar os planos de verdade
// (gravar a escolha e derivar o teto dela), estes rotulos mudam junto — e o
// numero abaixo precisa acompanhar a funcao do banco.
const PLANOS = [
  {
    id: "solo",
    nome: "Solo",
    sub: "Ideal para barbeiros autônomos",
    mensal: "Sob consulta",
    anual: "Sob consulta",
    recursos: [
      "Até 3 funcionários por unidade",
      "Agendamentos ilimitados",
      "Área do Cliente mobile",
      "Fila de espera em tempo real",
      "Ficha de clientes & histórico",
      "Suporte via WhatsApp",
    ],
  },
  {
    id: "equipe",
    nome: "Equipe",
    sub: "Ideal para barbearias em crescimento",
    destaque: true,
    mensal: "Sob consulta",
    anual: "Sob consulta",
    recursos: [
      "Até 3 funcionários por unidade",
      "Comissão automática por barbeiro",
      "Agendamentos & Fila em tempo real",
      "Controle financeiro & estoque",
      "Relatórios de faturamento",
      "Todas as funções do plano Solo",
    ],
  },
  {
    id: "pro",
    nome: "Pro / Redes",
    sub: "Para barbearias de grande fluxo e redes",
    mensal: "Sob consulta",
    anual: "Sob consulta",
    recursos: [
      "Até 3 funcionários por unidade",
      "Múltiplas unidades / filiais",
      "Exportação completa em PDF",
      "Suporte prioritário 24/7",
      "Gestão avançada de assinaturas",
      "Todas as funções do plano Equipe",
    ],
  },
];

const moldura = {
  minHeight: "100vh",
  background: "#121418",
  color: B.text,
  fontFamily: '"Coolvetica", system-ui, sans-serif',
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "40px 24px",
  position: "relative",
  overflow: "hidden",
};

const cartao = {
  background: "#1D212A",
  border: `1px solid ${B.border}`,
  borderRadius: 18,
  padding: 32,
  boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
};

export const CheckoutPlanos = ({ onConcluir, onBack, onLogin }) => {
  const [passo, setPasso] = useState(1);
  const [ciclo, setCiclo] = useState("mensal"); // "mensal" | "anual"
  const [planoSel, setPlanoSel] = useState(PLANOS[1]); // Equipe por padrão
  const [metodo, setMetodo] = useState("pix"); // "pix" | "cartao"
  const [processando, setProcessando] = useState(false);

  const avancarParaPagamento = (plano) => {
    setPlanoSel(plano);
    setPasso(2);
  };

  const confirmarPagamento = () => {
    setProcessando(true);
    setTimeout(() => {
      setProcessando(false);
      onConcluir({
        plano: planoSel.nome,
        ciclo: ciclo === "anual" ? "Anual" : "Mensal",
        metodo,
      });
    }, 1200);
  };

  return (
    <div style={moldura}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", background: `radial-gradient(ellipse 70% 60% at 50% 30%, ${N.color}20 0%, ${N.color}06 50%, transparent 75%)` }} />

      <div style={{ width: "100%", maxWidth: passo === 1 ? 1040 : 480, position: "relative", zIndex: 1 }}>
        <button type="button" onClick={() => (passo === 2 ? setPasso(1) : onBack())}
          style={{ background: "transparent", border: "none", color: B.muted, fontSize: 13, cursor: "pointer", marginBottom: 20 }}>
          ← {passo === 2 ? "Voltar para escolha de planos" : "Voltar ao site"}
        </button>

        {passo === 1 && (
          <div>
            <div style={{ textAlign: "center", marginBottom: 36 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 999, background: `${N.color}1E`, border: `1px solid ${N.color}40`, fontSize: 12, fontWeight: 600, color: N.color, marginBottom: 14 }}>
                <Zap size={14} /> Passo 1 de 2 · Escolha do Plano
              </div>
              <h1 style={{ fontSize: 32, fontWeight: 800, color: "#fff", margin: "0 0 10px", letterSpacing: "-0.03em" }}>
                Escolha o plano ideal para seu negócio
              </h1>
              <p style={{ fontSize: 15, color: B.muted, margin: 0 }}>
                O acesso ao painel é liberado após a confirmação da assinatura.
              </p>

              {/* Os três planos exibem o mesmo limite de equipe porque é isso
                  que o sistema faz hoje. Sem este aviso, a repetição pareceria
                  erro de tela. */}
              <p style={{ fontSize: 13, color: B.dim, margin: "10px 0 0", lineHeight: 1.6, maxWidth: 560 }}>
                Fase de validação: todos os planos operam com o mesmo limite de
                equipe, e os preços ainda não estão definidos. A diferença entre
                eles passa a valer quando a cobrança começar.
              </p>

              {/* Toggle Mensal / Anual */}
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.05)", border: `1px solid ${B.border}`, padding: 4, borderRadius: 999, marginTop: 24 }}>
                <button type="button" onClick={() => setCiclo("mensal")}
                  style={{ padding: "8px 20px", borderRadius: 999, border: "none", background: ciclo === "mensal" ? N.color : "transparent", color: ciclo === "mensal" ? "#fff" : B.muted, fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all .2s" }}>
                  Cobrança Mensal
                </button>
                <button type="button" onClick={() => setCiclo("anual")}
                  style={{ padding: "8px 20px", borderRadius: 999, border: "none", background: ciclo === "anual" ? N.color : "transparent", color: ciclo === "anual" ? "#fff" : B.muted, fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all .2s", display: "flex", alignItems: "center", gap: 6 }}>
                  Cobrança Anual
                  <span style={{ fontSize: 10, background: "#22C55E", color: "#000", padding: "2px 6px", borderRadius: 999, fontWeight: 800 }}>-20% OFF</span>
                </button>
              </div>
            </div>

            {/* Cards dos Planos */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
              {PLANOS.map(p => {
                const ehDestaque = p.destaque;
                return (
                  <div key={p.id} style={{
                    ...cartao,
                    position: "relative",
                    border: ehDestaque ? `2px solid ${N.color}` : `1px solid ${B.border}`,
                    background: ehDestaque ? `linear-gradient(180deg, ${N.color}15 0%, #1D212A 100%)` : "#1D212A",
                    display: "flex",
                    flexDirection: "column",
                  }}>
                    {ehDestaque && (
                      <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", background: N.color, color: "#fff", fontSize: 10, fontWeight: 800, padding: "4px 14px", borderRadius: 999, textTransform: "uppercase", letterSpacing: ".08em", boxShadow: `0 4px 14px ${N.color}60` }}>
                        Mais Recomendado
                      </div>
                    )}

                    <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginBottom: 4 }}>{p.nome}</div>
                    <div style={{ fontSize: 12, color: B.muted, marginBottom: 20, minHeight: 36 }}>{p.sub}</div>

                    <div style={{ marginBottom: 24, padding: "16px 0", borderTop: `1px solid ${B.border}`, borderBottom: `1px solid ${B.border}` }}>
                      <div style={{ fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: "-0.5px" }}>
                        {ciclo === "anual" ? p.anual : p.mensal}
                        <span style={{ fontSize: 13, fontWeight: 400, color: B.muted }}> /mês</span>
                      </div>
                      <div style={{ fontSize: 11, color: N.color, fontWeight: 600, marginTop: 4 }}>Valores sob consulta (Em breve)</div>
                    </div>

                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
                      {p.recursos.map((rec, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, color: B.text }}>
                          <div style={{ width: 18, height: 18, borderRadius: "50%", background: `${N.color}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <Check size={11} color={N.color} strokeWidth={2.5} />
                          </div>
                          {rec}
                        </div>
                      ))}
                    </div>

                    <button type="button" onClick={() => avancarParaPagamento(p)}
                      style={{
                        width: "100%", padding: "12px", borderRadius: 12, border: "none",
                        background: ehDestaque ? N.color : "rgba(255,255,255,0.08)",
                        color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
                        boxShadow: ehDestaque ? `0 4px 18px ${N.color}50` : "none",
                        transition: "all .2s",
                      }}>
                      Escolher Plano {p.nome} →
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {passo === 2 && (
          <div style={cartao}>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 999, background: `${N.color}1E`, border: `1px solid ${N.color}40`, fontSize: 12, fontWeight: 600, color: N.color, marginBottom: 14 }}>
                <ShieldCheck size={14} /> Passo 2 de 2 · Pagamento Seguro
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: "#fff", margin: "0 0 6px" }}>
                Confirmação de Assinatura
              </h2>
              <p style={{ fontSize: 13, color: B.muted, margin: 0 }}>
                Seu plano só será cobrado após a definição final dos preços.
              </p>
            </div>

            {/* Resumo do Plano Selecionado */}
            <div style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${B.border}`, borderRadius: 12, padding: 16, marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Plano {planoSel.nome} ({ciclo === "anual" ? "Anual" : "Mensal"})</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: N.color }}>{ciclo === "anual" ? planoSel.anual : planoSel.mensal}</span>
              </div>
              <div style={{ fontSize: 11, color: B.muted }}>Acesso liberado imediatamente após a confirmação.</div>
            </div>

            {/* Opções de Pagamento */}
            <div style={{ fontSize: 11, fontWeight: 700, color: B.muted, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 10 }}>
              FORMA DE PAGAMENTO
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
              <div onClick={() => setMetodo("pix")} style={{
                padding: "14px", borderRadius: 12, border: `1px solid ${metodo === "pix" ? N.color : B.border}`,
                background: metodo === "pix" ? `${N.color}18` : "transparent", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 10, fontSize: 13, fontWeight: 600, color: "#fff",
              }}>
                <QrCode size={18} color={metodo === "pix" ? N.color : B.muted} /> PIX Instantâneo
              </div>
              <div onClick={() => setMetodo("cartao")} style={{
                padding: "14px", borderRadius: 12, border: `1px solid ${metodo === "cartao" ? N.color : B.border}`,
                background: metodo === "cartao" ? `${N.color}18` : "transparent", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 10, fontSize: 13, fontWeight: 600, color: "#fff",
              }}>
                <CreditCard size={18} color={metodo === "cartao" ? N.color : B.muted} /> Cartão de Crédito
              </div>
            </div>

            <button type="button" disabled={processando} onClick={confirmarPagamento}
              style={{
                width: "100%", padding: "14px", borderRadius: 12, border: "none",
                background: N.color, color: "#fff", fontSize: 14, fontWeight: 700, cursor: processando ? "wait" : "pointer",
                boxShadow: `0 4px 18px ${N.color}60`, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}>
              {processando ? <><Girando color="#fff" size={16} /> Confirmando assinatura...</> : "Confirmar Pagamento & Criar Conta →"}
            </button>

            <div style={{ marginTop: 20, textAlign: "center", fontSize: 12, color: B.muted }}>
              Já assinou anteriormente? <span onClick={onLogin} style={{ color: N.color, cursor: "pointer", fontWeight: 600 }}>Entrar na conta</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckoutPlanos;
