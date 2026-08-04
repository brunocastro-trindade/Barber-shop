import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  LayoutDashboard, Package, CalendarDays, FileText, User,
  Wallet, Users, Bell, MessageSquare, Settings, ListOrdered, CreditCard,
  Scissors, Sparkles, TrendingUp, X, Check, Trash2, Phone, Calendar,
  CheckCircle, Star, Crown, LogOut, BarChart2, Download,
  ChevronLeft, ChevronRight, Loader2, AlertTriangle,
} from "lucide-react";

import { api } from "./lib/api.js";
import {
  paraNumero, emReais, emReaisCurto,
  hojeISO, somarDias, segundaDaSemana, rotuloDia, dataCurta, periodoDaSemana,
} from "./lib/formato.js";

// ── Base tokens ────────────────────────────────────────────────────────────────
const B = {
  bg: "#080A0F", bg2: "#0C0F17", card: "#101420", card2: "#151A28",
  border: "#1C2234", border2: "#232B40",
  text: "#ECF0FA", muted: "#576080", dim: "#2B3350",
  green: "#22C55E", red: "#EF4444", amber: "#F59E0B", teal: "#14B8A6",
};

// ── Catálogo da barbearia ─────────────────────────────────────────────────────
// Serviços, produtos e equipe ainda vivem aqui (em memória). Clientes, visitas,
// agenda e fila vêm do banco — ver src/lib/api.js.
const N = {
  name: "Barbearia", icon: Scissors,
  color: "#D97706", secondary: "#059669",
  products: [
    ["Pomada modeladora", "R$ 8,50", "34", "10"],
    ["Shampoo masculino", "R$ 12,00", "24", "8"],
    ["Óleo de barba", "R$ 15,00", "8", "5"],
    ["Lâminas (cx 100)", "R$ 22,00", "3", "5"],
    ["Gel pós-barba", "R$ 11,00", "18", "5"],
  ],
  // [nome, duração, preço, comissão do barbeiro]
  services: [
    ["Corte masculino", "30 min", "R$ 45", "40%"],
    ["Barba completa", "20 min", "R$ 35", "40%"],
    ["Corte + Barba", "45 min", "R$ 75", "45%"],
    ["Degradê (fade)", "40 min", "R$ 55", "40%"],
    ["Luzes / Mechas", "60 min", "R$ 120", "50%"],
  ],
  pros: ["Rafael Silva", "Carlos Lima", "Diego Santos"],
};

const HORARIOS = ["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"];

const TIPO_CLIENTE = {
  assinante: { label: "Assinante", color: B.teal },
  avulso: { label: "Avulso", color: B.amber },
};

const precoDoServico = (nome) => N.services.find(s => s[0] === nome)?.[2] || "R$ 0";

// ── Global styles injection ─────────────────────────────────────────────────────
const GlobalStyles = () => {
  useEffect(() => {
    const s = document.createElement("style");
    s.id = "crm-gs";
    s.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap');
      *{box-sizing:border-box}body{margin:0}
      ::-webkit-scrollbar{width:4px;height:4px}
      ::-webkit-scrollbar-track{background:transparent}
      ::-webkit-scrollbar-thumb{background:#1C2234;border-radius:10px}
      ::-webkit-scrollbar-thumb:hover{background:#2B3350}
      ::selection{background:#D9770645;color:#ECF0FA}
      input,select,textarea{transition:border-color .15s,box-shadow .15s}
      input:focus,select:focus,textarea:focus{border-color:rgba(255,255,255,0.2)!important;box-shadow:0 0 0 3px rgba(255,255,255,0.05)!important;outline:none!important}
      .crm-nav:hover{background:rgba(255,255,255,0.04)!important;color:#8B95B0!important}
      .crm-nav.active:hover{opacity:.9}
      @keyframes crm-girar{to{transform:rotate(360deg)}}
      .crm-girar{animation:crm-girar .9s linear infinite}
    `;
    document.head.appendChild(s);
    return () => { try { document.getElementById("crm-gs")?.remove(); } catch { /* já removido */ } };
  }, []);
  return null;
};

// ── Atoms ──────────────────────────────────────────────────────────────────────
const Row = ({ children, style, gap = 10, onClick }) => (
  <div onClick={onClick} style={{ display: "flex", gap, alignItems: "center", ...style }}>{children}</div>
);
const Col = ({ children, style, gap = 10 }) => (
  <div style={{ display: "flex", flexDirection: "column", gap, ...style }}>{children}</div>
);

const Btn = ({ children, color, sm, danger, outline, onClick, disabled }) => {
  const [hov, setHov] = useState(false);
  const isColor = color && !outline;
  return (
    <div
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "inline-flex", alignItems: "center", gap: 5, cursor: disabled ? "not-allowed" : "pointer",
        whiteSpace: "nowrap", userSelect: "none", opacity: disabled ? 0.5 : 1,
        padding: sm ? "5px 13px" : "8px 18px", borderRadius: 10,
        fontSize: sm ? 11 : 12, fontWeight: 600, letterSpacing: ".01em",
        transition: "all 0.14s ease",
        background: isColor
          ? hov && !disabled ? color : color + "e8"
          : danger ? (hov ? "rgba(58,18,18,.95)" : "rgba(40,14,14,.85)")
          : outline ? (hov ? color + "18" : "transparent")
          : hov ? "#1C2236" : "#161B2C",
        color: isColor ? "#fff" : danger ? B.red : outline ? color : B.text,
        border: `1px solid ${
          isColor ? (hov ? color : color + "70")
          : danger ? B.red + "55"
          : outline ? color + "55"
          : hov ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.08)"
        }`,
        boxShadow: isColor
          ? hov
            ? `0 6px 22px ${color}55, inset 0 1px 0 rgba(255,255,255,0.32)`
            : `0 3px 12px ${color}30, inset 0 1px 0 rgba(255,255,255,0.24)`
          : hov
          ? "0 4px 14px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.09)"
          : "0 2px 6px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.06)",
      }}
    >{children}</div>
  );
};

const Badge = ({ text, color }) => {
  const c = color || B.teal;
  return <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: c + "1e", color: c, border: `1px solid ${c}38`, letterSpacing: ".02em", whiteSpace: "nowrap" }}>{text}</span>;
};

const Stat = ({ label, value, sub, color }) => (
  <div style={{
    background: `linear-gradient(150deg, ${B.card} 0%, ${B.card2} 100%)`,
    border: `1px solid ${B.border}`,
    borderRadius: 14, padding: "18px 20px", flex: 1, minWidth: 0,
    boxShadow: "0 2px 4px rgba(0,0,0,0.45), 0 8px 28px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.055)",
    position: "relative", overflow: "hidden",
  }}>
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: color ? `linear-gradient(90deg, ${color}88, ${color}22, transparent)` : "linear-gradient(90deg, rgba(255,255,255,0.07), transparent)" }} />
    <div style={{ fontSize: 10, fontWeight: 600, color: B.muted, marginBottom: 10, letterSpacing: ".07em", textTransform: "uppercase" }}>{label}</div>
    <div style={{ fontSize: 27, fontWeight: 800, color: color || B.text, letterSpacing: "-0.03em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: B.muted, marginTop: 7 }}>{sub}</div>}
  </div>
);

const Card = ({ children, title, action, style, accentColor }) => (
  <div style={{
    background: B.card, border: `1px solid ${B.border}`, borderRadius: 16, padding: 20,
    boxShadow: "0 1px 3px rgba(0,0,0,0.5), 0 10px 36px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)",
    ...style
  }}>
    {title && (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, paddingBottom: 14, borderBottom: `1px solid ${B.border}` }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: B.text, letterSpacing: ".01em" }}>{title}</span>
        {action && <Btn sm color={accentColor}>{action}</Btn>}
      </div>
    )}
    {children}
  </div>
);

// Barras a partir de valores absolutos: a maior barra vira 100%.
const ChartBar = ({ h = 120, valores, rotulos, color }) => {
  const c = color || B.teal;
  const max = Math.max(...valores, 1);
  return (
    <div>
      <div style={{ height: h, background: B.bg2, borderRadius: 10, border: `1px solid ${B.border}`, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, display: "flex", alignItems: "flex-end", gap: 3, padding: "0 10px", height: "100%" }}>
          {valores.map((v, i) => (
            <div key={i} title={emReais(v)} style={{ flex: 1, height: `${Math.max((v / max) * 92, v > 0 ? 4 : 1)}%`, background: i === valores.length - 1 ? c : c + "38", borderRadius: "3px 3px 0 0" }} />
          ))}
        </div>
      </div>
      {rotulos && (
        <Row gap={3} style={{ marginTop: 8 }}>
          {rotulos.map((r, i) => <div key={i} style={{ flex: 1, textAlign: "center", fontSize: 9, color: B.dim }}>{r}</div>)}
        </Row>
      )}
    </div>
  );
};

const ChartLine = ({ h = 110, valores, color }) => {
  const c = color || B.teal;
  const max = Math.max(...valores, 1);
  const pontos = valores.map((v, i) => {
    const x = valores.length > 1 ? (i / (valores.length - 1)) * 300 : 0;
    const y = 72 - (v / max) * 62;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const linha = pontos.join(" ");
  return (
    <div style={{ height: h, background: B.bg2, borderRadius: 10, border: `1px solid ${B.border}`, overflow: "hidden" }}>
      <svg width="100%" height="100%" viewBox="0 0 300 80" preserveAspectRatio="none">
        <polygon points={`0,80 ${linha} 300,80`} fill={c + "20"} />
        <polyline points={linha} fill="none" stroke={c} strokeWidth="2" />
      </svg>
    </div>
  );
};

const ImgBox = ({ h = 80, label }) => (
  <div style={{ height: h, background: B.bg2, border: `1px solid ${B.border}`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: B.dim, fontSize: 10, flexShrink: 0 }}>
    {label || "[ img ]"}
  </div>
);

const inputBase = { background: B.bg2, border: `1px solid ${B.border}`, borderRadius: 9, color: B.text, fontFamily: "inherit", outline: "none" };

const Field = ({ label, type = "text", placeholder, value, onChange, options, name }) => {
  // Controlado quando o pai fornece valor E handler; caso contrário o campo
  // guarda o próprio estado (usado nos campos e toggles apenas demonstrativos).
  const controlled = value !== undefined && typeof onChange === "function";
  const [localVal, setLocalVal] = useState(() => {
    if (value !== undefined) return value;
    if (type === "toggle") return true;
    if (type === "toggle-off") return false;
    return "";
  });
  const val = controlled ? value : localVal;

  const handleChange = (eVal) => {
    if (!controlled) setLocalVal(eVal);
    if (onChange) onChange(eVal);
  };

  return (
    <Col gap={5} style={{ flex: 1, minWidth: 0 }}>
      {label && <div style={{ fontSize: 10, fontWeight: 700, color: B.muted, letterSpacing: ".06em", textTransform: "uppercase" }}>{label}</div>}
      {type === "toggle" || type === "toggle-off" ? (
        <Row gap={8} onClick={() => handleChange(!val)} style={{ cursor: "pointer" }}>
          <div style={{
            width: 36, height: 20,
            background: val ? B.teal : B.border2,
            borderRadius: 10, padding: 3,
            display: "flex", alignItems: "center",
            justifyContent: val ? "flex-end" : "flex-start",
            transition: "all 0.2s", boxShadow: "inset 0 1px 2px rgba(0,0,0,0.4)",
          }}>
            <div style={{ width: 14, height: 14, background: "#fff", borderRadius: "50%", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
          </div>
          <span style={{ fontSize: 11, color: B.muted }}>{placeholder}</span>
        </Row>
      ) : type === "textarea" ? (
        <textarea
          name={name}
          value={val}
          onChange={e => handleChange(e.target.value)}
          placeholder={placeholder}
          style={{ ...inputBase, minHeight: 68, padding: "10px 12px", fontSize: 12, resize: "none" }}
        />
      ) : type === "select" ? (
        <select
          name={name}
          value={val}
          onChange={e => handleChange(e.target.value)}
          style={{ ...inputBase, height: 37, padding: "0 12px", fontSize: 12 }}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options ? options.map(o => {
            const valor = typeof o === "string" ? o : o.valor;
            const rotulo = typeof o === "string" ? o : o.rotulo;
            return <option key={valor} value={valor}>{rotulo}</option>;
          }) : (
            val ? <option value={val}>{val}</option> : null
          )}
        </select>
      ) : (
        <input
          name={name}
          type={type}
          value={val}
          onChange={e => handleChange(e.target.value)}
          placeholder={placeholder}
          style={{ ...inputBase, height: 37, padding: "0 12px", fontSize: 12 }}
        />
      )}
    </Col>
  );
};

const Divider = () => <div style={{ height: "1px", background: B.border, margin: "12px 0", opacity: 0.7 }} />;

const Table = ({ cols, rows }) => (
  <div style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${B.border}` }}>
    <div style={{ display: "grid", gridTemplateColumns: cols.map(() => "1fr").join(" "), background: B.card2, borderBottom: `1px solid ${B.border}`, padding: "0" }}>
      {cols.map((c, i) => <div key={i} style={{ fontSize: 10, color: B.muted, fontWeight: 700, padding: "10px 14px", letterSpacing: ".07em", textTransform: "uppercase" }}>{c}</div>)}
    </div>
    {rows.map((r, i) => (
      <div key={i} style={{ display: "grid", gridTemplateColumns: cols.map(() => "1fr").join(" "), borderBottom: i < rows.length - 1 ? `1px solid ${B.border}` : "none", background: i % 2 === 1 ? "rgba(255,255,255,0.015)" : "transparent" }}>
        {r.map((c, j) => <div key={j} style={{ padding: "11px 14px", fontSize: 11, color: j === 0 ? B.text : B.muted, fontWeight: j === 0 ? 600 : 400 }}>{c}</div>)}
      </div>
    ))}
  </div>
);

const Avatar = ({ name, color, size = 28 }) => {
  const c = color || B.teal;
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: `linear-gradient(135deg, ${c}55, ${c}22)`,
      border: `1.5px solid ${c}45`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: Math.round(size / 2.6), color: c, fontWeight: 800, flexShrink: 0,
      boxShadow: `0 2px 10px ${c}22, inset 0 1px 0 rgba(255,255,255,0.18)`,
    }}>
      {name ? name[0].toUpperCase() : "?"}
    </div>
  );
};

const PH = ({ title, sub, action, onAction, onExport }) => (
  <div style={{ marginBottom: 28 }}>
    <Row style={{ alignItems: "flex-start" }}>
      <Col gap={5} style={{ flex: 1 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: B.text, margin: 0, letterSpacing: "-0.04em", lineHeight: 1.1 }}>{title}</h2>
        {sub && <p style={{ fontSize: 12, color: B.muted, margin: 0, fontWeight: 400 }}>{sub}</p>}
      </Col>
      <Row gap={8}>
        {onExport && (
          <button onClick={onExport} title="Exportar PDF"
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 15px", borderRadius: 10, background: B.card, border: `1px solid ${B.border}`, color: B.muted, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)", transition: "all .14s" }}
            onMouseEnter={e => { e.currentTarget.style.color = B.text; e.currentTarget.style.borderColor = B.border2; }}
            onMouseLeave={e => { e.currentTarget.style.color = B.muted; e.currentTarget.style.borderColor = B.border; }}
          ><Download size={13} strokeWidth={1.8} /> PDF</button>
        )}
        {action && <Btn color={N.color} onClick={onAction}>{action}</Btn>}
      </Row>
    </Row>
  </div>
);

// ── Estados de carregamento e erro ────────────────────────────────────────────

const Girando = ({ size = 14, color }) => (
  <Loader2 size={size} color={color || B.muted} strokeWidth={2} className="crm-girar" />
);

const Carregando = ({ texto = "Carregando..." }) => (
  <Row gap={8} style={{ padding: "28px 0", justifyContent: "center", color: B.muted, fontSize: 12 }}>
    <Girando /> {texto}
  </Row>
);

const Aviso = ({ texto, onFechar }) => texto ? (
  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", background: B.red + "14", border: `1px solid ${B.red}45`, borderRadius: 10, fontSize: 12, color: B.red }}>
    <AlertTriangle size={15} strokeWidth={1.9} style={{ flexShrink: 0 }} />
    <span style={{ flex: 1 }}>{texto}</span>
    {onFechar && <span onClick={onFechar} style={{ cursor: "pointer", opacity: 0.8 }}><X size={14} strokeWidth={2.2} /></span>}
  </div>
) : null;

const Vazio = ({ texto }) => (
  <div style={{ fontSize: 12, color: B.muted, padding: "18px 0", textAlign: "center" }}>{texto}</div>
);

// Carrega um recurso da API e expõe {dados, erro, carregando, recarregar}.
// O setState mora nos callbacks da promise, nunca no corpo do efeito.
function useRecurso(carregar, deps = []) {
  const [estado, setEstado] = useState({ dados: null, erro: "", carregando: true });
  const [versao, setVersao] = useState(0);

  useEffect(() => {
    let ativo = true;
    carregar()
      .then(d => { if (ativo) setEstado({ dados: d, erro: "", carregando: false }); })
      .catch(e => { if (ativo) setEstado({ dados: null, erro: e.message, carregando: false }); });
    return () => { ativo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [versao, ...deps]);

  const recarregar = () => {
    setEstado(e => ({ ...e, carregando: true }));
    setVersao(v => v + 1);
  };

  return { ...estado, recarregar };
}

// ── Exportação PDF ────────────────────────────────────────────────────────────
function makePDF(nomeNegocio, sections) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const now = new Date().toLocaleString("pt-BR");

  doc.setFillColor(22, 27, 34);
  doc.rect(0, 0, W, 22, "F");
  doc.setTextColor(230, 232, 240);
  doc.setFontSize(13); doc.setFont("helvetica", "bold");
  doc.text("ControlCRM — Exportação de Dados", 14, 10);
  doc.setFontSize(8); doc.setFont("helvetica", "normal");
  doc.text(`${nomeNegocio} · Barbearia`, 14, 16);
  doc.text(`Gerado em ${now}`, W - 14, 16, { align: "right" });

  doc.setFontSize(8); doc.setTextColor(104, 116, 138);
  doc.text("Este arquivo foi gerado para migração de dados. Importe-o no seu novo sistema.", 14, 28);

  let y = 34;
  sections.forEach(({ title, columns, rows }) => {
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(40, 40, 40);
    doc.text(title, 14, y); y += 4;
    autoTable(doc, {
      startY: y, head: [columns], body: rows,
      theme: "grid", headStyles: { fillColor: [22, 27, 34], textColor: [230, 232, 240], fontSize: 8, fontStyle: "bold" },
      bodyStyles: { fontSize: 8, textColor: [40, 40, 40] },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      margin: { left: 14, right: 14 },
    });
    y = doc.lastAutoTable.finalY + 10;
  });

  doc.save(`ControlCRM_${nomeNegocio.replace(/\s+/g, "_")}_${Date.now()}.pdf`);
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
const Dashboard = ({ user, onNavigate }) => {
  const { dados, erro, carregando } = useRecurso(() => api.dashboard.carregar());
  const hoje = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

  const quickLinks = [
    { id: "agenda",        icon: CalendarDays, label: "Ver Agenda" },
    { id: "fila",          icon: ListOrdered,  label: "Fila de Espera" },
    { id: "ficharegistro", icon: User,         label: "Clientes" },
    { id: "financeiro",    icon: Wallet,       label: "Financeiro" },
  ];

  const iconeOrigem = { agenda: CalendarDays, fila: ListOrdered, manual: CheckCircle };

  return (
    <Col gap={16}>
      <Row style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        <Col gap={3}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: B.text, margin: 0 }}>Olá, {user.nome.split(" ")[0]}</h2>
          <p style={{ fontSize: 12, color: B.muted, margin: 0, textTransform: "capitalize" }}>{hoje}</p>
        </Col>
        <Badge text={user.barbearia} color={N.color} />
      </Row>

      <Aviso texto={erro} />
      {carregando && !dados && <Carregando texto="Carregando indicadores..." />}

      {dados && (
        <>
          <Row gap={10}>
            <Stat label="Receita do mês" value={emReaisCurto(dados.receitaMes)} sub={`${dados.atendimentosMes} atendimentos`} color={N.secondary} />
            <Stat label="Ticket médio" value={emReais(dados.ticketMedio)} color={N.color} />
            <Stat label="Clientes" value={dados.clientes + ""} sub={`${dados.assinantes} assinantes`} color={B.teal} />
            <Stat label="Na fila agora" value={dados.naFila + ""} sub="aguardando" color={dados.naFila > 0 ? B.amber : B.muted} />
          </Row>

          <Row gap={10} style={{ alignItems: "flex-start" }}>
            <Col gap={10} style={{ flex: 2 }}>
              <Card title="Acesso Rápido">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
                  {quickLinks.map(q => (
                    <div key={q.id} onClick={() => onNavigate(q.id)} style={{ padding: "14px 8px", textAlign: "center", background: B.bg2, borderRadius: 8, border: `0.5px solid ${B.border}`, cursor: "pointer", transition: "all .15s" }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = N.color + "80"; e.currentTarget.style.background = N.color + "10"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = B.border; e.currentTarget.style.background = B.bg2; }}>
                      <div style={{ marginBottom: 6, display: "flex", justifyContent: "center" }}><q.icon size={22} color={N.color} strokeWidth={1.6} /></div>
                      <div style={{ fontSize: 10, color: B.muted, fontWeight: 600 }}>{q.label}</div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card title="Faturamento — últimos 7 dias">
                <ChartBar
                  h={110}
                  color={N.color}
                  valores={dados.semana.map(d => d.total)}
                  rotulos={dados.semana.map(d => rotuloDia(d.data).split(" ")[0])}
                />
                <div style={{ fontSize: 10, color: B.muted, marginTop: 10, display: "flex", alignItems: "center", gap: 5 }}>
                  <TrendingUp size={11} strokeWidth={1.8} />
                  Total na semana: {emReais(dados.semana.reduce((s, d) => s + d.total, 0))}
                </div>
              </Card>
            </Col>

            <Col gap={10} style={{ flex: 1 }}>
              <Card title="Próximos agendamentos">
                {dados.proximos.length === 0 && <Vazio texto="Nenhum horário marcado." />}
                {dados.proximos.map((a, i) => (
                  <Row key={a.id} gap={10} style={{ padding: "8px 0", borderBottom: i < dados.proximos.length - 1 ? `0.5px solid ${B.border}` : "none" }}>
                    <Col gap={1} style={{ minWidth: 44 }}>
                      <span style={{ fontSize: 11, color: N.color, fontWeight: 700 }}>{a.hora}</span>
                      <span style={{ fontSize: 9, color: B.dim }}>{dataCurta(a.data)}</span>
                    </Col>
                    <Col gap={2} style={{ flex: 1 }}>
                      <span style={{ fontSize: 12, color: B.text, fontWeight: 600 }}>{a.cliente_nome}</span>
                      <span style={{ fontSize: 10, color: B.muted }}>{a.servico}</span>
                    </Col>
                    <Badge text={emReais(a.valor)} color={B.teal} />
                  </Row>
                ))}
                <div style={{ marginTop: 10 }}><Btn sm color={N.color} onClick={() => onNavigate("agenda")}>Ver agenda completa</Btn></div>
              </Card>

              <Card title="Atendimentos recentes">
                {dados.atividade.length === 0 && <Vazio texto="Nenhum atendimento registrado." />}
                {dados.atividade.map((a, i) => {
                  const Icone = iconeOrigem[a.origem] || CheckCircle;
                  return (
                    <Row key={i} gap={8} style={{ padding: "7px 0", borderBottom: i < dados.atividade.length - 1 ? `0.5px solid ${B.border}` : "none" }}>
                      <Icone size={14} color={N.secondary} strokeWidth={1.8} style={{ flexShrink: 0 }} />
                      <Col gap={1} style={{ flex: 1 }}>
                        <span style={{ fontSize: 11, color: B.text }}>{a.cliente_nome} — {a.servico}</span>
                        <span style={{ fontSize: 10, color: B.muted }}>{dataCurta(a.data)} · {emReais(a.valor)}</span>
                      </Col>
                    </Row>
                  );
                })}
              </Card>
            </Col>
          </Row>
        </>
      )}
    </Col>
  );
};

// ── Agenda ────────────────────────────────────────────────────────────────────
const Agenda = () => {
  const [inicio, setInicio] = useState(() => segundaDaSemana(hojeISO()));
  const dias = Array.from({ length: 6 }, (_, i) => somarDias(inicio, i)); // seg → sáb
  const fim = dias[dias.length - 1];

  const agenda = useRecurso(() => api.agenda.listar(inicio, fim), [inicio]);
  const clientes = useRecurso(() => api.clientes.listar());

  const [selecionadoId, setSelecionadoId] = useState(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [erroAcao, setErroAcao] = useState("");
  const [salvando, setSalvando] = useState(false);

  const [fDia, setFDia] = useState(dias[0]);
  const [fHora, setFHora] = useState(HORARIOS[1]);
  const [fCliente, setFCliente] = useState("");
  const [fServico, setFServico] = useState(N.services[0][0]);
  const [fPro, setFPro] = useState(N.pros[0]);

  const lista = agenda.dados || [];
  const porSlot = {};
  lista.forEach(a => { if (a.status !== "Cancelado") porSlot[`${a.data}-${a.hora}`] = a; });
  const selecionado = lista.find(a => a.id === selecionadoId) || null;
  const hoje = hojeISO();

  const acao = async (fn) => {
    setErroAcao("");
    setSalvando(true);
    try {
      await fn();
      agenda.recarregar();
    } catch (e) {
      setErroAcao(e.message);
    } finally {
      setSalvando(false);
    }
  };

  const criar = () => acao(async () => {
    const cliente = (clientes.dados || []).find(c => c.id === fCliente);
    if (!cliente) throw new Error("Selecione um cliente.");
    await api.agenda.criar({
      cliente_id: cliente.id,
      cliente_nome: cliente.nome,
      data: fDia,
      hora: fHora,
      servico: fServico,
      profissional: fPro,
      valor: paraNumero(precoDoServico(fServico)),
    });
    setMostrarForm(false);
  });

  const irParaSemana = (delta) => {
    setSelecionadoId(null);
    setInicio(somarDias(inicio, delta * 7));
  };

  return (
    <Col gap={14}>
      <PH
        title="Agenda"
        sub={periodoDaSemana(inicio, fim)}
        action={mostrarForm ? "Fechar Formulário" : "+ Novo Agendamento"}
        onAction={() => setMostrarForm(v => !v)}
        onExport={() => makePDF(N.name, [{
          title: `Agendamentos — ${periodoDaSemana(inicio, fim)}`,
          columns: ["Cliente", "Serviço", "Data", "Hora", "Barbeiro", "Status", "Valor"],
          rows: lista.map(a => [a.cliente_nome, a.servico, dataCurta(a.data), a.hora, a.profissional, a.status, emReais(a.valor)]),
        }])}
      />

      <Aviso texto={agenda.erro || erroAcao} onFechar={() => setErroAcao("")} />

      <Row gap={10}>
        <Row gap={6}>
          <Btn sm onClick={() => irParaSemana(-1)}><ChevronLeft size={13} strokeWidth={2} /> Anterior</Btn>
          <Btn sm onClick={() => setInicio(segundaDaSemana(hojeISO()))}>Hoje</Btn>
          <Btn sm onClick={() => irParaSemana(1)}>Próxima <ChevronRight size={13} strokeWidth={2} /></Btn>
        </Row>
        <Stat label="Na semana" value={lista.filter(a => a.status !== "Cancelado").length + ""} />
        <Stat label="Pagos" value={lista.filter(a => a.status === "Pago").length + ""} color={N.secondary} />
        <Stat label="A receber" value={emReais(lista.filter(a => a.status === "Confirmado").reduce((s, a) => s + a.valor, 0))} color={B.amber} />
      </Row>

      {mostrarForm && (
        <Card title="Novo Agendamento">
          {clientes.dados?.length === 0 && (
            <Aviso texto="Cadastre um cliente antes de agendar — a ficha do cliente fica em Ficha do Cliente." />
          )}
          <Row gap={10}>
            <Field label="DIA" type="select" value={fDia} onChange={setFDia}
              options={dias.map(d => ({ valor: d, rotulo: rotuloDia(d) }))} />
            <Field label="HORA" type="select" value={fHora} onChange={setFHora} options={HORARIOS} />
            <Field label="CLIENTE" type="select" value={fCliente} onChange={setFCliente}
              placeholder="Selecione..."
              options={(clientes.dados || []).map(c => ({ valor: c.id, rotulo: c.nome }))} />
            <Field label="SERVIÇO" type="select" value={fServico} onChange={setFServico} options={N.services.map(s => s[0])} />
            <Field label="BARBEIRO" type="select" value={fPro} onChange={setFPro} options={N.pros} />
          </Row>
          <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end", gap: 10, alignItems: "center" }}>
            <span style={{ fontSize: 11, color: B.muted }}>Valor: {precoDoServico(fServico)}</span>
            <Btn onClick={() => setMostrarForm(false)}>Cancelar</Btn>
            <Btn color={N.color} onClick={criar} disabled={salvando}>{salvando ? "Salvando..." : "Agendar"}</Btn>
          </div>
        </Card>
      )}

      <Row gap={10} style={{ alignItems: "flex-start" }}>
        <Card style={{ flex: 3, overflowX: "auto" }}>
          {agenda.carregando && !agenda.dados ? <Carregando texto="Carregando agenda..." /> : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "48px repeat(6,1fr)", marginBottom: 4 }}>
                <div />
                {dias.map(d => (
                  <div key={d} style={{ textAlign: "center", fontSize: 11, color: d === hoje ? N.color : B.muted, fontWeight: d === hoje ? 700 : 400, paddingBottom: 8, borderBottom: `2px solid ${d === hoje ? N.color : B.border}` }}>{rotuloDia(d)}</div>
                ))}
              </div>
              {HORARIOS.map(h => (
                <div key={h} style={{ display: "grid", gridTemplateColumns: "48px repeat(6,1fr)", borderBottom: `0.5px solid ${B.border}`, minHeight: 40 }}>
                  <div style={{ fontSize: 10, color: B.dim, paddingTop: 4, paddingRight: 8, textAlign: "right" }}>{h}</div>
                  {dias.map(d => {
                    const a = porSlot[`${d}-${h}`];
                    const ativo = a && a.id === selecionadoId;
                    const c = a ? (a.status === "Pago" ? N.secondary : (ativo ? N.color : B.teal)) : "transparent";
                    return (
                      <div key={d} style={{ borderLeft: `0.5px solid ${B.border}`, padding: "3px 4px", background: d === hoje ? N.color + "08" : "transparent" }}>
                        {a && (
                          <div onClick={() => setSelecionadoId(a.id)}
                            style={{ background: c + "25", border: `0.5px solid ${c}`, borderRadius: 5, padding: "3px 6px", fontSize: 10, color: c, lineHeight: 1.3, cursor: "pointer", fontWeight: ativo ? 700 : 400 }}>
                            {a.cliente_nome} — {a.servico}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </>
          )}
        </Card>

        <Col gap={10} style={{ flex: 1 }}>
          <Card title="Detalhes">
            {!selecionado && <Vazio texto="Clique em um horário para ver os detalhes." />}
            {selecionado && (
              <>
                <Row gap={8} style={{ marginBottom: 10 }}>
                  <Avatar name={selecionado.cliente_nome} color={N.color} size={36} />
                  <Col gap={2}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: B.text }}>{selecionado.cliente_nome}</span>
                    <span style={{ fontSize: 11, color: B.muted }}>{selecionado.servico}</span>
                  </Col>
                </Row>
                <Divider />
                <Col gap={8}>
                  <Row style={{ justifyContent: "space-between" }}><span style={{ fontSize: 11, color: B.muted }}>Data</span><span style={{ fontSize: 11, color: B.text }}>{rotuloDia(selecionado.data)} — {selecionado.hora}</span></Row>
                  <Row style={{ justifyContent: "space-between" }}><span style={{ fontSize: 11, color: B.muted }}>Valor</span><span style={{ fontSize: 11, color: B.text }}>{emReais(selecionado.valor)}</span></Row>
                  <Row style={{ justifyContent: "space-between" }}><span style={{ fontSize: 11, color: B.muted }}>Barbeiro</span><span style={{ fontSize: 11, color: B.text }}>{selecionado.profissional || "—"}</span></Row>
                  <Row style={{ justifyContent: "space-between" }}>
                    <span style={{ fontSize: 11, color: B.muted }}>Status</span>
                    <Badge text={selecionado.status} color={selecionado.status === "Pago" ? N.secondary : selecionado.status === "Cancelado" ? B.red : B.teal} />
                  </Row>
                </Col>
                <Divider />
                <Col gap={6}>
                  {selecionado.status === "Confirmado" && (
                    <Btn color={N.color} disabled={salvando} onClick={() => acao(() => api.agenda.pagar(selecionado.id))}>
                      <Check size={12} strokeWidth={2} /> Marcar como pago
                    </Btn>
                  )}
                  <Row gap={6}>
                    {selecionado.status === "Confirmado" && (
                      <Btn sm danger disabled={salvando} onClick={() => acao(() => api.agenda.cancelar(selecionado.id))}>Cancelar</Btn>
                    )}
                    <Btn sm danger disabled={salvando} onClick={() => acao(async () => {
                      await api.agenda.remover(selecionado.id);
                      setSelecionadoId(null);
                    })}><Trash2 size={12} strokeWidth={1.8} /> Remover</Btn>
                  </Row>
                  {selecionado.status === "Pago" && (
                    <span style={{ fontSize: 10, color: B.muted, lineHeight: 1.5 }}>
                      O pagamento já gerou uma visita na ficha do cliente e entrou no faturamento.
                    </span>
                  )}
                </Col>
              </>
            )}
          </Card>

          <Card title="Cancelados na semana">
            {lista.filter(a => a.status === "Cancelado").length === 0 && <Vazio texto="Nenhum cancelamento." />}
            {lista.filter(a => a.status === "Cancelado").map(a => (
              <Row key={a.id} style={{ justifyContent: "space-between", padding: "7px 0", borderBottom: `0.5px solid ${B.border}` }}>
                <Col gap={1}>
                  <span style={{ fontSize: 11, color: B.muted, textDecoration: "line-through" }}>{a.cliente_nome}</span>
                  <span style={{ fontSize: 10, color: B.dim }}>{dataCurta(a.data)} · {a.hora}</span>
                </Col>
                <span onClick={() => acao(() => api.agenda.remover(a.id))} style={{ cursor: "pointer", color: B.red, fontWeight: 700 }}><X size={13} strokeWidth={2.2} /></span>
              </Row>
            ))}
          </Card>
        </Col>
      </Row>
    </Col>
  );
};

// ── Fila de espera ────────────────────────────────────────────────────────────
const FilaEspera = () => {
  const fila = useRecurso(() => api.fila.listar());
  const clientes = useRecurso(() => api.clientes.listar());

  const [fNome, setFNome] = useState("");
  const [fServico, setFServico] = useState(N.services[0][0]);
  const [fBarbeiro, setFBarbeiro] = useState("Qualquer");
  const [fTipo, setFTipo] = useState("avulso");
  const [erroAcao, setErroAcao] = useState("");
  const [salvando, setSalvando] = useState(false);

  const lista = fila.dados || [];

  const acao = async (fn) => {
    setErroAcao("");
    setSalvando(true);
    try { await fn(); fila.recarregar(); }
    catch (e) { setErroAcao(e.message); }
    finally { setSalvando(false); }
  };

  const entrar = () => acao(async () => {
    if (!fNome.trim()) throw new Error("Informe o nome do cliente.");
    // Se o nome bate com uma ficha existente, vincula — assim o atendimento
    // entra no histórico do cliente certo.
    const existente = (clientes.dados || []).find(c => c.nome.toLowerCase() === fNome.trim().toLowerCase());
    await api.fila.entrar({
      cliente_id: existente?.id ?? null,
      nome: fNome.trim(),
      servico: fServico,
      profissional: fBarbeiro,
      tipo: fTipo,
    });
    setFNome(""); setFTipo("avulso");
  });

  const atender = (item) => acao(() => api.fila.atender(item.id, {
    valor: paraNumero(precoDoServico(item.servico)),
    profissional: item.profissional === "Qualquer" ? N.pros[0] : item.profissional,
  }));

  return (
    <Col gap={14}>
      <PH title="Fila de Espera" sub="Clientes walk-in — atender registra o atendimento no caixa e na ficha" />
      <Aviso texto={fila.erro || erroAcao} onFechar={() => setErroAcao("")} />

      <Row gap={10}>
        <Stat label="Na fila agora" value={lista.length + ""} sub="aguardando" color={N.color} />
        <Stat label="Barbeiros" value={N.pros.length + ""} color={B.teal} />
        <Stat label="Assinantes na fila" value={lista.filter(c => c.tipo === "assinante").length + ""} color={N.secondary} />
      </Row>

      <Row gap={10} style={{ alignItems: "flex-start" }}>
        <Card title="Fila atual" style={{ flex: 2 }}>
          {fila.carregando && !fila.dados && <Carregando />}
          {fila.dados && lista.length === 0 && <Vazio texto="Fila vazia — nenhum cliente aguardando." />}
          {lista.map((c, i) => (
            <div key={c.id} style={{ borderBottom: `0.5px solid ${B.border}`, padding: "12px 0", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: i === 0 ? N.color + "30" : B.border2, border: `0.5px solid ${i === 0 ? N.color : B.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: i === 0 ? N.color : B.muted, flexShrink: 0 }}>{i + 1}°</div>
              <Col gap={3} style={{ flex: 1 }}>
                <Row style={{ justifyContent: "space-between" }}>
                  <Row gap={8}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: B.text }}>{c.nome}</span>
                    <Badge text={TIPO_CLIENTE[c.tipo]?.label || c.tipo} color={TIPO_CLIENTE[c.tipo]?.color || B.muted} />
                    {!c.cliente_id && <Badge text="sem ficha" color={B.dim} />}
                  </Row>
                  <Badge text={`Entrou ${c.entrou}`} color={B.muted} />
                </Row>
                <Row gap={10}>
                  <span style={{ fontSize: 11, color: B.muted }}>{c.servico} · {precoDoServico(c.servico)}</span>
                  <span style={{ fontSize: 11, color: B.muted, display: "flex", alignItems: "center", gap: 4 }}><User size={11} strokeWidth={1.8} /> {c.profissional}</span>
                </Row>
              </Col>
              <Row gap={6}>
                <Btn sm color={N.color} disabled={salvando} onClick={() => atender(c)}><Check size={12} strokeWidth={2} /> Atender</Btn>
                <span onClick={() => acao(() => api.fila.remover(c.id))} style={{ cursor: "pointer", color: B.red, fontWeight: 700, padding: "4px 6px" }}><X size={14} strokeWidth={2.2} /></span>
              </Row>
            </div>
          ))}
        </Card>

        <Col gap={10} style={{ flex: 1 }}>
          <Card title="Adicionar à fila">
            <Field label="NOME DO CLIENTE" placeholder="Nome" value={fNome} onChange={setFNome} />
            {(clientes.dados || []).length > 0 && (
              <Field label="OU ESCOLHA UMA FICHA" type="select" value="" onChange={v => { if (v) setFNome(v); }}
                placeholder="Clientes cadastrados..."
                options={(clientes.dados || []).map(c => c.nome)} />
            )}
            <Field label="SERVIÇO" type="select" value={fServico} onChange={setFServico} options={N.services.map(s => s[0])} />
            <Field label="BARBEIRO" type="select" value={fBarbeiro} onChange={setFBarbeiro} options={["Qualquer", ...N.pros]} />
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: B.muted, marginBottom: 8, letterSpacing: ".06em" }}>TIPO DE CLIENTE</div>
              <Row gap={8}>
                {Object.entries(TIPO_CLIENTE).map(([key, t]) => (
                  <div key={key} onClick={() => setFTipo(key)} style={{ flex: 1, padding: "8px 10px", borderRadius: 7, border: `1px solid ${fTipo === key ? t.color + "70" : B.border}`, background: fTipo === key ? t.color + "15" : B.bg2, cursor: "pointer", textAlign: "center", transition: "all .15s" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: fTipo === key ? t.color : B.muted }}>{t.label}</span>
                  </div>
                ))}
              </Row>
            </div>
            <div style={{ marginTop: 12 }}><Btn color={N.color} onClick={entrar} disabled={salvando}>+ Entrar na fila</Btn></div>
          </Card>

          <Card title="Status dos Barbeiros">
            {N.pros.map((p, i) => {
              const ocupado = lista.some(c => c.profissional === p);
              return (
                <Row key={i} style={{ justifyContent: "space-between", borderBottom: `0.5px solid ${B.border}`, padding: "10px 0" }}>
                  <Row gap={8}><Avatar name={p} color={N.color} size={28} /><span style={{ fontSize: 12, color: B.text }}>{p}</span></Row>
                  <Badge text={ocupado ? "Com fila" : "Disponível"} color={ocupado ? B.amber : B.teal} />
                </Row>
              );
            })}
          </Card>
        </Col>
      </Row>
    </Col>
  );
};

// ── Ficha do cliente ──────────────────────────────────────────────────────────
const FichaCliente = () => {
  const clientes = useRecurso(() => api.clientes.listar());
  const [selecionadoId, setSelecionadoId] = useState(null);
  const [mostrarAdd, setMostrarAdd] = useState(false);
  const [erroAcao, setErroAcao] = useState("");
  const [salvando, setSalvando] = useState(false);

  const [fNome, setFNome] = useState("");
  const [fTel, setFTel] = useState("");
  const [fTipo, setFTipo] = useState("avulso");

  const lista = clientes.dados || [];
  const selecionado = lista.find(c => c.id === selecionadoId) || null;

  const acao = async (fn) => {
    setErroAcao("");
    setSalvando(true);
    try { await fn(); clientes.recarregar(); }
    catch (e) { setErroAcao(e.message); }
    finally { setSalvando(false); }
  };

  const criar = () => acao(async () => {
    await api.clientes.criar({ nome: fNome, telefone: fTel, tipo: fTipo, barbeiro_pref: N.pros[0] });
    setFNome(""); setFTel(""); setFTipo("avulso"); setMostrarAdd(false);
  });

  if (selecionado) {
    return (
      <DetalheCliente
        cliente={selecionado}
        salvando={salvando}
        erro={erroAcao}
        onLimparErro={() => setErroAcao("")}
        onVoltar={() => setSelecionadoId(null)}
        onAcao={acao}
        onRemovido={() => setSelecionadoId(null)}
      />
    );
  }

  return (
    <Col gap={14}>
      <PH title="Fichas de Clientes"
        sub={clientes.dados ? `${lista.length} clientes · ${lista.filter(c => c.tipo === "assinante").length} assinantes` : "Carregando..."}
        action={mostrarAdd ? "Fechar" : "+ Novo Cliente"}
        onAction={() => setMostrarAdd(v => !v)}
        onExport={() => makePDF(N.name, [{
          title: "Clientes",
          columns: ["Nome", "Telefone", "Tipo", "Visitas", "Última visita", "Total gasto"],
          rows: lista.map(c => [c.nome, c.telefone || "—", TIPO_CLIENTE[c.tipo].label, c.visitas + "", dataCurta(c.ultima_visita), emReais(c.total_gasto)]),
        }])} />

      <Aviso texto={clientes.erro || erroAcao} onFechar={() => setErroAcao("")} />

      <Row gap={10}>
        <Stat label="Assinantes" value={lista.filter(c => c.tipo === "assinante").length + ""} color={B.teal} />
        <Stat label="Avulsos" value={lista.filter(c => c.tipo === "avulso").length + ""} color={B.amber} />
        <Stat label="Total" value={lista.length + ""} color={N.color} />
        <Stat label="Faturado com eles" value={emReaisCurto(lista.reduce((s, c) => s + c.total_gasto, 0))} color={N.secondary} />
      </Row>

      {mostrarAdd && (
        <Card title="Cadastrar Cliente">
          <Row gap={10}>
            <Field label="NOME" placeholder="Nome do cliente" value={fNome} onChange={setFNome} />
            <Field label="TELEFONE" placeholder="(11) 99999-9999" value={fTel} onChange={setFTel} />
          </Row>
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: B.muted, marginBottom: 8, letterSpacing: ".06em" }}>TIPO DE CLIENTE</div>
            <Row gap={8}>
              {Object.entries(TIPO_CLIENTE).map(([key, t]) => (
                <div key={key} onClick={() => setFTipo(key)} style={{ flex: 1, padding: "10px 14px", borderRadius: 8, border: `1px solid ${fTipo === key ? t.color + "70" : B.border}`, background: fTipo === key ? t.color + "15" : B.bg2, cursor: "pointer", textAlign: "center", transition: "all .15s" }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: fTipo === key ? t.color : B.muted }}>{t.label}</div>
                </div>
              ))}
            </Row>
          </div>
          <Row gap={8} style={{ marginTop: 14, justifyContent: "flex-end" }}>
            <Btn onClick={() => setMostrarAdd(false)}>Cancelar</Btn>
            <Btn color={N.color} onClick={criar} disabled={salvando}>{salvando ? "Salvando..." : "Salvar"}</Btn>
          </Row>
        </Card>
      )}

      <Card title="Lista de Clientes">
        {clientes.carregando && !clientes.dados && <Carregando />}
        {clientes.dados && lista.length === 0 && <Vazio texto="Nenhum cliente cadastrado ainda." />}
        {lista.map(c => (
          <div key={c.id} style={{ borderBottom: `0.5px solid ${B.border}`, padding: "12px 0", display: "flex", alignItems: "center", gap: 12 }}>
            <Avatar name={c.nome} color={TIPO_CLIENTE[c.tipo].color} size={38} />
            <Col gap={3} style={{ flex: 1 }}>
              <Row gap={8}>
                <span style={{ fontSize: 13, fontWeight: 600, color: B.text }}>{c.nome}</span>
                <Badge text={TIPO_CLIENTE[c.tipo].label} color={TIPO_CLIENTE[c.tipo].color} />
              </Row>
              <Row gap={14}>
                <span style={{ fontSize: 11, color: B.muted }}><Phone size={11} strokeWidth={1.8} /> {c.telefone || "—"}</span>
                <span style={{ fontSize: 11, color: B.muted }}>{c.visitas} visitas · última {dataCurta(c.ultima_visita)}</span>
              </Row>
            </Col>
            <Row gap={6}>
              <Badge text={emReais(c.total_gasto)} color={N.color} />
              <Btn sm color={N.color} onClick={() => setSelecionadoId(c.id)}>Ver Ficha →</Btn>
              <span onClick={() => acao(() => api.clientes.remover(c.id))} style={{ cursor: "pointer", color: B.red, fontWeight: 700, padding: "4px 6px" }}><X size={14} strokeWidth={2.2} /></span>
            </Row>
          </div>
        ))}
      </Card>
    </Col>
  );
};

const DetalheCliente = ({ cliente, salvando, erro, onLimparErro, onVoltar, onAcao, onRemovido }) => {
  const visitas = useRecurso(() => api.clientes.visitas(cliente.id), [cliente.id]);
  const [obs, setObs] = useState(cliente.obs);
  const [pref, setPref] = useState(cliente.barbeiro_pref || N.pros[0]);
  const [regSvc, setRegSvc] = useState(N.services[0][0]);
  const [regBarb, setRegBarb] = useState(N.pros[0]);
  const [regValor, setRegValor] = useState(N.services[0][2]);

  const historico = visitas.dados || [];

  const comRecarga = (fn) => onAcao(async () => { await fn(); visitas.recarregar(); });

  return (
    <Col gap={14}>
      <Row style={{ justifyContent: "space-between" }}>
        <Row gap={10}>
          <button onClick={onVoltar} style={{ background: "transparent", border: `0.5px solid ${B.border}`, color: B.muted, cursor: "pointer", fontSize: 12, padding: "6px 12px", borderRadius: 7, fontFamily: "inherit" }}>← Voltar</button>
          <Col gap={2}>
            <Row gap={8}>
              <span style={{ fontSize: 17, fontWeight: 700, color: B.text }}>{cliente.nome}</span>
              <Badge text={TIPO_CLIENTE[cliente.tipo].label} color={TIPO_CLIENTE[cliente.tipo].color} />
            </Row>
            <span style={{ fontSize: 11, color: B.muted }}>{cliente.telefone || "sem telefone"}</span>
          </Col>
        </Row>
        <Row gap={8}>
          <button
            disabled={salvando}
            onClick={() => onAcao(() => api.clientes.atualizar(cliente.id, { tipo: cliente.tipo === "assinante" ? "avulso" : "assinante" }))}
            style={{ padding: "6px 12px", borderRadius: 7, border: `0.5px solid ${TIPO_CLIENTE[cliente.tipo].color}60`, background: TIPO_CLIENTE[cliente.tipo].color + "18", color: TIPO_CLIENTE[cliente.tipo].color, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
          >
            Tornar {cliente.tipo === "assinante" ? "Avulso" : "Assinante"}
          </button>
          <Btn danger disabled={salvando} onClick={() => onAcao(async () => {
            await api.clientes.remover(cliente.id);
            onRemovido();
          })}><Trash2 size={12} strokeWidth={1.8} /> Remover</Btn>
        </Row>
      </Row>

      <Aviso texto={erro || visitas.erro} onFechar={onLimparErro} />

      <Row gap={10}>
        <Stat label="Total gasto" value={emReais(cliente.total_gasto)} color={N.color} />
        <Stat label="Visitas" value={cliente.visitas + ""} />
        <Stat label="Última visita" value={dataCurta(cliente.ultima_visita)} />
        <Stat label="Tipo" value={TIPO_CLIENTE[cliente.tipo].label} color={TIPO_CLIENTE[cliente.tipo].color} />
      </Row>

      <Row gap={10} style={{ alignItems: "flex-start" }}>
        <Card title="Preferências de corte" style={{ flex: 1 }}>
          <Field label="OBSERVAÇÕES" type="textarea" value={obs} onChange={setObs} placeholder="Como ele gosta do corte..." />
          <Field label="BARBEIRO PREFERIDO" type="select" value={pref} onChange={setPref} options={N.pros} />
          <div style={{ marginTop: 12 }}>
            <Btn color={N.color} disabled={salvando}
              onClick={() => onAcao(() => api.clientes.atualizar(cliente.id, { obs, barbeiro_pref: pref }))}>
              {salvando ? "Salvando..." : "Salvar preferências"}
            </Btn>
          </div>
        </Card>

        <Col gap={10} style={{ flex: 1 }}>
          <Card title="Histórico de Visitas">
            {visitas.carregando && !visitas.dados && <Carregando />}
            {visitas.dados && historico.length === 0 && <Vazio texto="Nenhuma visita registrada ainda." />}
            {historico.map(h => (
              <div key={h.id} style={{ borderBottom: `0.5px solid ${B.border}`, padding: "8px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Col gap={1}>
                  <span style={{ fontSize: 12, color: B.text }}>{h.servico}</span>
                  <span style={{ fontSize: 10, color: B.muted }}>{dataCurta(h.data)} · {h.profissional || "—"} · {emReais(h.valor)}</span>
                </Col>
                <span onClick={() => comRecarga(() => api.clientes.removerVisita(cliente.id, h.id))}
                  style={{ cursor: "pointer", color: B.red, fontWeight: 700 }}><X size={14} strokeWidth={2.2} /></span>
              </div>
            ))}
            <Col gap={8} style={{ marginTop: 12 }}>
              <Row gap={8}>
                <Field label="SERVIÇO" type="select" value={regSvc}
                  onChange={v => { setRegSvc(v); setRegValor(precoDoServico(v)); }}
                  options={N.services.map(s => s[0])} />
                <Field label="BARBEIRO" type="select" value={regBarb} onChange={setRegBarb} options={N.pros} />
                <Field label="VALOR" value={regValor} onChange={setRegValor} />
              </Row>
              <div>
                <Btn color={N.color} disabled={salvando} onClick={() => comRecarga(() => api.clientes.registrarVisita(cliente.id, {
                  servico: regSvc, profissional: regBarb, valor: paraNumero(regValor),
                }))}><CheckCircle size={12} strokeWidth={1.8} /> Registrar Visita</Btn>
              </div>
            </Col>
          </Card>
        </Col>
      </Row>
    </Col>
  );
};

// ── Financeiro ────────────────────────────────────────────────────────────────
const Financeiro = () => {
  const visitas = useRecurso(() => api.visitas.listar(30));
  const resumo = useRecurso(() => api.visitas.resumo());

  // Despesas seguem em memória: não há tabela de gastos neste MVP.
  const [despesas, setDespesas] = useState([
    { name: "Aluguel", value: 3500, status: "Pago" },
    { name: "Produtos", value: 2800, status: "Pago" },
    { name: "Energia", value: 680, status: "Pendente" },
    { name: "Internet", value: 180, status: "Pago" },
  ]);
  const [nomeGasto, setNomeGasto] = useState("");
  const [valorGasto, setValorGasto] = useState("");
  const [mostrarAdd, setMostrarAdd] = useState(false);

  const pagamentos = visitas.dados || [];
  const receita = resumo.dados?.receitaMes ?? 0;
  const totalDespesas = despesas.reduce((s, e) => s + (Number(e.value) || 0), 0);
  const meses = resumo.dados?.meses || [];

  const addGasto = () => {
    if (!nomeGasto.trim() || !valorGasto.trim()) return;
    setDespesas(prev => [...prev, { name: nomeGasto.trim(), value: paraNumero(valorGasto), status: "Pago" }]);
    setNomeGasto(""); setValorGasto(""); setMostrarAdd(false);
  };

  const rotuloMes = (ym) => {
    const [ano, mes] = ym.split("-").map(Number);
    return new Date(ano, mes - 1, 1).toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
  };

  return (
    <Col gap={14}>
      <PH
        title="Financeiro"
        sub="Receita real vinda dos atendimentos registrados"
        action={mostrarAdd ? "Fechar" : "+ Novo Gasto"}
        onAction={() => setMostrarAdd(v => !v)}
        onExport={() => makePDF(N.name, [
          { title: "Atendimentos", columns: ["Data", "Cliente", "Serviço", "Barbeiro", "Valor"], rows: pagamentos.map(p => [dataCurta(p.data), p.cliente_nome, p.servico, p.profissional || "—", emReais(p.valor)]) },
          { title: "Gastos", columns: ["Descrição", "Valor", "Status"], rows: despesas.map(e => [e.name, emReais(e.value), e.status]) },
        ])}
      />

      <Aviso texto={visitas.erro || resumo.erro} />

      <Row gap={10}>
        <Stat label="Faturamento do mês" value={emReais(receita)} sub={`${resumo.dados?.atendimentosMes ?? 0} atendimentos`} color={N.secondary} />
        <Stat label="Gastos do mês" value={emReais(totalDespesas)} sub="em memória" color={B.red} />
        <Stat label="Resultado estimado" value={emReais(receita - totalDespesas)} color={receita - totalDespesas >= 0 ? N.color : B.amber} />
      </Row>

      {mostrarAdd && (
        <Card title="Adicionar Despesa">
          <Row gap={10}>
            <Field label="DESCRIÇÃO DO GASTO" placeholder="Ex: Conta de Luz" value={nomeGasto} onChange={setNomeGasto} />
            <Field label="VALOR" placeholder="0,00" value={valorGasto} onChange={setValorGasto} />
          </Row>
          <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <Btn onClick={() => setMostrarAdd(false)}>Cancelar</Btn>
            <Btn color={N.color} onClick={addGasto}>Adicionar</Btn>
          </div>
        </Card>
      )}

      <Row gap={10} style={{ alignItems: "flex-start" }}>
        <Card title="Faturamento — últimos 6 meses" style={{ flex: 2 }}>
          {resumo.carregando && !resumo.dados ? <Carregando /> : (
            <>
              <ChartLine h={130} color={N.color} valores={meses.map(m => m.total)} />
              <Row gap={4} style={{ marginTop: 8, flexWrap: "wrap" }}>
                {meses.map((m, i) => (
                  <Badge key={m.mes} text={`${rotuloMes(m.mes)} ${emReaisCurto(m.total)}`} color={i === meses.length - 1 ? N.secondary : B.muted} />
                ))}
              </Row>
            </>
          )}
        </Card>
        <Card title="Por serviço (mês)" style={{ flex: 1 }}>
          {(resumo.dados?.porServico || []).length === 0 ? <ImgBox h={130} label="[ sem dados no mês ]" /> : (
            <Col gap={7}>
              {resumo.dados.porServico.map((s, i) => {
                const pct = receita ? Math.round((s.total / receita) * 100) : 0;
                return (
                  <Col key={s.servico} gap={4}>
                    <Row style={{ justifyContent: "space-between" }}>
                      <Row gap={6}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: [N.color, N.secondary, B.amber, B.teal, B.muted][i % 5] }} />
                        <span style={{ fontSize: 11, color: B.muted }}>{s.servico}</span>
                      </Row>
                      <span style={{ fontSize: 11, color: B.text, fontWeight: 600 }}>{pct}%</span>
                    </Row>
                    <div style={{ height: 4, background: B.border2, borderRadius: 2 }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: [N.color, N.secondary, B.amber, B.teal, B.muted][i % 5], borderRadius: 2 }} />
                    </div>
                  </Col>
                );
              })}
            </Col>
          )}
        </Card>
      </Row>

      <Row gap={10} style={{ alignItems: "flex-start" }}>
        <Card title="Atendimentos recentes" style={{ flex: 2 }}>
          {visitas.carregando && !visitas.dados && <Carregando />}
          {visitas.dados && pagamentos.length === 0 && <Vazio texto="Nenhum atendimento registrado. Dê baixa em um agendamento ou atenda alguém na fila." />}
          {pagamentos.length > 0 && (
            <Table
              cols={["DATA", "CLIENTE", "SERVIÇO", "BARBEIRO", "ORIGEM", "VALOR"]}
              rows={pagamentos.map(p => [
                dataCurta(p.data), p.cliente_nome, p.servico, p.profissional || "—",
                <Badge text={p.origem} color={p.origem === "agenda" ? B.teal : p.origem === "fila" ? B.amber : B.muted} />,
                emReais(p.valor),
              ])}
            />
          )}
        </Card>
        <Card title="Gastos do mês" style={{ flex: 1 }}>
          {despesas.map((e, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `0.5px solid ${B.border}`, padding: "8px 0", fontSize: 11 }}>
              <span style={{ color: B.text }}>{e.name}</span>
              <Row gap={8}>
                <span style={{ color: B.text, fontWeight: 600 }}>{emReais(e.value)}</span>
                <Badge text={e.status} color={e.status === "Pendente" ? B.amber : B.teal} />
                <span onClick={() => setDespesas(prev => prev.filter((_, idx) => idx !== i))} style={{ cursor: "pointer", color: B.red, fontWeight: 700, userSelect: "none" }}><X size={14} strokeWidth={2.2} /></span>
              </Row>
            </div>
          ))}
        </Card>
      </Row>
    </Col>
  );
};

// ── Serviços (catálogo em memória) ────────────────────────────────────────────
const Servicos = () => {
  const [services, setServices] = useState(() => [...N.services]);
  const [nome, setNome] = useState("");
  const [duracao, setDuracao] = useState("");
  const [preco, setPreco] = useState("");
  const [comissao, setComissao] = useState("40");

  const handleSave = () => {
    if (!nome.trim() || !duracao.trim() || !preco.trim()) return;
    setServices(prev => [...prev, [
      nome.trim(), `${duracao.trim()} min`,
      preco.startsWith("R$") ? preco : `R$ ${preco}`,
      comissao.includes("%") ? comissao : `${comissao || 0}%`,
    ]]);
    setNome(""); setDuracao(""); setPreco(""); setComissao("40");
  };

  return (
    <Col gap={14}>
      <PH title="Serviços" sub="Catálogo de cortes, barba e tratamentos"
        onExport={() => makePDF(N.name, [{ title: "Serviços", columns: ["Nome", "Duração", "Preço", "Comissão"], rows: services.map(s => [s[0], s[1], s[2], s[3]]) }])} />
      <Row gap={10}>
        <Stat label="Serviços ativos" value={services.length + ""} />
        <Stat label="Mais caro" value={services.reduce((a, s) => paraNumero(s[2]) > paraNumero(a[2]) ? s : a, services[0])?.[0] || "—"} color={N.color} />
        <Stat label="Preço médio" value={emReais(services.reduce((s, x) => s + paraNumero(x[2]), 0) / (services.length || 1))} color={N.secondary} />
      </Row>
      <Card title="Serviços Cadastrados">
        <Table cols={["NOME", "DURAÇÃO", "PREÇO", "COMISSÃO", "REMOVER"]} rows={services.map((s, i) => [
          s[0], s[1], s[2], s[3],
          <span onClick={() => setServices(prev => prev.filter((_, idx) => idx !== i))} style={{ cursor: "pointer", color: B.red, fontWeight: 700, userSelect: "none" }} title="Remover"><X size={14} strokeWidth={2.2} /></span>
        ])} />
      </Card>
      <Card title="Cadastrar Serviço">
        <Row gap={10}>
          <Field label="NOME" placeholder="Ex: Corte navalhado" value={nome} onChange={setNome} />
          <Field label="DURAÇÃO (MIN)" placeholder="30" value={duracao} onChange={setDuracao} />
          <Field label="PREÇO" placeholder="0,00" value={preco} onChange={setPreco} />
          <Field label="COMISSÃO DO BARBEIRO (%)" placeholder="40" value={comissao} onChange={setComissao} />
        </Row>
        <Row gap={8} style={{ marginTop: 14, justifyContent: "flex-end" }}>
          <Btn onClick={() => { setNome(""); setDuracao(""); setPreco(""); setComissao("40"); }}>Cancelar</Btn>
          <Btn color={N.color} onClick={handleSave}>Salvar Serviço</Btn>
        </Row>
      </Card>
      <span style={{ fontSize: 10, color: B.dim }}>
        O catálogo ainda não é salvo no banco — ao recarregar a página ele volta ao padrão.
      </span>
    </Col>
  );
};

// ── Estoque (em memória) ──────────────────────────────────────────────────────
const Estoque = () => {
  const [products, setProducts] = useState(() => [...N.products]);
  const [nome, setNome] = useState("");
  const [preco, setPreco] = useState("");
  const [minimo, setMinimo] = useState("");
  const [inicial, setInicial] = useState("");
  const [filtro, setFiltro] = useState("");

  const handleSave = () => {
    if (!nome.trim() || !preco.trim() || !inicial.trim() || !minimo.trim()) return;
    setProducts(prev => [...prev, [nome.trim(), preco.startsWith("R$") ? preco : `R$ ${preco}`, inicial.trim(), minimo.trim()]]);
    setNome(""); setPreco(""); setMinimo(""); setInicial("");
  };

  const visiveis = products.filter(p => p[0].toLowerCase().includes(filtro.toLowerCase()));
  const valorTotal = products.reduce((acc, p) => acc + paraNumero(p[1]) * parseInt(p[2] || 0), 0);
  const alertas = products.filter(p => parseInt(p[2] || 0) < parseInt(p[3] || 0)).length;

  return (
    <Col gap={14}>
      <PH title="Estoque de Produtos" sub="Controle dos produtos usados e revendidos na barbearia"
        onExport={() => makePDF(N.name, [{ title: "Estoque de Produtos", columns: ["Produto", "Preço unit.", "Qtd. atual", "Mínimo", "Status"], rows: products.map(p => [p[0], p[1], p[2], p[3], parseInt(p[2]) < parseInt(p[3]) ? "Baixo" : "OK"]) }])} />
      <Row gap={10}>
        <Stat label="Total de produtos" value={products.length + " itens"} />
        <Stat label="Valor em estoque" value={emReais(valorTotal)} color={N.secondary} />
        <Stat label="Alertas de reposição" value={alertas + ""} sub="abaixo do mínimo" color={alertas > 0 ? B.amber : B.teal} />
      </Row>
      <Card title="Lista de Produtos" accentColor={N.color}>
        <Row gap={8} style={{ marginBottom: 12 }}>
          <input placeholder="Buscar produto..." value={filtro} onChange={e => setFiltro(e.target.value)}
            style={{ flex: 1, height: 32, background: B.bg2, border: `0.5px solid ${B.border2}`, borderRadius: 7, padding: "0 10px", fontSize: 11, color: B.text, outline: "none" }} />
        </Row>
        <Table
          cols={["PRODUTO", "PREÇO UNIT.", "QTD. ATUAL", "MÍNIMO", "STATUS", "REMOVER"]}
          rows={visiveis.map(p => {
            const idx = products.indexOf(p);
            return [
              p[0], p[1], p[2] + " un", p[3] + " un",
              <Badge text={parseInt(p[2]) < parseInt(p[3]) ? "Baixo" : "OK"} color={parseInt(p[2]) < parseInt(p[3]) ? B.amber : B.teal} />,
              <span onClick={() => setProducts(prev => prev.filter((_, i) => i !== idx))} style={{ cursor: "pointer", color: B.red, fontWeight: 700, userSelect: "none" }} title="Remover"><X size={14} strokeWidth={2.2} /></span>
            ];
          })}
        />
      </Card>
      <Row gap={10}>
        <Card title="Consumo de produtos" style={{ flex: 2 }}>
          <ChartBar h={100} color={N.color} valores={[40, 65, 30, 80, 55, 70]} rotulos={["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"]} />
          <div style={{ fontSize: 10, color: B.dim, marginTop: 8 }}>Valores ilustrativos — o estoque ainda não é salvo no banco.</div>
        </Card>
        <Card title="Cadastrar Produto" style={{ flex: 1 }}>
          <Field label="NOME" placeholder="Ex: Pomada modeladora" value={nome} onChange={setNome} />
          <Field label="PREÇO UNITÁRIO" placeholder="0,00" value={preco} onChange={setPreco} />
          <Row gap={8}>
            <Field label="EST. MÍNIMO" placeholder="0" value={minimo} onChange={setMinimo} />
            <Field label="EST. INICIAL" placeholder="0" value={inicial} onChange={setInicial} />
          </Row>
          <div style={{ marginTop: 10 }}><Btn color={N.color} onClick={handleSave}>Salvar</Btn></div>
        </Card>
      </Row>
    </Col>
  );
};

// ── Assinaturas (planos em memória, assinantes vindos das fichas) ─────────────
const Assinaturas = () => {
  const clientes = useRecurso(() => api.clientes.listar());
  const PLAN_COLORS = [B.teal, N.color, B.amber];

  const [planos, setPlanos] = useState([
    { id: 1, name: "Plano Básico", price: 99, svcs: ["Corte masculino ilimitado"], membros: [] },
    { id: 2, name: "Plano Premium", price: 149, svcs: ["Corte masculino ilimitado", "Barba completa 2× mês"], membros: [] },
    { id: 3, name: "Plano VIP", price: 199, svcs: ["Corte ilimitado", "Barba ilimitada", "1 tratamento capilar/mês"], membros: [] },
  ]);
  const [abertoId, setAbertoId] = useState(null);
  const [mostrarNovo, setMostrarNovo] = useState(false);
  const [nNome, setNNome] = useState("");
  const [nPreco, setNPreco] = useState("");
  const [nSvcs, setNSvcs] = useState("");
  const [novoMembro, setNovoMembro] = useState("");
  const [novoSvc, setNovoSvc] = useState("");

  const assinantes = (clientes.dados || []).filter(c => c.tipo === "assinante");
  const totalMembros = planos.reduce((s, p) => s + p.membros.length, 0);
  const mrr = planos.reduce((s, p) => s + p.price * p.membros.length, 0);
  const aberto = planos.find(p => p.id === abertoId);

  const criarPlano = () => {
    if (!nNome.trim()) return;
    setPlanos(prev => [...prev, {
      id: Date.now(), name: nNome.trim(), price: paraNumero(nPreco),
      svcs: nSvcs.split("\n").map(s => s.trim()).filter(Boolean), membros: [],
    }]);
    setNNome(""); setNPreco(""); setNSvcs(""); setMostrarNovo(false);
  };

  if (aberto) {
    const cor = PLAN_COLORS[planos.indexOf(aberto) % PLAN_COLORS.length];
    const disponiveis = assinantes.filter(c => !aberto.membros.includes(c.nome));
    return (
      <Col gap={14}>
        <Row style={{ justifyContent: "space-between" }}>
          <Row gap={10}>
            <button onClick={() => setAbertoId(null)} style={{ background: "transparent", border: `0.5px solid ${B.border}`, color: B.muted, cursor: "pointer", fontSize: 12, padding: "6px 12px", borderRadius: 7, fontFamily: "inherit" }}>← Voltar</button>
            <Col gap={1}>
              <span style={{ fontSize: 17, fontWeight: 700, color: B.text }}>{aberto.name}</span>
              <span style={{ fontSize: 11, color: cor }}>{emReais(aberto.price)}/mês</span>
            </Col>
          </Row>
          <Btn danger onClick={() => { setPlanos(prev => prev.filter(p => p.id !== abertoId)); setAbertoId(null); }}>
            <Trash2 size={12} strokeWidth={1.8} /> Remover Plano
          </Btn>
        </Row>
        <Row gap={10}>
          <Stat label="Membros" value={aberto.membros.length + ""} color={cor} />
          <Stat label="Receita" value={`${emReais(aberto.price * aberto.membros.length)}/mês`} color={B.teal} />
        </Row>
        <Row gap={10} style={{ alignItems: "flex-start" }}>
          <Card title="Serviços incluídos" style={{ flex: 1 }}>
            {aberto.svcs.length === 0 && <Vazio texto="Nenhum serviço incluído." />}
            {aberto.svcs.map((s, i) => (
              <Row key={i} style={{ justifyContent: "space-between", padding: "6px 0", borderBottom: `0.5px solid ${B.border}` }}>
                <span style={{ fontSize: 12, color: B.text }}><Check size={11} strokeWidth={2} /> {s}</span>
                <span onClick={() => setPlanos(prev => prev.map(p => p.id === abertoId ? { ...p, svcs: p.svcs.filter((_, idx) => idx !== i) } : p))} style={{ cursor: "pointer", color: B.red, fontWeight: 700 }}><X size={14} strokeWidth={2.2} /></span>
              </Row>
            ))}
            <Row gap={8} style={{ marginTop: 10, alignItems: "flex-end" }}>
              <Field placeholder="Novo serviço incluído" value={novoSvc} onChange={setNovoSvc} />
              <Btn sm color={cor} onClick={() => {
                if (!novoSvc.trim()) return;
                setPlanos(prev => prev.map(p => p.id === abertoId ? { ...p, svcs: [...p.svcs, novoSvc.trim()] } : p));
                setNovoSvc("");
              }}>+ Adicionar</Btn>
            </Row>
          </Card>
          <Card title="Membros do plano" style={{ flex: 1 }}>
            {aberto.membros.length === 0 && <Vazio texto="Nenhum membro neste plano." />}
            {aberto.membros.map(nome => (
              <Row key={nome} style={{ justifyContent: "space-between", padding: "8px 0", borderBottom: `0.5px solid ${B.border}` }}>
                <Row gap={8}><Avatar name={nome} color={cor} size={28} /><span style={{ fontSize: 11, color: B.text }}>{nome}</span></Row>
                <span onClick={() => setPlanos(prev => prev.map(p => p.id === abertoId ? { ...p, membros: p.membros.filter(m => m !== nome) } : p))} style={{ cursor: "pointer", color: B.red, fontWeight: 700 }}><X size={14} strokeWidth={2.2} /></span>
              </Row>
            ))}
            {disponiveis.length === 0 ? (
              <div style={{ fontSize: 10, color: B.dim, marginTop: 10, lineHeight: 1.6 }}>
                Só clientes marcados como <strong>Assinante</strong> na ficha aparecem aqui.
              </div>
            ) : (
              <Row gap={8} style={{ marginTop: 10, alignItems: "flex-end" }}>
                <Field label="ADICIONAR CLIENTE" type="select" value={novoMembro} onChange={setNovoMembro}
                  placeholder="Selecione..." options={disponiveis.map(c => c.nome)} />
                <Btn sm color={cor} onClick={() => {
                  if (!novoMembro) return;
                  setPlanos(prev => prev.map(p => p.id === abertoId ? { ...p, membros: [...p.membros, novoMembro] } : p));
                  setNovoMembro("");
                }}>+</Btn>
              </Row>
            )}
          </Card>
        </Row>
      </Col>
    );
  }

  return (
    <Col gap={14}>
      <PH title="Assinaturas Mensais" sub="Clube do cliente — planos e receita recorrente"
        action={mostrarNovo ? "Fechar" : "+ Novo Plano"} onAction={() => setMostrarNovo(v => !v)}
        onExport={() => makePDF(N.name, [{ title: "Planos de Assinatura", columns: ["Plano", "Preço", "Membros", "Serviços incluídos"], rows: planos.map(p => [p.name, `${emReais(p.price)}/mês`, p.membros.length + "", p.svcs.join(", ")]) }])} />
      <Aviso texto={clientes.erro} />
      <Row gap={10}>
        <Stat label="Clientes assinantes" value={assinantes.length + ""} sub="marcados na ficha" color={B.teal} />
        <Stat label="Alocados em planos" value={totalMembros + ""} color={N.color} />
        <Stat label="Receita recorrente" value={`${emReais(mrr)}/mês`} sub="MRR" color={N.secondary} />
      </Row>
      {mostrarNovo && (
        <Card title="Criar Novo Plano">
          <Row gap={10}>
            <Field label="NOME DO PLANO" placeholder="Ex: Plano Plus" value={nNome} onChange={setNNome} />
            <Field label="PREÇO MENSAL" placeholder="0,00" value={nPreco} onChange={setNPreco} />
          </Row>
          <Field label="SERVIÇOS INCLUÍDOS (um por linha)" type="textarea" placeholder={"Corte ilimitado\nBarba 2× por mês"} value={nSvcs} onChange={setNSvcs} />
          <Row gap={8} style={{ marginTop: 12, justifyContent: "flex-end" }}>
            <Btn onClick={() => setMostrarNovo(false)}>Cancelar</Btn>
            <Btn color={N.color} onClick={criarPlano}>Criar Plano</Btn>
          </Row>
        </Card>
      )}
      <Card title="Planos disponíveis">
        {planos.length === 0 && <Vazio texto="Nenhum plano cadastrado." />}
        {planos.map((p, i) => {
          const cor = PLAN_COLORS[i % PLAN_COLORS.length];
          return (
            <div key={p.id} style={{ borderBottom: `0.5px solid ${B.border}`, padding: "14px 0" }}>
              <Row style={{ justifyContent: "space-between", marginBottom: 8 }}>
                <Row gap={8}><div style={{ width: 8, height: 8, borderRadius: "50%", background: cor }} /><span style={{ fontSize: 13, fontWeight: 600, color: B.text }}>{p.name}</span></Row>
                <Row gap={8}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: cor }}>{emReais(p.price)}/mês</span>
                  <span onClick={() => setPlanos(prev => prev.filter(x => x.id !== p.id))} style={{ cursor: "pointer", color: B.red, fontWeight: 700 }}><X size={14} strokeWidth={2.2} /></span>
                </Row>
              </Row>
              {p.svcs.map((s, j) => <div key={j} style={{ fontSize: 11, color: B.muted, marginBottom: 3 }}><Check size={11} strokeWidth={2} /> {s}</div>)}
              <Row style={{ justifyContent: "space-between", marginTop: 8 }}>
                <span style={{ fontSize: 11, color: B.muted }}>{p.membros.length} membros</span>
                <Btn sm color={cor} onClick={() => setAbertoId(p.id)}>Ver membros →</Btn>
              </Row>
            </div>
          );
        })}
      </Card>
      <span style={{ fontSize: 10, color: B.dim }}>
        Os planos ainda vivem em memória; só a marcação Assinante/Avulso do cliente é salva no banco.
      </span>
    </Col>
  );
};

// ── Equipe ────────────────────────────────────────────────────────────────────
const Equipe = () => {
  const visitas = useRecurso(() => api.visitas.listar(200));
  const [pros, setPros] = useState(() => [...N.pros]);
  const [nomePro, setNomePro] = useState("");
  const [mostrarAdd, setMostrarAdd] = useState(false);

  const lista = visitas.dados || [];

  // Comissão real: soma o que cada barbeiro atendeu e aplica o % do serviço.
  const desempenho = pros.map(p => {
    const primeiro = p.split(" ")[0].toLowerCase();
    const suas = lista.filter(v => (v.profissional || "").toLowerCase().includes(primeiro));
    const faturado = suas.reduce((s, v) => s + v.valor, 0);
    const comissao = suas.reduce((s, v) => {
      const pct = paraNumero((N.services.find(x => x[0] === v.servico)?.[3] || "40%").replace("%", ""));
      return s + v.valor * (pct / 100);
    }, 0);
    return { nome: p, atendimentos: suas.length, faturado, comissao };
  });

  return (
    <Col gap={14}>
      <PH title="Equipe de Barbeiros" sub="Comissão calculada sobre os atendimentos registrados"
        action={mostrarAdd ? "Fechar" : "+ Adicionar Barbeiro"} onAction={() => setMostrarAdd(v => !v)}
        onExport={() => makePDF(N.name, [{ title: "Equipe de Barbeiros", columns: ["Barbeiro", "Atendimentos", "Faturado", "Comissão"], rows: desempenho.map(d => [d.nome, d.atendimentos + "", emReais(d.faturado), emReais(d.comissao)]) }])} />
      <Aviso texto={visitas.erro} />
      <Row gap={10}>
        <Stat label="Barbeiros ativos" value={pros.length + ""} />
        <Stat label="Atendimentos registrados" value={lista.length + ""} color={N.secondary} />
        <Stat label="Comissões a pagar" value={emReais(desempenho.reduce((s, d) => s + d.comissao, 0))} color={N.color} />
      </Row>

      {mostrarAdd && (
        <Card title="Cadastrar Barbeiro">
          <Row gap={10}><Field label="NOME DO BARBEIRO" placeholder="Ex: Lucas Silva" value={nomePro} onChange={setNomePro} /></Row>
          <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <Btn onClick={() => setMostrarAdd(false)}>Cancelar</Btn>
            <Btn color={N.color} onClick={() => { if (nomePro.trim()) { setPros(prev => [...prev, nomePro.trim()]); setNomePro(""); setMostrarAdd(false); } }}>Salvar</Btn>
          </div>
        </Card>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
        {desempenho.map((d, i) => (
          <Card key={d.nome}>
            <Row style={{ justifyContent: "space-between", marginBottom: 10 }}>
              <Row gap={10}>
                <Avatar name={d.nome} color={N.color} size={36} />
                <Col gap={2}><span style={{ fontSize: 13, fontWeight: 600, color: B.text }}>{d.nome}</span><span style={{ fontSize: 11, color: B.muted }}>Barbeiro</span></Col>
              </Row>
              <Row gap={6}>
                <Badge text="Ativo" color={B.teal} />
                <span onClick={() => setPros(prev => prev.filter((_, idx) => idx !== i))} style={{ cursor: "pointer", color: B.red, fontWeight: 700, padding: "0 4px" }}><X size={14} strokeWidth={2.2} /></span>
              </Row>
            </Row>
            <Divider />
            <Row style={{ justifyContent: "space-between", marginBottom: 6 }}><span style={{ fontSize: 11, color: B.muted }}>Atendimentos</span><span style={{ fontSize: 11, color: B.text, fontWeight: 600 }}>{d.atendimentos}</span></Row>
            <Row style={{ justifyContent: "space-between", marginBottom: 6 }}><span style={{ fontSize: 11, color: B.muted }}>Faturado</span><span style={{ fontSize: 11, color: B.text, fontWeight: 600 }}>{emReais(d.faturado)}</span></Row>
            <Row style={{ justifyContent: "space-between" }}><span style={{ fontSize: 11, color: B.muted }}>Comissão</span><span style={{ fontSize: 12, color: N.color, fontWeight: 700 }}>{emReais(d.comissao)}</span></Row>
          </Card>
        ))}
      </div>
    </Col>
  );
};

// ── Lembretes ─────────────────────────────────────────────────────────────────
const Lembretes = () => {
  const clientes = useRecurso(() => api.clientes.listar());
  const [lembretes, setLembretes] = useState([]);
  const [cliente, setCliente] = useState("");
  const [servico, setServico] = useState(N.services[0][0]);
  const [data, setData] = useState("");
  const [mensagem, setMensagem] = useState("");

  const lista = clientes.dados || [];
  // Data-corte calculada uma vez na montagem, não a cada render. Comparar
  // strings YYYY-MM-DD funciona: a ordem lexicográfica é a ordem cronológica.
  const [limiteInatividade] = useState(() => somarDias(hojeISO(), -30));
  const inativos = lista.filter(c => !c.ultima_visita || c.ultima_visita < limiteInatividade);

  const criar = () => {
    if (!cliente || !data) return;
    setLembretes(prev => [...prev, { cliente, servico, data, tipo: "Manual" }]);
    setData(""); setMensagem("");
  };

  return (
    <Col gap={14}>
      <PH title="Lembretes & Remarketing" sub="Quem sumiu, quem precisa voltar" />
      <Aviso texto={clientes.erro} />
      <Row gap={10}>
        <Stat label="Lembretes criados" value={lembretes.length + ""} color={N.color} />
        <Stat label="Clientes inativos" value={inativos.length + ""} sub="+30 dias sem visita" color={inativos.length ? B.red : B.teal} />
        <Stat label="Total de clientes" value={lista.length + ""} color={N.secondary} />
      </Row>
      <Row gap={10} style={{ alignItems: "flex-start" }}>
        <Col gap={10} style={{ flex: 2 }}>
          <Card title="Clientes sem visita há mais de 30 dias">
            {clientes.carregando && !clientes.dados && <Carregando />}
            {clientes.dados && inativos.length === 0 && <Vazio texto="Nenhum cliente inativo. Bom sinal." />}
            {inativos.map(c => (
              <div key={c.id} style={{ borderBottom: `0.5px solid ${B.border}`, padding: "11px 0", display: "flex", alignItems: "center", gap: 12 }}>
                <Avatar name={c.nome} color={B.amber} size={32} />
                <Col gap={2} style={{ flex: 1 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: B.text }}>{c.nome}</span>
                  <span style={{ fontSize: 11, color: B.muted }}>
                    {c.ultima_visita ? `Última visita em ${dataCurta(c.ultima_visita)}` : "Nunca veio"} · {c.telefone || "sem telefone"}
                  </span>
                </Col>
                <Btn sm color={N.color} onClick={() => { setCliente(c.nome); setMensagem(`Olá ${c.nome.split(" ")[0]}, faz um tempo que você não aparece! Bora marcar um horário?`); }}>
                  <MessageSquare size={12} strokeWidth={1.8} /> Preparar
                </Btn>
              </div>
            ))}
          </Card>
          <Card title="Lembretes Criados">
            {lembretes.length === 0 && <Vazio texto="Nenhum lembrete criado nesta sessão." />}
            {lembretes.map((r, i) => (
              <Row key={i} style={{ justifyContent: "space-between", padding: "10px 0", borderBottom: `0.5px solid ${B.border}` }}>
                <Col gap={2}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: B.text }}>{r.cliente}</span>
                  <span style={{ fontSize: 11, color: B.muted }}>{r.servico} · {r.data}</span>
                </Col>
                <span onClick={() => setLembretes(prev => prev.filter((_, idx) => idx !== i))} style={{ cursor: "pointer", color: B.red, fontWeight: 700 }}><X size={14} strokeWidth={2.2} /></span>
              </Row>
            ))}
          </Card>
        </Col>
        <Col gap={10} style={{ flex: 1 }}>
          <Card title="Criar Lembrete">
            <Field label="CLIENTE" type="select" value={cliente} onChange={setCliente} placeholder="Selecione..." options={lista.map(c => c.nome)} />
            <Field label="SERVIÇO" type="select" value={servico} onChange={setServico} options={N.services.map(s => s[0])} />
            <Field label="DATA" placeholder="Ex: 20/06" value={data} onChange={setData} />
            <Field label="MENSAGEM" type="textarea" value={mensagem} onChange={setMensagem} placeholder="Olá {nome}, bora marcar?" />
            <div style={{ marginTop: 10 }}><Btn color={N.color} onClick={criar}>Criar Lembrete</Btn></div>
          </Card>
          <Card title="Remarketing Automático">
            <Col gap={12}>
              {[["Clientes inativos (+30 dias)", true], ["Lembrete de retorno", true], ["Aniversariantes", false], ["Assinatura vencendo", false]].map(([label, on], i) => (
                <Row key={i} style={{ justifyContent: "space-between" }}>
                  <span style={{ fontSize: 12, color: B.text }}>{label}</span>
                  <Field type={on ? "toggle" : "toggle-off"} placeholder="" />
                </Row>
              ))}
            </Col>
            <div style={{ fontSize: 10, color: B.dim, marginTop: 12, lineHeight: 1.6 }}>
              Os disparos automáticos ainda não estão implementados — a lista acima é a configuração pretendida.
            </div>
          </Card>
        </Col>
      </Row>
    </Col>
  );
};

// ── Integrações ───────────────────────────────────────────────────────────────
const WhatsAppEmail = ({ user }) => (
  <Col gap={14}>
    <PH title="Integrações" sub="WhatsApp, e-mail e notificações automáticas" />
    <Row gap={10} style={{ alignItems: "flex-start" }}>
      <Card title="WhatsApp" style={{ flex: 1 }}>
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <div style={{ width: 70, height: 70, background: B.muted + "20", border: `2px solid ${B.muted}`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}><MessageSquare size={28} color={B.muted} strokeWidth={2} /></div>
          <div style={{ fontSize: 14, fontWeight: 700, color: B.muted }}>Não conectado</div>
          <div style={{ fontSize: 11, color: B.dim, marginTop: 4 }}>{user.whatsapp}</div>
          <Row gap={8} style={{ justifyContent: "center", marginTop: 12 }}><Btn color={N.color}>Conectar WhatsApp</Btn></Row>
        </div>
        <Divider />
        <Col gap={10}>
          {["Confirmação de agendamento", "Lembrete 24h antes", "Aviso de vez na fila", "Remarketing automático"].map((m, i) => (
            <Row key={i} style={{ justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, color: B.text }}>{m}</span>
              <Field type={i < 3 ? "toggle" : "toggle-off"} placeholder="" />
            </Row>
          ))}
        </Col>
      </Card>
      <Card title="E-mail" style={{ flex: 1 }}>
        <Field label="E-MAIL DA CONTA" value={user.email} />
        <Field label="NOME DO REMETENTE" value={user.barbearia} />
        <Divider />
        <Col gap={10}>
          {["Confirmação de agendamento", "Resumo diário", "Alerta de estoque baixo", "Relatório semanal"].map((m, i) => (
            <Row key={i} style={{ justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, color: B.text }}>{m}</span>
              <Field type={i < 3 ? "toggle" : "toggle-off"} placeholder="" />
            </Row>
          ))}
        </Col>
      </Card>
      <Card title="Preview do e-mail" style={{ flex: 1 }}>
        <div style={{ border: `0.5px solid ${B.border}`, borderRadius: 8, overflow: "hidden" }}>
          <div style={{ padding: "10px 14px", background: N.color, color: "#fff", fontSize: 12, fontWeight: 600 }}>{user.barbearia}</div>
          <div style={{ padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: B.text, marginBottom: 8 }}>Seu horário está confirmado!</div>
            <div style={{ fontSize: 11, color: B.muted, lineHeight: 1.8 }}>
              Olá <strong>João</strong>,<br />
              {N.services[0][0]} com {N.pros[0]} confirmado para:<br />
              <Calendar size={12} strokeWidth={1.8} style={{ verticalAlign: "middle", marginRight: 4 }} /> Terça-feira às 09:00
            </div>
            <div style={{ marginTop: 12, padding: 10, background: N.color + "20", borderRadius: 6, border: `0.5px solid ${N.color}`, textAlign: "center" }}>
              <div style={{ fontSize: 12, color: N.color, fontWeight: 600 }}>Confirmar presença</div>
            </div>
          </div>
        </div>
        <div style={{ fontSize: 10, color: B.dim, marginTop: 10, lineHeight: 1.6 }}>
          Nenhuma integração está ativa: esta tela mostra como as mensagens ficariam.
        </div>
      </Card>
    </Row>
  </Col>
);

// ── Taxas & Configurações ─────────────────────────────────────────────────────
const Taxas = ({ user }) => (
  <Col gap={14}>
    <PH title="Taxas & Configurações" sub="Dados da conta, taxas de pagamento e módulos" />
    <Row gap={10} style={{ alignItems: "flex-start" }}>
      <Card title="Dados da conta" style={{ flex: 1 }}>
        {[["Responsável", user.nome], ["Barbearia", user.barbearia], ["E-mail", user.email], ["WhatsApp", user.whatsapp]].map(([k, v]) => (
          <Row key={k} style={{ justifyContent: "space-between", borderBottom: `0.5px solid ${B.border}`, padding: "9px 0" }}>
            <span style={{ fontSize: 12, color: B.muted }}>{k}</span>
            <span style={{ fontSize: 12, color: B.text, fontWeight: 500 }}>{v}</span>
          </Row>
        ))}
        <div style={{ fontSize: 10, color: B.dim, marginTop: 12, lineHeight: 1.6 }}>
          Estes dados estão salvos no banco, na tabela <strong>barbeiros</strong>. A senha é guardada apenas como hash bcrypt.
        </div>
      </Card>
      <Card title="Taxas de maquininha" style={{ flex: 1 }}>
        {[["Débito", "1,5%"], ["Crédito à vista", "2,5%"], ["Crédito 2×", "3,2%"], ["Crédito 3×–6×", "4,0%"], ["PIX", "0,99%"]].map((t, i) => (
          <Row key={i} style={{ justifyContent: "space-between", borderBottom: `0.5px solid ${B.border}`, padding: "9px 0" }}>
            <span style={{ fontSize: 12, color: B.text }}>{t[0]}</span>
            <div style={{ height: 30, width: 80, background: B.bg2, border: `0.5px solid ${B.border2}`, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: B.text }}>{t[1]}</div>
          </Row>
        ))}
      </Card>
      <Card title="Módulos ativos" style={{ flex: 1 }}>
        <Col gap={14}>
          {[
            { l: "Fila de espera", on: true },
            { l: "Assinaturas mensais", on: true },
            { l: "Notificações WhatsApp", on: false },
            { l: "Notificações por e-mail", on: false },
          ].map((m, i) => (
            <Row key={i} style={{ justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, color: B.text }}>{m.l}</span>
              <Field type={m.on ? "toggle" : "toggle-off"} placeholder="" />
            </Row>
          ))}
        </Col>
      </Card>
    </Row>
  </Col>
);

// ── Exportar dados ────────────────────────────────────────────────────────────
const ExportarDados = ({ user }) => {
  const clientes = useRecurso(() => api.clientes.listar());
  const visitas = useRecurso(() => api.visitas.listar(200));

  const nomeNegocio = `${user.barbearia} — ${user.nome}`;
  const listaClientes = clientes.dados || [];
  const listaVisitas = visitas.dados || [];

  const secoes = {
    clientes: {
      title: "Clientes",
      columns: ["Nome", "Telefone", "Tipo", "Visitas", "Última visita", "Total gasto"],
      rows: listaClientes.map(c => [c.nome, c.telefone || "—", TIPO_CLIENTE[c.tipo].label, c.visitas + "", dataCurta(c.ultima_visita), emReais(c.total_gasto)]),
    },
    atendimentos: {
      title: "Atendimentos",
      columns: ["Data", "Cliente", "Serviço", "Barbeiro", "Valor", "Origem"],
      rows: listaVisitas.map(v => [dataCurta(v.data), v.cliente_nome, v.servico, v.profissional || "—", emReais(v.valor), v.origem]),
    },
    servicos: {
      title: "Serviços",
      columns: ["Nome", "Duração", "Preço", "Comissão"],
      rows: N.services.map(s => [s[0], s[1], s[2], s[3]]),
    },
    estoque: {
      title: "Estoque de Produtos",
      columns: ["Produto", "Preço unit.", "Qtd. atual", "Mínimo"],
      rows: N.products.map(p => [p[0], p[1], p[2], p[3]]),
    },
    equipe: {
      title: "Equipe de Barbeiros",
      columns: ["Barbeiro", "Cargo"],
      rows: N.pros.map(p => [p, "Barbeiro"]),
    },
  };

  const lista = Object.entries(secoes).map(([key, s]) => ({ key, ...s }));
  const icones = { clientes: Users, atendimentos: CheckCircle, servicos: Scissors, estoque: Package, equipe: Users };
  const carregando = clientes.carregando || visitas.carregando;

  return (
    <Col gap={16}>
      <PH title="Exportar Dados" sub="Gere PDFs para migração ou backup" />
      <Aviso texto={clientes.erro || visitas.erro} />

      <Card>
        <Row gap={12}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: N.color + "20", border: `0.5px solid ${N.color}40`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <FileText size={20} color={N.color} strokeWidth={1.8} />
          </div>
          <Col gap={4} style={{ flex: 1 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: B.text }}>Exportação para migração de sistema</span>
            <span style={{ fontSize: 11, color: B.muted, lineHeight: 1.6 }}>
              Clientes e atendimentos vêm do banco. Serviços, estoque e equipe ainda são o catálogo padrão do sistema.
            </span>
          </Col>
        </Row>
      </Card>

      <Card style={{ border: `1px solid ${N.color}40`, background: N.color + "08" }}>
        <Row style={{ justifyContent: "space-between", alignItems: "center" }}>
          <Col gap={4}>
            <span style={{ fontSize: 14, fontWeight: 700, color: B.text }}>Exportação completa</span>
            <span style={{ fontSize: 11, color: B.muted }}>{lista.length} seções em um único PDF</span>
          </Col>
          <button disabled={carregando} onClick={() => makePDF(nomeNegocio, Object.values(secoes))}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 22px", borderRadius: 9, background: N.color, color: "#fff", border: "none", cursor: carregando ? "not-allowed" : "pointer", opacity: carregando ? 0.5 : 1, fontFamily: "inherit", fontSize: 13, fontWeight: 700, boxShadow: `0 4px 18px ${N.color}40` }}>
            {carregando ? <Girando color="#fff" /> : <FileText size={15} strokeWidth={2} />} Exportar tudo em PDF
          </button>
        </Row>
      </Card>

      <div style={{ fontSize: 10, fontWeight: 700, color: N.color, letterSpacing: ".08em" }}>EXPORTAR POR SEÇÃO</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
        {lista.map(s => {
          const Icone = icones[s.key] || FileText;
          return (
            <Card key={s.key} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px" }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: B.bg2, border: `0.5px solid ${B.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icone size={17} color={N.color} strokeWidth={1.8} />
              </div>
              <Col gap={2} style={{ flex: 1 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: B.text }}>{s.title}</span>
                <span style={{ fontSize: 10, color: B.muted }}>{s.rows.length} registros</span>
              </Col>
              <button onClick={() => makePDF(nomeNegocio, [s])}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 13px", borderRadius: 7, background: B.bg2, color: B.muted, border: `0.5px solid ${B.border}`, cursor: "pointer", fontFamily: "inherit", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>
                <FileText size={12} strokeWidth={1.8} /> PDF
              </button>
            </Card>
          );
        })}
      </div>
    </Col>
  );
};

// ── Landing Page ───────────────────────────────────────────────────────────────
const LandingPage = ({ onLogin, onRegister }) => {
  const c = N.color;

  const copy = {
    badge: "GESTÃO MODERNA PARA BARBEARIAS !",
    l1: "Sua barbearia", l2: "no próximo", l3: "nível.",
    sub: "Agenda, fila de espera, ficha do cliente e comissão por barbeiro — tudo em um só app pensado para a barbearia moderna.",
    count: "+2.4k", countLabel: "Barbearias ativas",
    dashLabel: "Painel · Barbearia",
    kpis: [
      { l: "FATURAMENTO", v: "R$ 28.6k", d: "+24% este mês" },
      { l: "ATENDIMENTOS", v: "412", d: "+18% este mês" },
      { l: "TICKET MÉDIO", v: "R$ 69", d: "+8% este mês" },
      { l: "RECORRÊNCIA", v: "82%", d: "+6% este mês" },
    ],
    feat3: [
      { n: "Agenda e fila para qualquer volume de clientes." },
      { n: "Ficha do cliente que não se perde.", d: "Preferência de corte, barbeiro favorito e histórico completo de visitas, salvos com segurança." },
      { n: "Comissão automática por barbeiro." },
    ],
    chartV: "R$ 28.6k", chartD: "+24%", chartLabel: "Faturamento mensal",
    cp: "M0,90 C78,82 138,60 198,50 C260,38 298,68 358,46 C418,24 460,40 518,22 C576,6 632,28 692,18 L360,14 L360,120 L0,120 Z",
    cl: "M0,90 C78,82 138,60 198,50 C260,38 298,68 358,46",
  };

  const avatarColors = ["#D97706", "#059669", "#14B8A6", "#F59E0B", "#22C55E"];
  const avatarIcons = [Scissors, User, Star, Crown, Sparkles];

  return (
    <div style={{ height: "100vh", overflowY: "auto", background: "#070809", color: B.text, fontFamily: '"DM Sans", system-ui, sans-serif', position: "relative" }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: "linear-gradient(rgba(255,255,255,.022) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.022) 1px,transparent 1px)",
        backgroundSize: "52px 52px" }} />
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        background: `radial-gradient(ellipse 65% 75% at 72% 20%, ${c}38 0%, ${c}10 45%, transparent 70%)` }} />

      <div style={{ position: "sticky", top: 0, zIndex: 100, padding: "0 56px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(7,8,9,0.72)", backdropFilter: "blur(30px) saturate(160%)", boxShadow: "0 1px 0 rgba(255,255,255,0.05), 0 8px 32px rgba(0,0,0,0.4)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: c + "25", border: `1px solid ${c}65`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", boxShadow: `0 2px 14px ${c}40, inset 0 1px 0 rgba(255,255,255,0.28)` }}>
            <Scissors size={15} strokeWidth={2} />
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>ControlCRM</span>
        </div>
        <div style={{ display: "flex", gap: 32, fontSize: 13, color: B.muted }}>
          {["Home", "Recursos", "Preços"].map(l => <span key={l} style={{ cursor: "pointer" }}>{l}</span>)}
        </div>
        <button onClick={onRegister} style={{ padding: "9px 22px", borderRadius: 8, background: c, color: "#fff", border: `1px solid ${c}80`, fontSize: 13, cursor: "pointer", fontFamily: "inherit", fontWeight: 700, boxShadow: `0 4px 18px ${c}45, inset 0 1px 0 rgba(255,255,255,0.32)` }}>
          Começar agora
        </button>
      </div>

      <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", padding: "56px 56px 48px", maxWidth: 1280, margin: "0 auto", minHeight: "calc(100vh - 60px)" }}>
        <div style={{ flex: "0 0 520px", paddingRight: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
            <Scissors size={14} color={c} strokeWidth={1.8} />
            <span style={{ fontSize: 9, color: B.muted, letterSpacing: ".16em", textTransform: "uppercase" }}>Gestão completa · Barbearias</span>
          </div>
          <div style={{ fontSize: 10, fontWeight: 800, color: c, letterSpacing: ".14em", marginBottom: 20 }}>{copy.badge}</div>
          <h1 style={{ fontSize: 56, fontWeight: 800, color: "#fff", margin: 0, lineHeight: 1.06, letterSpacing: "-2px" }}>{copy.l1}</h1>
          <h1 style={{ fontSize: 56, fontWeight: 800, color: c, margin: 0, lineHeight: 1.06, letterSpacing: "-2px" }}>{copy.l2}</h1>
          <h1 style={{ fontSize: 56, fontWeight: 800, color: "#3A3F50", margin: "0 0 26px", lineHeight: 1.06, letterSpacing: "-2px" }}>{copy.l3}</h1>
          <p style={{ fontSize: 14, color: B.muted, margin: "0 0 32px", lineHeight: 1.75, maxWidth: 400 }}>{copy.sub}</p>
          <div style={{ display: "flex", gap: 12, marginBottom: 40 }}>
            <button onClick={onRegister} style={{ padding: "11px 24px", borderRadius: 8, background: c, color: "#fff", border: `1px solid ${c}75`, fontSize: 14, cursor: "pointer", fontFamily: "inherit", fontWeight: 700, boxShadow: `0 4px 22px ${c}48, inset 0 1px 0 rgba(255,255,255,0.32)` }}>Criar minha conta →</button>
            <button onClick={onLogin} style={{ padding: "11px 24px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.13)", background: "rgba(255,255,255,0.06)", color: B.text, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>Fazer login</button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ display: "flex" }}>
              {avatarColors.map((col, i) => (
                <div key={i} style={{ width: 32, height: 32, borderRadius: "50%", background: col + "50", border: `2px solid ${col}80`, marginLeft: i > 0 ? -10 : 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {React.createElement(avatarIcons[i], { size: 14, color: col, strokeWidth: 1.8 })}
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", letterSpacing: "-0.5px" }}>{copy.count}</div>
              <div style={{ fontSize: 11, color: B.muted }}>{copy.countLabel}</div>
            </div>
            <div style={{ width: 1, height: 30, background: "#ffffff12" }} />
            <div style={{ fontSize: 11, color: B.muted }}>
              <div style={{ display: "flex", gap: 2, marginBottom: 2 }}>{[1, 2, 3, 4, 5].map(i => <Star key={i} size={13} color={c} fill={c} strokeWidth={0} />)}</div>Avaliação 5 estrelas
            </div>
          </div>
        </div>

        <div style={{ flex: 1, position: "relative", height: 540 }}>
          <div style={{ position: "absolute", left: "50%", top: "50%", width: 460, height: 460, marginLeft: -230, marginTop: -230, borderRadius: "50%", border: `1.5px solid ${c}22`, transform: "rotateX(75deg) rotateZ(-25deg)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", left: "50%", top: "50%", width: 340, height: 340, marginLeft: -170, marginTop: -170, borderRadius: "50%", border: `1px solid ${c}15`, transform: "rotateX(75deg) rotateZ(40deg)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", left: "50%", top: "17%", width: 8, height: 8, marginLeft: 100, borderRadius: "50%", background: c, boxShadow: `0 0 16px ${c}, 0 0 32px ${c}60` }} />

          <div style={{
            position: "absolute", left: "50%", top: "50%",
            transform: "translate(-46%, -50%) perspective(1000px) rotateY(-10deg) rotateX(4deg)",
            width: 310, borderRadius: 16, overflow: "hidden", background: "#0B0E15",
            border: `1px solid ${c}40`, boxShadow: `0 0 100px ${c}28, 0 40px 80px #00000090`,
          }}>
            <div style={{ padding: "10px 14px", borderBottom: "1px solid #ffffff0d", display: "flex", alignItems: "center", gap: 6, background: "#090B10" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#FF5F57" }} />
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#FEBC2E" }} />
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#28C840" }} />
              <div style={{ marginLeft: "auto", fontSize: 9, color: B.muted, display: "flex", alignItems: "center", gap: 4 }}><BarChart2 size={9} strokeWidth={1.8} /> {copy.dashLabel}</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
              {copy.kpis.map((k, i) => (
                <div key={k.l} style={{ padding: "14px 15px", borderRight: i % 2 === 0 ? "1px solid #ffffff0c" : "none", borderBottom: i < 2 ? "1px solid #ffffff0c" : "none" }}>
                  <div style={{ fontSize: 7, fontWeight: 700, color: B.muted, letterSpacing: ".09em", marginBottom: 5 }}>{k.l}</div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: "#fff", marginBottom: 2 }}>{k.v}</div>
                  <div style={{ fontSize: 8, color: c }}>{k.d}</div>
                </div>
              ))}
            </div>
            <div style={{ height: 90, background: "#070A0F", overflow: "hidden" }}>
              <svg viewBox="0 0 310 90" style={{ width: "100%", height: "100%", display: "block" }} preserveAspectRatio="none">
                <defs>
                  <linearGradient id="hgBarb" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={c} stopOpacity="0.5" />
                    <stop offset="100%" stopColor={c} stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0,60 C40,52 65,36 100,28 C135,20 155,46 190,28 C225,10 250,24 310,8 L310,90 L0,90 Z" fill="url(#hgBarb)" />
                <path d="M0,60 C40,52 65,36 100,28 C135,20 155,46 190,28 C225,10 250,24 310,8" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          <div style={{ position: "absolute", top: 48, left: 0, padding: "14px 18px", background: "rgba(8,11,18,0.72)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, backdropFilter: "blur(24px)", boxShadow: `0 8px 32px rgba(0,0,0,0.55)` }}>
            <div style={{ fontSize: 8, color: B.muted, letterSpacing: ".08em", marginBottom: 5 }}>{copy.kpis[0].l}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>{copy.kpis[0].v}</div>
            <div style={{ fontSize: 9, color: c, marginTop: 3 }}>{copy.kpis[0].d}</div>
          </div>
          <div style={{ position: "absolute", bottom: 60, right: 10, padding: "14px 18px", background: "rgba(8,11,18,0.72)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, backdropFilter: "blur(24px)", boxShadow: `0 8px 32px rgba(0,0,0,0.55)` }}>
            <div style={{ fontSize: 8, color: B.muted, letterSpacing: ".08em", marginBottom: 5 }}>{copy.kpis[2].l}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>{copy.kpis[2].v}</div>
            <div style={{ fontSize: 9, color: c, marginTop: 3 }}>{copy.kpis[2].d}</div>
          </div>
        </div>
      </div>

      <div style={{ position: "relative", zIndex: 1, padding: "0 56px 80px", maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.15fr 1fr", borderRadius: 18, overflow: "hidden", border: "1px solid #ffffff0c" }}>
          <div style={{ padding: "48px 40px", background: "rgba(10,12,17,0.9)", borderRight: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#3A3F50", marginBottom: 28 }}>01.</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", lineHeight: 1.25 }}>{copy.feat3[0].n}</div>
          </div>
          <div style={{ padding: "48px 40px", background: c, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -50, right: -50, width: 180, height: 180, borderRadius: "50%", background: "#ffffff14" }} />
            <div style={{ fontSize: 14, fontWeight: 700, color: "#ffffff60", marginBottom: 28, position: "relative" }}>02.</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", lineHeight: 1.25, marginBottom: 16, position: "relative" }}>{copy.feat3[1].n}</div>
            <div style={{ fontSize: 13, color: "#ffffffa0", lineHeight: 1.75, marginBottom: 32, position: "relative" }}>{copy.feat3[1].d}</div>
            <button onClick={onRegister} style={{ padding: "10px 20px", borderRadius: 8, background: "rgba(255,255,255,0.95)", color: c, border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", position: "relative" }}>
              Começar agora →
            </button>
          </div>
          <div style={{ padding: "48px 40px", background: "rgba(10,12,17,0.9)", borderLeft: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#3A3F50", marginBottom: 28 }}>03.</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", lineHeight: 1.25 }}>{copy.feat3[2].n}</div>
          </div>
        </div>
      </div>

      <div style={{ position: "relative", zIndex: 1, padding: "22px 56px", borderTop: "1px solid #ffffff0c", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12, color: B.muted }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 22, height: 22, borderRadius: 6, background: c, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
            <Scissors size={12} strokeWidth={2} />
          </div>
          <span style={{ fontWeight: 700, color: "#fff" }}>ControlCRM</span>
          <span>© 2026 ControlCRM. Todos os direitos reservados.</span>
        </div>
        <div style={{ display: "flex", gap: 28 }}>
          {["Privacidade", "Termos", "Suporte"].map(l => <span key={l} style={{ cursor: "pointer" }}>{l}</span>)}
        </div>
      </div>
    </div>
  );
};

// ── Telas de autenticação ─────────────────────────────────────────────────────
const molduraAuth = {
  minHeight: "100vh", background: "#0A0C10", color: B.text,
  fontFamily: '"DM Sans", system-ui, sans-serif', display: "flex", flexDirection: "column",
  alignItems: "center", justifyContent: "center", padding: "40px 24px",
  position: "relative", overflow: "hidden",
};

const inp = {
  width: "100%", padding: "10px 12px", background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)", borderRadius: 9, color: B.text,
  fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box",
};

const CampoAuth = ({ label, ...props }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ fontSize: 10, fontWeight: 600, color: B.muted, marginBottom: 6, letterSpacing: ".06em" }}>{label}</div>
    <input style={inp} {...props} />
  </div>
);

const LoginPage = ({ onSuccess, onRegister, onBack }) => {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  const entrar = async () => {
    setErro(""); setEnviando(true);
    try {
      onSuccess(await api.auth.entrar({ email, senha }));
    } catch (e) {
      setErro(e.message);
      setEnviando(false);
    }
  };

  return (
    <div style={molduraAuth}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", background: `radial-gradient(ellipse 70% 60% at 50% 30%, ${N.color}25 0%, ${N.color}08 50%, transparent 75%)` }} />
      <div style={{ width: "100%", maxWidth: 400, position: "relative", zIndex: 1 }}>
        <button onClick={onBack} style={{ background: "transparent", border: "none", color: B.muted, cursor: "pointer", fontSize: 13, marginBottom: 28, padding: 0, fontFamily: "inherit" }}>← Voltar</button>
        <div style={{ padding: 32, background: "rgba(22,27,34,0.72)", backdropFilter: "blur(32px)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 20, boxShadow: "0 8px 56px rgba(0,0,0,0.55)" }}>
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Entrar</div>
          <div style={{ fontSize: 13, color: B.muted, marginBottom: 24 }}>Acesse o painel da sua barbearia</div>
          {erro && <div style={{ marginBottom: 16 }}><Aviso texto={erro} /></div>}
          <CampoAuth label="E-MAIL" type="email" value={email} placeholder="seu@email.com"
            onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && entrar()} />
          <CampoAuth label="SENHA" type="password" value={senha} placeholder="••••••••"
            onChange={e => setSenha(e.target.value)} onKeyDown={e => e.key === "Enter" && entrar()} />
          <button onClick={entrar} disabled={enviando}
            style={{ width: "100%", marginTop: 12, padding: 11, borderRadius: 9, background: N.color, color: "#fff", border: `1px solid ${N.color}80`, fontSize: 14, cursor: enviando ? "wait" : "pointer", fontFamily: "inherit", fontWeight: 700, opacity: enviando ? 0.7 : 1 }}>
            {enviando ? "Entrando..." : "Entrar →"}
          </button>
          <div style={{ marginTop: 20, textAlign: "center", fontSize: 12, color: B.muted }}>
            Não tem conta? <span onClick={onRegister} style={{ color: N.color, cursor: "pointer", fontWeight: 600 }}>Cadastrar grátis</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const RegisterPage = ({ onSuccess, onLogin, onBack }) => {
  const [form, setForm] = useState({ nome: "", barbearia: "", whatsapp: "", email: "", senha: "" });
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const cadastrar = async () => {
    setErro(""); setEnviando(true);
    try {
      onSuccess(await api.auth.cadastrar(form));
    } catch (e) {
      setErro(e.message);
      setEnviando(false);
    }
  };

  return (
    <div style={molduraAuth}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", background: `radial-gradient(ellipse 70% 60% at 50% 30%, ${N.color}20 0%, ${N.color}06 50%, transparent 75%)` }} />
      <div style={{ width: "100%", maxWidth: 440, position: "relative", zIndex: 1 }}>
        <button onClick={onBack} style={{ background: "transparent", border: "none", color: B.muted, cursor: "pointer", fontSize: 13, marginBottom: 28, padding: 0, fontFamily: "inherit" }}>← Voltar</button>
        <div style={{ padding: 32, background: "rgba(22,27,34,0.72)", backdropFilter: "blur(32px)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 20, boxShadow: "0 8px 56px rgba(0,0,0,0.55)" }}>
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Criar conta</div>
          <div style={{ fontSize: 13, color: B.muted, marginBottom: 24 }}>Configure uma vez, use para sempre</div>
          {erro && <div style={{ marginBottom: 16 }}><Aviso texto={erro} /></div>}
          {[
            { k: "nome", label: "NOME COMPLETO", type: "text", ph: "João Silva" },
            { k: "barbearia", label: "NOME DA BARBEARIA", type: "text", ph: "Barbearia do João" },
            { k: "whatsapp", label: "WHATSAPP", type: "tel", ph: "(11) 99999-9999" },
            { k: "email", label: "E-MAIL", type: "email", ph: "seu@email.com" },
            { k: "senha", label: "SENHA", type: "password", ph: "mínimo 6 caracteres" },
          ].map(({ k, label, type, ph }) => (
            <CampoAuth key={k} label={label} type={type} placeholder={ph} value={form[k]}
              onChange={set(k)} onKeyDown={e => e.key === "Enter" && cadastrar()} />
          ))}
          <button onClick={cadastrar} disabled={enviando}
            style={{ width: "100%", marginTop: 10, padding: 11, borderRadius: 9, background: N.color, color: "#fff", border: `1px solid ${N.color}80`, fontSize: 14, cursor: enviando ? "wait" : "pointer", fontFamily: "inherit", fontWeight: 700, opacity: enviando ? 0.7 : 1 }}>
            {enviando ? "Criando conta..." : "Criar conta →"}
          </button>
          <div style={{ marginTop: 20, textAlign: "center", fontSize: 12, color: B.muted }}>
            Já tem conta? <span onClick={onLogin} style={{ color: N.color, cursor: "pointer", fontWeight: 600 }}>Entrar</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const TelaInicial = () => (
  <div style={{ ...molduraAuth, gap: 12 }}>
    <Girando size={26} color={N.color} />
    <span style={{ fontSize: 13, color: B.muted }}>Carregando ControlCRM...</span>
  </div>
);

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

// ── App ────────────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("carregando");
  const [user, setUser] = useState(null);
  const [active, setActive] = useState(HOME_ID);

  // A sessão vive num cookie httpOnly: para saber se há login, perguntamos à API.
  useEffect(() => {
    let ativo = true;
    api.auth.eu()
      .then(u => { if (ativo) { setUser(u); setPage("app"); } })
      .catch(() => { if (ativo) setPage("landing"); });
    return () => { ativo = false; };
  }, []);

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
  if (page === "landing") return <><GlobalStyles /><LandingPage onLogin={() => setPage("login")} onRegister={() => setPage("register")} /></>;
  if (page === "login") return <><GlobalStyles /><LoginPage onSuccess={entrar} onRegister={() => setPage("register")} onBack={() => setPage("landing")} /></>;
  if (page === "register") return <><GlobalStyles /><RegisterPage onSuccess={entrar} onLogin={() => setPage("login")} onBack={() => setPage("landing")} /></>;

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
      <div style={{ width: 230, background: "#08090F", borderRight: `1px solid ${B.border}`, display: "flex", flexDirection: "column", overflow: "hidden", flexShrink: 0, boxShadow: `4px 0 28px rgba(0,0,0,0.4)` }}>
        <div style={{ padding: "16px 14px 14px", borderBottom: `1px solid ${B.border}` }}>
          <Row gap={10}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${N.color}30, ${N.color}10)`, border: `1px solid ${N.color}50`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 4px 16px ${N.color}28` }}>
              <N.icon size={17} color={N.color} strokeWidth={1.8} />
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
                    style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 11px", cursor: "pointer", fontSize: 12, fontWeight: isActive ? 600 : 400, borderRadius: 9, marginBottom: 1, transition: "all .14s",
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
            style={{ padding: "9px 12px", borderRadius: 9, border: `1px solid ${B.border}`, background: "transparent", fontSize: 11, fontWeight: 500, color: B.muted, cursor: "pointer", display: "flex", alignItems: "center", gap: 7, transition: "all .14s" }}
            onMouseEnter={e => { e.currentTarget.style.background = B.card; e.currentTarget.style.color = B.text; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = B.muted; }}
          >
            <LogOut size={12} strokeWidth={1.8} /> Sair da conta
          </div>
        </div>
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: "28px 32px", background: B.bg }}>
        {screens[active] || <Vazio texto="Selecione um módulo" />}
      </div>
    </div>
  );
}
