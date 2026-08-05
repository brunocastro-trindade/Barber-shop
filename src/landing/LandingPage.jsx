import { useState } from "react";
import { BarChart2, Check, Scissors, Star } from "lucide-react";

import { CSS_VITRINE, LP, lpBtnFantasma, lpBtnPrimario } from "../lib/tema.js";
import { } from "../ui/tokens.js";
import { } from "../ui/base.jsx";

// ── Landing Page ───────────────────────────────────────────────────────────────
// Visual inspirado em wope.com: fundo quase preto, glow violeta, tipografia
// gigante centralizada e cards de recursos com mockups do produto.
// Tokens e CSS moram em src/lib/tema.js — a área do cliente usa os mesmos.

const FaqItem = ({ pergunta, resposta, aberta, onToggle }) => (
  <div onClick={onToggle} style={{
    borderBottom: `1px solid ${LP.border}`, padding: "22px 4px", cursor: "pointer",
    transition: "background .2s",
  }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
      <span style={{ fontSize: 16, fontWeight: 600, color: aberta ? "#fff" : LP.text }}>{pergunta}</span>
      <span style={{
        width: 28, height: 28, borderRadius: "50%", border: `1px solid ${LP.border}`,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        color: LP.dim, fontSize: 16, fontWeight: 400,
        transform: aberta ? "rotate(45deg)" : "none", transition: "transform .25s",
        background: aberta ? "rgba(139,92,246,0.15)" : "transparent",
      }}>+</span>
    </div>
    <div style={{
      maxHeight: aberta ? 300 : 0, overflow: "hidden", transition: "max-height .35s ease",
    }}>
      <p style={{ fontSize: 14, color: LP.dim, lineHeight: 1.8, margin: "14px 0 0", maxWidth: 640 }}>{resposta}</p>
    </div>
  </div>
);

export const LandingPage = ({ onLogin, onRegister, onCliente }) => {
  const [faqAberta, setFaqAberta] = useState(0);
  const [cicloPreco, setCicloPreco] = useState("mensal");
  const c = LP.roxo;

  const faqs = [
    {
      p: "O que é o ControlCRM?",
      r: "O ControlCRM é um sistema de gestão feito sob medida para barbearias. Ele reúne agenda semanal, fila de espera para clientes sem horário marcado, ficha completa de cada cliente, controle financeiro e comissão automática por barbeiro — tudo em um só painel, simples de usar no dia a dia.",
    },
    {
      p: "Para quem é o ControlCRM?",
      r: "Para donos de barbearia que querem parar de controlar o negócio no caderno ou no WhatsApp. Funciona tanto para quem trabalha sozinho quanto para equipes com vários barbeiros, com controle de comissão individual para cada profissional.",
    },
    {
      p: "Como funciona a fila de espera?",
      r: "Clientes que chegam sem hora marcada entram na fila com nome, serviço e barbeiro preferido. Ao atender, o sistema registra o atendimento automaticamente no caixa e no histórico do cliente — sem digitação em dobro.",
    },
    {
      p: "Meus dados ficam seguros?",
      r: "Sim. Seus dados ficam salvos em banco de dados na nuvem, com senha protegida por criptografia e acesso restrito à sua conta. E você pode exportar tudo em PDF a qualquer momento — os dados são seus.",
    },
    {
      p: "Preciso instalar alguma coisa?",
      r: "Não. O ControlCRM funciona direto no navegador do celular, tablet ou computador. É só criar sua conta e começar a usar em minutos.",
    },
  ];

  const kpis = [
    { l: "FATURAMENTO DO MÊS", v: "R$ 28.640", d: "+24% vs. mês anterior" },
    { l: "ATENDIMENTOS", v: "412", d: "+18% vs. mês anterior" },
    { l: "TICKET MÉDIO", v: "R$ 69", d: "+8% vs. mês anterior" },
    { l: "TAXA DE RETORNO", v: "82%", d: "+6% vs. mês anterior" },
  ];

  const agendaMock = [
    { h: "09:00", n: "Lucas Almeida", s: "Corte + Barba", cor: "#22C55E" },
    { h: "10:00", n: "Pedro Rocha", s: "Degradê (fade)", cor: c },
    { h: "11:00", n: "Marcos Vieira", s: "Corte masculino", cor: c },
    { h: "14:00", n: "João Ferraz", s: "Barba completa", cor: "#F59E0B" },
  ];

  const recursos = [
    {
      titulo: "Agenda e fila de espera em tempo real",
      desc: "Visualize a semana inteira em um clique, encaixe clientes sem horário na fila e nunca mais perca um atendimento por desorganização.",
      visual: (
        <div style={{ padding: 20 }}>
          {agendaMock.map((a, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 14, padding: "12px 16px",
              background: "rgba(255,255,255,0.03)", border: `1px solid ${LP.border}`,
              borderRadius: 12, marginBottom: 10,
            }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: a.cor, minWidth: 42 }}>{a.h}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: LP.text }}>{a.n}</div>
                <div style={{ fontSize: 11, color: LP.dim }}>{a.s}</div>
              </div>
              <span style={{
                fontSize: 10, fontWeight: 700, color: a.cor, background: a.cor + "1A",
                border: `1px solid ${a.cor}40`, padding: "4px 10px", borderRadius: 999,
              }}>Confirmado</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      titulo: "Ficha do cliente que não se perde",
      desc: "Preferência de corte, barbeiro favorito, telefone e histórico completo de visitas — tudo salvo com segurança, pronto para o próximo atendimento.",
      visual: (
        <div style={{ padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
            <div style={{
              width: 52, height: 52, borderRadius: "50%", flexShrink: 0,
              background: `linear-gradient(135deg, ${c}66, ${c}22)`, border: `1.5px solid ${c}55`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, fontWeight: 800, color: LP.roxoClaro,
            }}>L</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>Lucas Almeida</div>
              <div style={{ fontSize: 12, color: LP.dim }}>Assinante · Cliente desde 2024</div>
            </div>
            <span style={{
              marginLeft: "auto", fontSize: 10, fontWeight: 700, color: "#14B8A6",
              background: "rgba(20,184,166,0.12)", border: "1px solid rgba(20,184,166,0.35)",
              padding: "4px 12px", borderRadius: 999,
            }}>32 visitas</span>
          </div>
          {[["Corte preferido", "Degradê navalhado"], ["Barbeiro favorito", "Rafael Silva"], ["Última visita", "há 12 dias · R$ 75"]].map(([k, v], i) => (
            <div key={i} style={{
              display: "flex", justifyContent: "space-between", padding: "11px 0",
              borderBottom: i < 2 ? `1px solid ${LP.border}` : "none",
            }}>
              <span style={{ fontSize: 12, color: LP.dim }}>{k}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: LP.text }}>{v}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      titulo: "Financeiro e comissões automáticas",
      desc: "Cada atendimento pago já entra no caixa e calcula a comissão do barbeiro na hora. Acompanhe o faturamento por dia, semana e mês sem planilhas.",
      visual: (
        <div style={{ padding: 24 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 26, fontWeight: 800, color: "#fff", letterSpacing: "-1px" }}>R$ 7.240</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#22C55E" }}>▲ +18% esta semana</span>
          </div>
          <div style={{ fontSize: 11, color: LP.dim, marginBottom: 16 }}>Faturamento · seg a sáb</div>
          <svg viewBox="0 0 320 100" style={{ width: "100%", display: "block" }} preserveAspectRatio="none">
            <defs>
              <linearGradient id="lpGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={c} stopOpacity="0.45" />
                <stop offset="100%" stopColor={c} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M0,72 C40,66 62,48 100,42 C138,36 158,58 196,40 C234,22 262,34 320,12 L320,100 L0,100 Z" fill="url(#lpGrad)" />
            <path d="M0,72 C40,66 62,48 100,42 C138,36 158,58 196,40 C234,22 262,34 320,12" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" />
          </svg>
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            {[["Rafael", "R$ 1.120"], ["Carlos", "R$ 980"], ["Diego", "R$ 840"]].map(([n, v], i) => (
              <div key={i} style={{
                flex: 1, padding: "10px 12px", background: "rgba(255,255,255,0.03)",
                border: `1px solid ${LP.border}`, borderRadius: 10,
              }}>
                <div style={{ fontSize: 10, color: LP.dim, marginBottom: 3 }}>Comissão · {n}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: LP.roxoClaro }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
  ];

  return (
    <div style={{
      height: "100vh", overflowY: "auto", overflowX: "hidden", background: LP.bg, color: LP.text,
      fontFamily: '"DM Sans", system-ui, sans-serif', position: "relative",
    }}>
      <style>{CSS_VITRINE}</style>

      {/* Glow de fundo do hero */}
      <div style={{
        position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
        width: 1400, height: 900, pointerEvents: "none", zIndex: 0,
        background: `radial-gradient(ellipse 50% 42% at 50% 78%, ${c}52 0%, ${c}1C 40%, transparent 70%)`,
      }} />
      {/* Piso em perspectiva */}
      <div style={{
        position: "absolute", top: 520, left: "50%", transform: "translateX(-50%) perspective(600px) rotateX(62deg)",
        width: 1600, height: 560, pointerEvents: "none", zIndex: 0, opacity: 0.5,
        backgroundImage: `linear-gradient(${c}30 1px, transparent 1px), linear-gradient(90deg, ${c}30 1px, transparent 1px)`,
        backgroundSize: "72px 72px",
        maskImage: "radial-gradient(ellipse 55% 60% at 50% 30%, black 0%, transparent 68%)",
        WebkitMaskImage: "radial-gradient(ellipse 55% 60% at 50% 30%, black 0%, transparent 68%)",
      }} />

      {/* ── Navegação ── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 100, display: "flex", alignItems: "center",
        justifyContent: "space-between", padding: "0 clamp(20px, 5vw, 64px)", height: 68,
        background: "rgba(5,3,9,0.6)", backdropFilter: "blur(24px) saturate(150%)",
        borderBottom: `1px solid rgba(255,255,255,0.05)`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10, display: "flex", alignItems: "center",
            justifyContent: "center", color: "#fff",
            background: `linear-gradient(135deg, ${c}, #6D28D9)`,
            boxShadow: `0 4px 18px ${c}55, inset 0 1px 0 rgba(255,255,255,0.3)`,
          }}>
            <Scissors size={16} strokeWidth={2.2} />
          </div>
          <span style={{ fontSize: 17, fontWeight: 800, color: "#fff", letterSpacing: "-0.3px" }}>ControlCRM</span>
        </div>
        <div className="lp-nav-links" style={{ display: "flex", gap: 36, position: "absolute", left: "50%", transform: "translateX(-50%)" }}>
          {[["Recursos", "recursos"], ["Preços", "precos"], ["Perguntas", "perguntas"]].map(([l, id]) => (
            <span key={l} className="lp-link" onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })}>{l}</span>
          ))}
        </div>
        <div className="lp-nav-acoes" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={onCliente} className="lp-btn lp-btn-fantasma" style={{ ...lpBtnFantasma, padding: "9px 20px", fontSize: 13, whiteSpace: "nowrap" }}>Agendar meu corte</button>
          <button onClick={onLogin} className="lp-btn lp-btn-fantasma lp-so-desktop" style={{ ...lpBtnFantasma, padding: "9px 20px", fontSize: 13, whiteSpace: "nowrap" }}>Entrar</button>
          <button onClick={onRegister} className="lp-btn lp-btn-primario lp-so-desktop" style={{ ...lpBtnPrimario, padding: "9px 20px", fontSize: 13, whiteSpace: "nowrap" }}>Criar conta</button>
        </div>
      </div>

      {/* ── Hero ── */}
      <div style={{
        position: "relative", zIndex: 1, textAlign: "center",
        padding: "clamp(72px, 11vh, 130px) 24px 60px", maxWidth: 980, margin: "0 auto",
      }}>
        <div className="lp-anim" style={{
          display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 18px",
          borderRadius: 999, border: `1px solid ${c}45`, background: `${c}14`,
          fontSize: 12, fontWeight: 600, color: LP.roxoClaro, marginBottom: 34,
          boxShadow: `0 0 24px ${c}25`,
        }}>
          <Scissors size={13} strokeWidth={2} /> Gestão completa para barbearias
        </div>

        <h1 className="lp-anim" style={{
          fontSize: "clamp(44px, 7.5vw, 84px)", fontWeight: 800, lineHeight: 1.04,
          letterSpacing: "-0.035em", margin: 0, color: "#fff", animationDelay: ".08s",
        }}>
          Uma nova era na gestão
          <br />
          <span style={{
            background: "linear-gradient(180deg, #B4ACD1 0%, #6A6285 100%)",
            WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent",
          }}>da sua barbearia.</span>
        </h1>

        <p className="lp-anim" style={{
          fontSize: "clamp(15px, 2vw, 19px)", color: LP.dim, lineHeight: 1.7,
          maxWidth: 620, margin: "30px auto 42px", animationDelay: ".16s",
        }}>
          Deixe o sistema fazer o trabalho pesado. Agenda, fila de espera, ficha do
          cliente e comissão por barbeiro — tudo em um só lugar, com clareza total
          do seu faturamento.
        </p>

        <div className="lp-anim lp-hero-botoes" style={{ display: "flex", gap: 14, justifyContent: "center", animationDelay: ".24s" }}>
          <button onClick={onRegister} className="lp-btn lp-btn-primario" style={lpBtnPrimario}>Começar agora →</button>
          <button onClick={onLogin} className="lp-btn lp-btn-fantasma" style={lpBtnFantasma}>Já tenho conta</button>
        </div>

        <div className="lp-anim" style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 18,
          marginTop: 38, fontSize: 12, color: LP.dimmer, animationDelay: ".32s", flexWrap: "wrap",
        }}>
          <span>Sem cartão de crédito</span>
          <span style={{ width: 3, height: 3, borderRadius: "50%", background: LP.dimmer }} />
          <span>Cancele quando quiser</span>
          <span style={{ width: 3, height: 3, borderRadius: "50%", background: LP.dimmer }} />
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            {[1, 2, 3, 4, 5].map(i => <Star key={i} size={11} color={c} fill={c} strokeWidth={0} />)}
            Avaliação 5 estrelas
          </span>
        </div>
      </div>

      {/* ── Mockup do painel ── */}
      <div style={{ position: "relative", zIndex: 1, maxWidth: 960, margin: "0 auto", padding: "0 24px 40px" }}>
        <div style={{
          position: "absolute", inset: "10% 15%", pointerEvents: "none",
          background: `radial-gradient(ellipse 60% 60% at 50% 50%, ${c}38 0%, transparent 70%)`,
          filter: "blur(30px)",
        }} />
        <div style={{
          position: "relative", borderRadius: 20, overflow: "hidden",
          background: "rgba(10,7,18,0.85)", border: `1px solid ${c}35`,
          boxShadow: `0 0 120px ${c}30, 0 50px 100px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.08)`,
          backdropFilter: "blur(20px)",
        }}>
          <div style={{
            padding: "12px 18px", borderBottom: `1px solid ${LP.border}`,
            display: "flex", alignItems: "center", gap: 7, background: "rgba(255,255,255,0.02)",
          }}>
            <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#FF5F57" }} />
            <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#FEBC2E" }} />
            <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#28C840" }} />
            <div style={{ marginLeft: "auto", fontSize: 11, color: LP.dim, display: "flex", alignItems: "center", gap: 6 }}>
              <BarChart2 size={12} strokeWidth={1.8} /> Painel · ControlCRM
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
            {kpis.map((k, i) => (
              <div key={k.l} style={{
                padding: "22px 24px",
                borderRight: i < kpis.length - 1 ? `1px solid ${LP.border}` : "none",
                borderBottom: `1px solid ${LP.border}`,
              }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: LP.dimmer, letterSpacing: ".1em", marginBottom: 8 }}>{k.l}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#fff", letterSpacing: "-0.5px", marginBottom: 4 }}>{k.v}</div>
                <div style={{ fontSize: 11, color: "#22C55E" }}>{k.d}</div>
              </div>
            ))}
          </div>
          <div style={{ height: 150, overflow: "hidden" }}>
            <svg viewBox="0 0 960 150" style={{ width: "100%", height: "100%", display: "block" }} preserveAspectRatio="none">
              <defs>
                <linearGradient id="lpHeroGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={c} stopOpacity="0.5" />
                  <stop offset="100%" stopColor={c} stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0,110 C120,98 200,64 300,54 C400,44 460,86 570,56 C680,26 760,48 960,16 L960,150 L0,150 Z" fill="url(#lpHeroGrad)" />
              <path d="M0,110 C120,98 200,64 300,54 C400,44 460,86 570,56 C680,26 760,48 960,16" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </div>

      {/* ── Recursos ── */}
      <div id="recursos" style={{ position: "relative", zIndex: 1, maxWidth: 1080, margin: "0 auto", padding: "110px 24px 40px" }}>
        <div style={{ textAlign: "center", marginBottom: 70 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: LP.roxoClaro, letterSpacing: ".18em", textTransform: "uppercase", marginBottom: 18 }}>Recursos</div>
          <h2 style={{
            fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 800, color: "#fff",
            letterSpacing: "-0.03em", lineHeight: 1.1, margin: 0,
          }}>
            Conheça a nova experiência
            <br />
            <span style={{ color: LP.dimmer }}>de gerir sua barbearia.</span>
          </h2>
        </div>

        <div className="lp-recursos" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
          {recursos.map((r, i) => (
            <div key={i} style={{
              borderRadius: 20, border: `1px solid ${LP.border}`, background: LP.card,
              overflow: "hidden", display: "flex", flexDirection: "column",
              boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
            }}>
              <div style={{ flex: 1, minHeight: 240, position: "relative", background: "linear-gradient(180deg, rgba(139,92,246,0.06), transparent 60%)" }}>
                {r.visual}
              </div>
              <div style={{ padding: "8px 24px 28px" }}>
                <h3 style={{ fontSize: 19, fontWeight: 700, color: "#fff", margin: "0 0 10px", letterSpacing: "-0.02em", lineHeight: 1.3 }}>{r.titulo}</h3>
                <p style={{ fontSize: 13.5, color: LP.dim, lineHeight: 1.75, margin: 0 }}>{r.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Planos & Preços ── */}
      <div id="precos" style={{ position: "relative", zIndex: 1, maxWidth: 1080, margin: "0 auto", padding: "110px 24px 40px" }}>
        <div style={{ textAlign: "center", marginBottom: 50 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: LP.roxoClaro, letterSpacing: ".18em", textTransform: "uppercase", marginBottom: 18 }}>Planos & Preços</div>
          <h2 style={{ fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", margin: "0 0 16px" }}>
            Escolha o plano certo para o seu negócio
          </h2>
          <p style={{ fontSize: 15, color: LP.dim, margin: "0 auto 28px", maxWidth: 540 }}>
            Transparência total. Alterne entre os planos mensal e anual para ver as condições.
          </p>

          {/* Toggle Mensal / Anual */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.04)", border: `1px solid ${LP.border}`, padding: 5, borderRadius: 999 }}>
            <button type="button" onClick={() => setCicloPreco("mensal")}
              style={{ padding: "9px 22px", borderRadius: 999, border: "none", background: cicloPreco === "mensal" ? c : "transparent", color: cicloPreco === "mensal" ? "#fff" : LP.dim, fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all .2s" }}>
              Cobrança Mensal
            </button>
            <button type="button" onClick={() => setCicloPreco("anual")}
              style={{ padding: "9px 22px", borderRadius: 999, border: "none", background: cicloPreco === "anual" ? c : "transparent", color: cicloPreco === "anual" ? "#fff" : LP.dim, fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all .2s", display: "flex", alignItems: "center", gap: 6 }}>
              Cobrança Anual
              <span style={{ fontSize: 10, background: "#22C55E", color: "#000", padding: "2px 7px", borderRadius: 999, fontWeight: 800 }}>20% OFF</span>
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
          {[
            {
              nome: "Solo",
              desc: "Para barbeiros autônomos que atendem sozinhos",
              recursos: ["1 profissional", "Agendamentos ilimitados", "Área do cliente mobile", "Fila de espera em tempo real", "Ficha do cliente & histórico", "Suporte via WhatsApp"],
            },
            {
              nome: "Equipe",
              destaque: true,
              desc: "Para barbearias com múltiplos barbeiros e equipe",
              recursos: ["Até 5 barbeiros na equipe", "Comissões automáticas por barbeiro", "Agendamentos & Fila em tempo real", "Controle financeiro & estoque", "Relatórios de faturamento", "Todas as funções do plano Solo"],
            },
            {
              nome: "Pro / Redes",
              desc: "Para redes de barbearia e operações de grande fluxo",
              recursos: ["Barbeiros ilimitados", "Múltiplas unidades", "Exportação completa em PDF", "Suporte prioritário 24/7", "Gestão avançada de assinaturas", "Todas as funções do plano Equipe"],
            },
          ].map((p, i) => {
            const ehDestaque = p.destaque;
            return (
              <div key={i} style={{
                borderRadius: 20,
                border: ehDestaque ? `2px solid ${c}` : `1px solid ${LP.border}`,
                background: ehDestaque ? `linear-gradient(180deg, ${c}1A 0%, ${LP.card} 100%)` : LP.card,
                padding: 32,
                display: "flex",
                flexDirection: "column",
                position: "relative",
                boxShadow: ehDestaque ? `0 20px 60px ${c}30` : "0 20px 60px rgba(0,0,0,0.35)",
              }}>
                {ehDestaque && (
                  <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", background: c, color: "#fff", fontSize: 10, fontWeight: 800, padding: "4px 14px", borderRadius: 999, textTransform: "uppercase", letterSpacing: ".08em", boxShadow: `0 4px 14px ${c}60` }}>
                    Mais Escolhido
                  </div>
                )}
                <h3 style={{ fontSize: 22, fontWeight: 800, color: "#fff", margin: "0 0 6px" }}>{p.nome}</h3>
                <p style={{ fontSize: 13, color: LP.dim, lineHeight: 1.6, margin: "0 0 24px", minHeight: 40 }}>{p.desc}</p>

                <div style={{ padding: "20px 0", borderTop: `1px solid ${LP.border}`, borderBottom: `1px solid ${LP.border}`, marginBottom: 24 }}>
                  <div style={{ fontSize: 32, fontWeight: 800, color: "#fff", letterSpacing: "-1px" }}>
                    R$ --
                    <span style={{ fontSize: 14, fontWeight: 400, color: LP.dim }}> / mês</span>
                  </div>
                  <div style={{ fontSize: 11, color: LP.roxoClaro, fontWeight: 600, marginTop: 4 }}>
                    Valores em breve (preço sob consulta)
                  </div>
                </div>

                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
                  {p.recursos.map((rec, rIdx) => (
                    <div key={rIdx} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: LP.text }}>
                      <div style={{ width: 18, height: 18, borderRadius: "50%", background: `${c}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Check size={11} color={LP.roxoClaro} strokeWidth={2.5} />
                      </div>
                      {rec}
                    </div>
                  ))}
                </div>

                <button onClick={onRegister} className="lp-btn lp-btn-primario"
                  style={{
                    ...lpBtnPrimario,
                    width: "100%",
                    padding: "13px",
                    fontSize: 13.5,
                    background: ehDestaque ? c : "rgba(255,255,255,0.06)",
                    boxShadow: ehDestaque ? `0 4px 18px ${c}50` : "none",
                  }}>
                  Escolher {p.nome} →
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── FAQ ── */}
      <div id="perguntas" style={{ position: "relative", zIndex: 1, maxWidth: 760, margin: "0 auto", padding: "110px 24px 60px" }}>
        <div style={{ textAlign: "center", marginBottom: 46 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: LP.roxoClaro, letterSpacing: ".18em", textTransform: "uppercase", marginBottom: 18 }}>FAQ</div>
          <h2 style={{ fontSize: "clamp(28px, 4.5vw, 44px)", fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", margin: 0 }}>
            Perguntas frequentes
          </h2>
          <p style={{ fontSize: 14, color: LP.dim, marginTop: 14 }}>Não encontrou o que procurava? Fale com a gente.</p>
        </div>
        <div style={{ borderTop: `1px solid ${LP.border}` }}>
          {faqs.map((f, i) => (
            <FaqItem key={i} pergunta={f.p} resposta={f.r} aberta={faqAberta === i}
              onToggle={() => setFaqAberta(faqAberta === i ? -1 : i)} />
          ))}
        </div>
      </div>

      {/* ── CTA final ── */}
      <div style={{ position: "relative", zIndex: 1, textAlign: "center", padding: "110px 24px 130px", overflow: "hidden" }}>
        <div style={{
          position: "absolute", left: "50%", bottom: -280, transform: "translateX(-50%)",
          width: 1100, height: 600, pointerEvents: "none",
          background: `radial-gradient(ellipse 50% 50% at 50% 100%, ${c}5E 0%, ${c}1E 45%, transparent 72%)`,
        }} />
        <h2 style={{
          position: "relative", fontSize: "clamp(34px, 5.5vw, 60px)", fontWeight: 800,
          color: "#fff", letterSpacing: "-0.03em", lineHeight: 1.08, margin: 0,
        }}>
          Deixe a concorrência para trás.
          <br />
          <span style={{ color: LP.dimmer }}>A partir de agora.</span>
        </h2>
        <p style={{ position: "relative", fontSize: 16, color: LP.dim, margin: "24px auto 40px", maxWidth: 520, lineHeight: 1.7 }}>
          O ControlCRM organiza sua operação para você focar no que importa: o corte.
        </p>
        <div className="lp-hero-botoes" style={{ position: "relative", display: "flex", gap: 14, justifyContent: "center" }}>
          <button onClick={onRegister} className="lp-btn lp-btn-primario" style={lpBtnPrimario}>Criar minha conta →</button>
          <button onClick={onLogin} className="lp-btn lp-btn-fantasma" style={lpBtnFantasma}>Fazer login</button>
        </div>
        <div style={{ position: "relative", marginTop: 26, fontSize: 12, color: LP.dimmer }}>
          Sem cartão de crédito · Teste grátis por 14 dias
        </div>
      </div>

      {/* ── Rodapé ── */}
      <div style={{ position: "relative", zIndex: 1, borderTop: `1px solid ${LP.border}`, background: "rgba(255,255,255,0.012)" }}>
        <div className="lp-footer" style={{
          maxWidth: 1080, margin: "0 auto", padding: "56px 24px 40px",
          display: "flex", justifyContent: "space-between", gap: 40, flexWrap: "wrap",
        }}>
          <div style={{ maxWidth: 280 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center",
                justifyContent: "center", color: "#fff",
                background: `linear-gradient(135deg, ${c}, #6D28D9)`,
              }}>
                <Scissors size={14} strokeWidth={2.2} />
              </div>
              <span style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>ControlCRM</span>
            </div>
            <p style={{ fontSize: 13, color: LP.dim, lineHeight: 1.7, margin: 0 }}>
              A experiência de gestão da nova geração de barbearias.
            </p>
          </div>
          <div style={{ display: "flex", gap: "clamp(40px, 8vw, 100px)", flexWrap: "wrap" }}>
            {[
              ["PLATAFORMA", ["Recursos", "Preços", "Suporte"]],
              ["LEGAL", ["Termos de uso", "Privacidade"]],
              ["CONTATO", ["WhatsApp", "E-mail"]],
            ].map(([titulo, links]) => (
              <div key={titulo}>
                <div style={{ fontSize: 11, fontWeight: 700, color: LP.dimmer, letterSpacing: ".14em", marginBottom: 16 }}>{titulo}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                  {links.map(l => <span key={l} className="lp-link" style={{ fontSize: 13 }}>{l}</span>)}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{
          maxWidth: 1080, margin: "0 auto", padding: "0 24px 32px",
          fontSize: 12, color: LP.dimmer,
        }}>
          © 2026 ControlCRM. Todos os direitos reservados.
        </div>
      </div>
    </div>
  );
};


export default LandingPage;
