import { useState, useEffect } from "react";
import {
  LayoutDashboard, CalendarDays, ListOrdered, User, Scissors, Package, Wallet,
  CreditCard, Users, Bell, MessageSquare, Settings, Download, LogOut,
} from "lucide-react";

import { api } from "./lib/api.js";
import { B, N } from "./ui/tokens.js";
import { GlobalStyles, Row, Col, Vazio } from "./ui/base.jsx";

import AreaCliente from "./cliente/AreaCliente.jsx";
import LandingPage from "./landing/LandingPage.jsx";
import { LoginPage, RegisterPage, TelaInicial } from "./auth/Telas.jsx";
import CheckoutPlanos from "./auth/CheckoutPlanos.jsx";

import Dashboard from "./painel/Dashboard.jsx";
import Agenda from "./painel/Agenda.jsx";
import FilaEspera from "./painel/Fila.jsx";
import FichaCliente from "./painel/Clientes.jsx";
import Servicos from "./painel/Servicos.jsx";
import Estoque from "./painel/Estoque.jsx";
import Financeiro from "./painel/Financeiro.jsx";
import Assinaturas from "./painel/Assinaturas.jsx";
import Equipe from "./painel/Equipe.jsx";
import Lembretes from "./painel/Lembretes.jsx";
import WhatsAppEmail from "./painel/Integracoes.jsx";
import Taxas from "./painel/Conta.jsx";
import ExportarDados from "./painel/Exportar.jsx";

// ── Navegação ─────────────────────────────────────────────────────────────────
const NAV_GROUPS = [
  { label: "CORE DO SISTEMA", items: [
    { id: "dashboard",     icon: LayoutDashboard, label: "Visão Geral" },
    { id: "agenda",        icon: CalendarDays,    label: "Agenda" },
    { id: "fila",          icon: ListOrdered,     label: "Fila de Espera" },
    { id: "ficharegistro", icon: User,            label: "Ficha do Cliente" },
    { id: "servicos",      icon: Scissors,        label: "Serviços" },
    { id: "estoque",       icon: Package,         label: "Estoque" },
    { id: "financeiro",    icon: Wallet,          label: "Financeiro" },
  ] },
  { label: "FUNCIONALIDADES", items: [
    { id: "assinaturas", icon: CreditCard,   label: "Assinaturas" },
    { id: "equipe",      icon: Users,        label: "Equipe" },
    { id: "lembretes",   icon: Bell,         label: "Lembretes" },
  ] },
  { label: "CONFIGURAÇÕES", items: [
    { id: "whatsappemail", icon: MessageSquare, label: "Integrações" },
    { id: "taxas",         icon: Settings,      label: "Conta & Taxas" },
    { id: "exportar",      icon: Download,      label: "Exportar Dados" },
  ] },
];

const HOME_ID = NAV_GROUPS[0].items[0].id;

const pediuAreaCliente = () =>
  /^\/cliente\/?$/.test(window.location.pathname) ||
  window.location.hash.replace(/^#\/?/, "") === "cliente";

// ── App ────────────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState(() => (pediuAreaCliente() ? "cliente" : "carregando"));
  const [user, setUser] = useState(null);
  const [active, setActive] = useState(HOME_ID);
  const [planoInfo, setPlanoInfo] = useState(null);

  useEffect(() => {
    if (pediuAreaCliente()) return;
    let ativo = true;
    api.auth.eu()
      .then(u => { if (ativo) { setUser(u); setPage("app"); } })
      .catch(() => { if (ativo) setPage("landing"); });
    return () => { ativo = false; };
  }, []);

  const irPara = (destino) => {
    const url = destino === "cliente" ? "/cliente" : "/";
    if (window.location.pathname !== url) window.history.pushState({}, "", url);
    setPage(destino);
  };

  const entrar = (u) => {
    setUser(u);
    setActive(HOME_ID);
    setPage("app");
  };

  const sair = async () => {
    try { await api.auth.sair(); } catch { /* já expirada */ }
    setUser(null);
    setPage("landing");
  };

  if (page === "carregando") return <><GlobalStyles /><TelaInicial /></>;
  if (page === "cliente") return <><GlobalStyles /><AreaCliente onVoltarSite={() => irPara("landing")} /></>;
  if (page === "landing") return <><GlobalStyles /><LandingPage
    onLogin={() => setPage("login")}
    onRegister={() => setPage("planos")}
    onCliente={() => irPara("cliente")}
  /></>;
  if (page === "planos") return <><GlobalStyles /><CheckoutPlanos
    onConcluir={(info) => { setPlanoInfo(info); setPage("register"); }}
    onBack={() => setPage("landing")}
    onLogin={() => setPage("login")}
  /></>;
  if (page === "login") return <><GlobalStyles /><LoginPage onSuccess={entrar} onRegister={() => setPage("planos")} onBack={() => setPage("landing")} /></>;
  if (page === "register") return <><GlobalStyles /><RegisterPage planoInfo={planoInfo} onSuccess={entrar} onLogin={() => setPage("login")} onBack={() => setPage("planos")} /></>;

  const screens = {
    dashboard: <Dashboard user={user} onNavigate={setActive} />,
    agenda: <Agenda />,
    fila: <FilaEspera />,
    ficharegistro: <FichaCliente />,
    servicos: <Servicos />,
    estoque: <Estoque />,
    financeiro: <Financeiro />,
    assinaturas: <Assinaturas />,
    equipe: <Equipe />,
    lembretes: <Lembretes />,
    whatsappemail: <WhatsAppEmail user={user} />,
    taxas: <Taxas user={user} />,
    exportar: <ExportarDados user={user} />,
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: B.bg, color: B.text, fontFamily: '"DM Sans", system-ui, sans-serif', overflow: "hidden" }}>
      <GlobalStyles />
      <div style={{ width: 230, background: "#08051A", borderRight: `1px solid ${B.border}`, display: "flex", flexDirection: "column", overflow: "hidden", flexShrink: 0, boxShadow: `4px 0 28px rgba(0,0,0,0.4)` }}>
        <div style={{ padding: "16px 14px 14px", borderBottom: `1px solid ${B.border}` }}>
          <Row gap={10}>
            <div style={{ width: 36, height: 36, borderRadius: 12, background: `linear-gradient(135deg, ${N.color}, #6D28D9)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 4px 18px ${N.color}55, inset 0 1px 0 rgba(255,255,255,0.3)` }}>
              <N.icon size={17} color="#fff" strokeWidth={2.2} />
            </div>
            <Col gap={2} style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: B.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.barbearia}</div>
              <div style={{ fontSize: 10, color: B.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.nome}</div>
            </Col>
          </Row>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 8px 0" }}>
          {NAV_GROUPS.map(g => (
            <div key={g.label} style={{ marginBottom: 4 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: B.muted, padding: "12px 10px 5px", letterSpacing: ".1em", textTransform: "uppercase" }}>{g.label}</div>
              {g.items.map(item => {
                const isActive = active === item.id;
                return (
                  <div key={item.id} onClick={() => setActive(item.id)}
                    className={`crm-nav${isActive ? " active" : ""}`}
                    style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 12px", cursor: "pointer", fontSize: 12, fontWeight: isActive ? 600 : 400, borderRadius: 999, marginBottom: 2, transition: "all .14s",
                      background: isActive ? N.color + "1a" : "transparent",
                      color: isActive ? N.color : B.muted,
                      border: `1px solid ${isActive ? N.color + "30" : "transparent"}`,
                    }}>
                    <item.icon size={13} strokeWidth={isActive ? 2 : 1.8} style={{ flexShrink: 0 }} />
                    {item.label}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div style={{ padding: "8px 8px 10px" }}>
          <div onClick={sair}
            style={{ padding: "9px 14px", borderRadius: 999, border: `1px solid ${B.border}`, background: "transparent", fontSize: 11, fontWeight: 500, color: B.muted, cursor: "pointer", display: "flex", alignItems: "center", gap: 7, transition: "all .14s" }}
            onMouseEnter={e => { e.currentTarget.style.background = B.card; e.currentTarget.style.color = B.text; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = B.muted; }}
          >
            <LogOut size={12} strokeWidth={1.8} /> Sair da conta
          </div>
        </div>
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: "28px 32px", background: `radial-gradient(ellipse 55% 38% at 75% 0%, rgba(139,92,246,0.09), transparent 65%), ${B.bg}` }}>
        {screens[active] || <Vazio texto="Selecione um módulo" />}
      </div>
    </div>
  );
}
