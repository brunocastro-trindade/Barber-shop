import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  LayoutDashboard, Package, ClipboardList, CalendarDays, FileText, User, Stethoscope,
  Wallet, Image, Users, Bell, MessageSquare, Settings, ListOrdered, CreditCard,
  FileCheck, FolderOpen, Wrench, Scissors, Sparkles, Car, Search, TrendingUp,
  X, Check, Trash2, Save, Phone, PenLine, Calendar, Crown, DollarSign,
  CheckCircle, Star, Briefcase, ChevronRight, LogOut, ArrowLeft, AlertTriangle,
  Palette, BarChart2, Nut, FileHeart, Download,
} from "lucide-react";
const Ic = ({ i: Icon, s = 14, c, style }) => <Icon size={s} color={c} strokeWidth={1.8} style={{ display:"inline-block", verticalAlign:"middle", flexShrink:0, ...style }} />;

// ── Base tokens ────────────────────────────────────────────────────────────────
const B = {
  bg: "#080A0F", bg2: "#0C0F17", card: "#101420", card2: "#151A28",
  border: "#1C2234", border2: "#232B40",
  text: "#ECF0FA", muted: "#576080", dim: "#2B3350",
  green: "#22C55E", red: "#EF4444", amber: "#F59E0B", teal: "#14B8A6",
};

// ── Niche configuration ────────────────────────────────────────────────────────
const NICHES = {
  clinica: {
    id: "clinica", name: "Clínica Estética", icon: Sparkles, splash: Sparkles,
    tagline: "Harmonização, procedimentos e estética avançada",
    color: "#7B6CF6", secondary: "#0FB884",
    clientLabel: "Paciente", clientsLabel: "Pacientes",
    serviceLabel: "Procedimento", servicesLabel: "Procedimentos",
    stockLabel: "Produto", stocksLabel: "Produtos",
    proLabel: "Profissional",
    features: [
      "Mapa de toxina facial e corporal",
      "Anamnese com assinatura digital",
      "Portfólio antes e depois",
      "Protocolos / comanda de sessões",
      "Calculadora de precificação",
    ],
    products: [
      ["Botulotoxina 100u", "R$ 3,20", "480", "100"],
      ["Ácido Hialurônico", "R$ 12,00", "48", "10"],
      ["Agulhas 30G", "R$ 0,45", "12", "30"],
      ["Lidocaína 2%", "R$ 8,50", "8", "10"],
      ["Luvas descartáveis", "R$ 0,30", "200", "50"],
    ],
    services: [
      ["Botox Facial", "60 min", "R$ 1.100", "15 dias"],
      ["Preenchimento Labial", "45 min", "R$ 1.800", "30 dias"],
      ["Bioestimulador", "90 min", "R$ 2.200", "—"],
      ["Skinbooster", "30 min", "R$ 950", "21 dias"],
      ["Fio PDO", "60 min", "R$ 3.500", "—"],
    ],
    pros: ["Dra. Ana Paula", "Fernanda Lima", "Juliana Ramos"],
    clients: ["Ana Lima", "Marcia Ferreira", "Carla Mendes", "Paula Ribeiro"],
    kpis: [
      { l: "Receita bruta", v: "R$ 48.200", c: "#0FB884" },
      { l: "Gastos", v: "R$ 12.800", c: "#E84040" },
      { l: "Lucro líquido", v: "R$ 35.400", c: "#7B6CF6" },
      { l: "A receber", v: "R$ 8.600", c: "#EFA420" },
    ],
  },
  barbearia: {
    id: "barbearia", name: "Barbearia", icon: Scissors, splash: Scissors,
    tagline: "Cortes, barbearia e estética masculina",
    color: "#D97706", secondary: "#059669",
    clientLabel: "Cliente", clientsLabel: "Clientes",
    serviceLabel: "Serviço", servicesLabel: "Serviços",
    stockLabel: "Produto", stocksLabel: "Produtos",
    proLabel: "Barbeiro",
    features: [
      "Fila de espera em tempo real",
      "Assinaturas mensais (corte + barba ilimitados)",
      "Ficha do cliente com preferências de corte",
      "Histórico de cortes com fotos",
      "Portfólio de estilos realizados",
      "Ranking de barbeiros por faturamento",
    ],
    products: [
      ["Pomada modeladora", "R$ 8,50", "34", "10"],
      ["Shampoo masculino", "R$ 12,00", "24", "8"],
      ["Óleo de barba", "R$ 15,00", "8", "5"],
      ["Lâminas (cx 100)", "R$ 22,00", "3", "5"],
      ["Gel pós-barba", "R$ 11,00", "18", "5"],
    ],
    services: [
      ["Corte masculino", "30 min", "R$ 45", "—"],
      ["Barba completa", "20 min", "R$ 35", "—"],
      ["Corte + Barba", "45 min", "R$ 75", "—"],
      ["Degradê (fade)", "40 min", "R$ 55", "—"],
      ["Luzes / Mechas", "60 min", "R$ 120", "—"],
    ],
    pros: ["Rafael Silva", "Carlos Lima", "Diego Santos"],
    clients: ["João Mendes", "Bruno Costa", "Pedro Alves", "Ricardo Lima"],
    kpis: [
      { l: "Receita bruta", v: "R$ 18.400", c: "#059669" },
      { l: "Gastos", v: "R$ 5.200", c: "#E84040" },
      { l: "Lucro líquido", v: "R$ 13.200", c: "#D97706" },
      { l: "A receber", v: "R$ 1.800", c: "#EFA420" },
    ],
  },
  mecanica: {
    id: "mecanica", name: "Mecânica", icon: Wrench, splash: Car,
    tagline: "Oficina, serviços e gestão de peças automotivas",
    color: "#2563EB", secondary: "#0EA5E9",
    clientLabel: "Cliente", clientsLabel: "Clientes",
    serviceLabel: "Serviço", servicesLabel: "Serviços",
    stockLabel: "Peça", stocksLabel: "Peças",
    proLabel: "Mecânico",
    features: [
      "Ordem de Serviço (OS) completa",
      "Ficha do veículo com histórico de revisões",
      "Alertas de revisão por KM",
      "Orçamentos com aprovação digital",
      "Controle de peças e mão de obra",
      "Rastreamento de garantia de serviços",
    ],
    products: [
      ["Óleo Motor 5W30 (L)", "R$ 18,00", "48", "20"],
      ["Filtro de óleo", "R$ 24,00", "12", "5"],
      ["Pastilha de freio (jg)", "R$ 85,00", "4", "3"],
      ["Filtro de ar", "R$ 32,00", "2", "3"],
      ["Correia dentada", "R$ 120,00", "1", "2"],
    ],
    services: [
      ["Troca de óleo", "45 min", "R$ 120", "—"],
      ["Alinhamento", "30 min", "R$ 80", "—"],
      ["Balanceamento", "30 min", "R$ 60", "—"],
      ["Revisão completa", "120 min", "R$ 380", "—"],
      ["Troca de pastilhas", "60 min", "R$ 200", "—"],
    ],
    pros: ["José Ferreira", "Paulo Santos", "Marcos Lima"],
    clients: ["Roberto Alves", "Sérgio Costa", "Fernanda Melo", "André Lima"],
    kpis: [
      { l: "Faturamento", v: "R$ 62.800", c: "#0EA5E9" },
      { l: "Peças utilizadas", v: "R$ 18.400", c: "#E84040" },
      { l: "Lucro líquido", v: "R$ 44.400", c: "#2563EB" },
      { l: "OS em aberto", v: "8 OS", c: "#EFA420" },
    ],
  },
};

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
      ::selection{background:#7B6CF645;color:#ECF0FA}
      input,select,textarea{transition:border-color .15s,box-shadow .15s}
      input:focus,select:focus,textarea:focus{border-color:rgba(255,255,255,0.2)!important;box-shadow:0 0 0 3px rgba(255,255,255,0.05)!important;outline:none!important}
      .crm-nav:hover{background:rgba(255,255,255,0.04)!important;color:#8B95B0!important}
      .crm-nav.active:hover{opacity:.9}
    `;
    document.head.appendChild(s);
    return () => { try { document.getElementById("crm-gs")?.remove(); } catch {} };
  }, []);
  return null;
};

// ── Atoms ──────────────────────────────────────────────────────────────────────
const Row = ({ children, style, gap = 10 }) => (
  <div style={{ display: "flex", gap, alignItems: "center", ...style }}>{children}</div>
);
const Col = ({ children, style, gap = 10 }) => (
  <div style={{ display: "flex", flexDirection: "column", gap, ...style }}>{children}</div>
);

const Btn = ({ children, color, sm, danger, outline, onClick }) => {
  const [hov, setHov] = useState(false);
  const isColor = color && !outline;
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "inline-flex", alignItems: "center", gap: 5, cursor: "pointer", whiteSpace: "nowrap", userSelect: "none",
        padding: sm ? "5px 13px" : "8px 18px", borderRadius: 10,
        fontSize: sm ? 11 : 12, fontWeight: 600, letterSpacing: ".01em",
        transition: "all 0.14s ease",
        background: isColor
          ? hov ? color : color + "e8"
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

const Tag = ({ text, color }) => (
  <span style={{ padding: "2px 8px", borderRadius: 5, fontSize: 10, background: B.card2, color: color || B.muted, border: `1px solid ${B.border}` }}>{text}</span>
);

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

const ChartBar = ({ h = 120, data, color }) => {
  const d = data || [40, 65, 30, 80, 55, 70, 45, 90, 60, 75, 50, 85];
  const c = color || B.teal;
  return (
    <div style={{ height: h, background: B.bg2, borderRadius: 10, border: `1px solid ${B.border}`, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, display: "flex", alignItems: "flex-end", gap: 3, padding: "0 10px" }}>
        {d.map((v, i) => <div key={i} style={{ flex: 1, height: `${v}%`, background: i === d.length - 1 ? c : c + "38", borderRadius: "3px 3px 0 0" }} />)}
      </div>
    </div>
  );
};

const ChartLine = ({ h = 110, color }) => {
  const c = color || B.teal;
  return (
    <div style={{ height: h, background: B.bg2, borderRadius: 10, border: `1px solid ${B.border}`, overflow: "hidden" }}>
      <svg width="100%" height="100%" viewBox="0 0 300 80" preserveAspectRatio="none">
        <path d="M0,60 C30,55 60,40 90,35 S150,20 180,25 S240,15 300,10" fill="none" stroke={c} strokeWidth="2" />
        <path d="M0,60 C30,55 60,40 90,35 S150,20 180,25 S240,15 300,10 L300,80 L0,80Z" fill={c + "20"} />
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
  const [localVal, setLocalVal] = useState(value ?? "");

  useEffect(() => {
    if (value !== undefined) setLocalVal(value);
  }, [value]);

  const handleChange = (eVal) => {
    setLocalVal(eVal);
    if (onChange) onChange(eVal);
  };

  return (
    <Col gap={5} style={{ flex: 1, minWidth: 0 }}>
      {label && <div style={{ fontSize: 10, fontWeight: 700, color: B.muted, letterSpacing: ".06em", textTransform: "uppercase" }}>{label}</div>}
      {type === "toggle" || type === "toggle-off" ? (
        <Row gap={8} onClick={() => handleChange(!localVal)} style={{ cursor: "pointer" }}>
          <div style={{
            width: 36, height: 20,
            background: localVal ? B.teal : B.border2,
            borderRadius: 10, padding: 3,
            display: "flex", alignItems: "center",
            justifyContent: localVal ? "flex-end" : "flex-start",
            transition: "all 0.2s", boxShadow: "inset 0 1px 2px rgba(0,0,0,0.4)",
          }}>
            <div style={{ width: 14, height: 14, background: "#fff", borderRadius: "50%", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
          </div>
          <span style={{ fontSize: 11, color: B.muted }}>{placeholder}</span>
        </Row>
      ) : type === "textarea" ? (
        <textarea
          name={name}
          value={localVal}
          onChange={e => handleChange(e.target.value)}
          placeholder={placeholder}
          style={{ ...inputBase, minHeight: 68, padding: "10px 12px", fontSize: 12, resize: "none" }}
        />
      ) : type === "select" ? (
        <select
          name={name}
          value={localVal}
          onChange={e => handleChange(e.target.value)}
          style={{ ...inputBase, height: 37, padding: "0 12px", fontSize: 12 }}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options ? options.map(o => (
            <option key={o} value={o}>{o}</option>
          )) : (
            localVal ? <option value={localVal}>{localVal}</option> : null
          )}
        </select>
      ) : (
        <input
          name={name}
          type={type}
          value={localVal}
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

const PH = ({ title, sub, action, N, onAction, onExport }) => (
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
        {action && <Btn color={N?.color} onClick={onAction}>{action}</Btn>}
      </Row>
    </Row>
  </div>
);

const SearchBar = ({ placeholder }) => (
  <div style={{ flex: 1, height: 37, background: B.bg2, border: `1px solid ${B.border}`, borderRadius: 9, display: "flex", alignItems: "center", padding: "0 12px", gap: 8 }}>
    <Search size={13} color={B.dim} strokeWidth={1.8} />
    <span style={{ fontSize: 12, color: B.muted }}>{placeholder || "Buscar..."}</span>
  </div>
);

// ── SHARED SCREENS (niche-aware) ───────────────────────────────────────────────

const Estoque = ({ N }) => {
  const [products, setProducts] = useState(() => [...N.products]);
  const [nome, setNome] = useState("");
  const [preco, setPreco] = useState("");
  const [minimo, setMinimo] = useState("");
  const [inicial, setInicial] = useState("");
  const [filterText, setFilterText] = useState("");

  const handleSave = () => {
    if (!nome.trim() || !preco.trim() || !inicial.trim() || !minimo.trim()) return;
    setProducts(prev => [...prev, [nome.trim(), preco.startsWith("R$") ? preco : `R$ ${preco}`, inicial.trim(), minimo.trim()]]);
    setNome("");
    setPreco("");
    setMinimo("");
    setInicial("");
  };

  const filteredProducts = products.filter(p => p[0].toLowerCase().includes(filterText.toLowerCase()));
  const totalValue = products.reduce((acc, p) => acc + (parseFloat(p[1].replace("R$", "").replace(".", "").replace(",", ".").trim()) * parseInt(p[2] || 0)), 0);
  const lowStockAlerts = products.filter(p => parseInt(p[2] || 0) < parseInt(p[3] || 0)).length;

  return (
    <Col gap={14}>
      <PH title={`Estoque de ${N.stocksLabel}`} sub={`Controle de ${N.stocksLabel.toLowerCase()} utilizados`} N={N}
        onExport={() => makePDF(N.name, N.name, [{ title: `Estoque de ${N.stocksLabel}`, columns: [N.stockLabel, "Preço unit.", "Qtd. atual", "Mínimo", "Status"], rows: products.map(p => [p[0], p[1], p[2], p[3], parseInt(p[2]) < parseInt(p[3]) ? "Baixo" : "OK"]) }])} />
      <Row gap={10}>
        <Stat label={`Total de ${N.stocksLabel.toLowerCase()}`} value={products.length + " itens"} />
        <Stat label="Valor em estoque" value={`R$ ${totalValue.toFixed(2).replace(".", ",")}`} color={N.secondary} />
        <Stat label="Alertas de reposição" value={lowStockAlerts + ""} sub={`${N.stocksLabel} abaixo do mínimo`} color={lowStockAlerts > 0 ? B.amber : B.teal} />
        <Stat label="Último pedido" value="12/05" sub="R$ 4.200" />
      </Row>
      <Card title={`Lista de ${N.stocksLabel}`} accentColor={N.color}>
        <Row gap={8} style={{ marginBottom: 12 }}>
          <input
            placeholder={`Buscar ${N.stockLabel.toLowerCase()}...`}
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
            style={{ flex: 1, height: 32, background: B.bg2, border: `0.5px solid ${B.border2}`, borderRadius: 7, padding: "0 10px", fontSize: 11, color: B.text, outline: "none" }}
          />
        </Row>
        <Table
          cols={[N.stockLabel.toUpperCase(), "PREÇO UNIT.", `${N.stockLabel.toUpperCase()} ATUAL`, "MÍNIMO", "STATUS", "REMOVER"]}
          rows={filteredProducts.map(p => {
            const origIdx = products.indexOf(p);
            return [
              p[0], p[1], p[2] + " un", p[3] + " un",
              <Badge text={parseInt(p[2]) < parseInt(p[3]) ? "Baixo" : "OK"} color={parseInt(p[2]) < parseInt(p[3]) ? B.amber : B.teal} />,
              <span onClick={() => setProducts(prev => prev.filter((_, i) => i !== origIdx))} style={{ cursor: "pointer", color: B.red, fontSize: 16, padding: "2px 8px", borderRadius: 4, fontWeight: 700, userSelect: "none" }} title="Remover"><X size={14} strokeWidth={2.2} /></span>
            ];
          })}
        />
      </Card>
      <Row gap={10}>
        <Card title={`Consumo de ${N.stocksLabel} — 6 meses`} style={{ flex: 2 }}>
          <ChartBar h={100} color={N.color} />
          <div style={{ fontSize: 10, color: B.muted, marginTop: 8, display: "flex", alignItems: "center", gap: 5 }}><TrendingUp size={11} strokeWidth={1.8} /> Projeção para o próximo mês gerada com base no histórico</div>
        </Card>
        <Card title={`Cadastrar ${N.stockLabel}`} style={{ flex: 1 }}>
          <Field label="NOME" placeholder="Ex: Item do estoque" value={nome} onChange={setNome} />
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

const Servicos = ({ N }) => {
  const [services, setServices] = useState(() => [...N.services]);
  const [nome, setNome] = useState("");
  const [duracao, setDuracao] = useState("");
  const [preco, setPreco] = useState("");
  const [retorno, setRetorno] = useState(N.id === "clinica" ? "15 dias" : "—");

  const handleSave = () => {
    if (!nome.trim() || !duracao.trim() || !preco.trim()) return;
    setServices(prev => [...prev, [nome.trim(), `${duracao.trim()} min`, preco.startsWith("R$") ? preco : `R$ ${preco}`, N.id === "clinica" ? retorno : "—"]]);
    setNome("");
    setDuracao("");
    setPreco("");
  };

  return (
    <Col gap={14}>
      <PH title={N.servicesLabel} sub={`Catálogo de ${N.servicesLabel.toLowerCase()} oferecidos`} N={N}
        onExport={() => makePDF(N.name, N.name, [{ title: N.servicesLabel, columns: ["Nome", "Duração", "Preço", "Retorno"], rows: services.map(s => [s[0], s[1], s[2], s[3]]) }])} />
      <Row gap={10}>
        <Stat label={`${N.servicesLabel} ativos`} value={services.length + ""} />
        <Stat label="Mais realizado" value={services[0]?.[0].split(" ")[0] || "—"} sub="este mês" color={N.color} />
        <Stat label="Ticket médio" value={services[0]?.[2] || "—"} color={N.secondary} />
      </Row>
      <Card title={`${N.servicesLabel} Cadastrados`}>
        <Table cols={["NOME", "DURAÇÃO", "PREÇO", "RETORNO", "REMOVER"]} rows={services.map((s, i) => [
          s[0], s[1], s[2], s[3],
          <span onClick={() => setServices(prev => prev.filter((_, idx) => idx !== i))} style={{ cursor: "pointer", color: B.red, fontSize: 16, padding: "2px 8px", borderRadius: 4, fontWeight: 700, userSelect: "none" }} title="Remover"><X size={14} strokeWidth={2.2} /></span>
        ])} />
      </Card>
      <Card title={`Cadastrar ${N.serviceLabel}`}>
        <Row gap={10}>
          <Field label="NOME" placeholder="Ex: Procedimento" value={nome} onChange={setNome} />
          <Field label="DURAÇÃO (MIN)" placeholder="30" value={duracao} onChange={setDuracao} />
          <Field label="PREÇO" placeholder="0,00" value={preco} onChange={setPreco} />
        </Row>
        <Row gap={10} style={{ marginTop: 8 }}>
          {N.id === "clinica" && <Field label="RETORNO OBRIGATÓRIO" type="toggle" placeholder="Sim — após 15 dias" value={retorno !== "—"} onChange={val => setRetorno(val ? "15 dias" : "—")} />}
          {N.id === "clinica" && <Field label="PRAZO (DIAS)" value={retorno === "—" ? "0" : retorno.split(" ")[0]} onChange={val => setRetorno(val ? `${val} dias` : "—")} />}
          {N.id !== "clinica" && <Field label="COMISSÃO DO PROFISSIONAL (%)" placeholder="40%" />}
          {N.id !== "clinica" && <Field label="TEMPO ESTIMADO" placeholder="30 min" />}
        </Row>
        <Row gap={8} style={{ marginTop: 14, justifyContent: "flex-end" }}>
          <Btn onClick={() => { setNome(""); setDuracao(""); setPreco(""); }}>Cancelar</Btn>
          <Btn color={N.color} onClick={handleSave}>Salvar {N.serviceLabel}</Btn>
        </Row>
      </Card>
    </Col>
  );
};

const Agenda = ({ N }) => {
  const hours = ["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"];
  const days = ["Seg 02", "Ter 03", "Qua 04", "Qui 05", "Sex 06"];
  const clients = N.clients;
  const services = N.services;
  const pros = N.pros;

  const [appointments, setAppointments] = useState(() => [
    { day: "Ter 03", hour: "09:00", client: clients[0], service: services[0][0], value: services[0][2], pro: pros[0], status: "Confirmado" },
    { day: "Ter 03", hour: "11:00", client: clients[1], service: services[1][0], value: services[1][2], pro: pros[1], status: "Confirmado" },
    { day: "Qua 04", hour: "10:00", client: clients[2], service: services[2][0], value: services[2][2], pro: pros[0], status: "Confirmado" },
  ]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    if (N.id === "clinica" && !crmLoadClients("clinica")) {
      const seed = N.clients.map((c, i) => ({
        id: i, nome: c, telefone: `(11) 9${9000 + i * 111}-${8888 - i * 111}`,
        email: c.split(" ")[0].toLowerCase() + "@email.com",
        totalGasto: ["R$ 12.400", "R$ 8.200", "R$ 5.600", "R$ 3.100"][i] || "R$ 0",
        sessoes: [18, 12, 7, 4][i] || 0, ultimaVisita: ["28/05", "15/04", "02/03", "18/01"][i] || "—",
        notes: [], anamnese: { alergia: "Não", gravidez: "Não", anticoag: "Não", autoimune: "Não" },
      }));
      crmSaveClients("clinica", seed);
    }
  }, []);

  const [addDay, setAddDay] = useState(days[0]);
  const [addHour, setAddHour] = useState(hours[0]);
  const [addClient, setAddClient] = useState(clients[0] || "");
  const [addService, setAddService] = useState(services[0]?.[0] || "");
  const [addPro, setAddPro] = useState(pros[0] || "");

  const handleCreateAppointment = () => {
    if (!addClient || !addService) return;
    const selectedServiceObj = services.find(s => s[0] === addService) || services[0];
    const val = selectedServiceObj ? selectedServiceObj[2] : "R$ 0";
    setAppointments(prev => [...prev, { day: addDay, hour: addHour, client: addClient, service: addService, value: val, pro: addPro, status: "Confirmado" }]);
    setShowAdd(false);
  };

  const apptsMap = {};
  appointments.forEach((a, index) => {
    apptsMap[`${a.day}-${a.hour}`] = { ...a, index };
  });

  const selectedAppt = appointments[selectedIdx] || appointments[0];

  return (
    <Col gap={14}>
      <PH
        title="Agenda"
        sub="Semana de 2–6 de junho de 2025"
        action={showAdd ? "Fechar Formulário" : "+ Novo Agendamento"}
        N={N}
        onAction={() => setShowAdd(!showAdd)}
        onExport={() => makePDF(N.name, N.name, [{ title: "Agendamentos", columns: ["Cliente", "Serviço", "Dia", "Hora", "Status", "Valor"], rows: appointments.map(a => [a.client, a.service, a.day, a.hour, a.status, a.value]) }])}
      />
      <Row gap={10}>
        <Stat label="Hoje" value={appointments.filter(a => a.day === "Ter 03").length + ""} sub={N.servicesLabel.toLowerCase()} />
        <Stat label="Esta semana" value={appointments.length + ""} />
        <Stat label="Taxa de ocupação" value="72%" color={N.secondary} />
        <Stat label="Aniversariantes" value="2" sub="esta semana" color={N.color} />
      </Row>

      {showAdd && (
        <Card title="Novo Agendamento">
          <Row gap={10}>
            <Field label="DIA" type="select" value={addDay} onChange={setAddDay} options={days} />
            <Field label="HORA" type="select" value={addHour} onChange={setAddHour} options={hours} />
            <Field label="CLIENTE" type="select" value={addClient} onChange={setAddClient} options={clients} />
            <Field label="SERVIÇO" type="select" value={addService} onChange={setAddService} options={services.map(s => s[0])} />
            <Field label="PROFISSIONAL" type="select" value={addPro} onChange={setAddPro} options={pros} />
          </Row>
          <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <Btn onClick={() => setShowAdd(false)}>Cancelar</Btn>
            <Btn color={N.color} onClick={handleCreateAppointment}>Agendar</Btn>
          </div>
        </Card>
      )}

      <Row gap={10} style={{ alignItems: "flex-start" }}>
        <Card style={{ flex: 3, overflowX: "auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "48px repeat(5,1fr)", marginBottom: 4 }}>
            <div />
            {days.map(d => (
              <div key={d} style={{ textAlign: "center", fontSize: 11, color: d === "Ter 03" ? N.color : B.muted, fontWeight: d === "Ter 03" ? 700 : 400, paddingBottom: 8, borderBottom: `2px solid ${d === "Ter 03" ? N.color : B.border}` }}>{d}</div>
            ))}
          </div>
          {hours.map(h => (
            <div key={h} style={{ display: "grid", gridTemplateColumns: "48px repeat(5,1fr)", borderBottom: `0.5px solid ${B.border}`, minHeight: 40 }}>
              <div style={{ fontSize: 10, color: B.dim, paddingTop: 4, paddingRight: 8, textAlign: "right" }}>{h}</div>
              {days.map(d => {
                const a = apptsMap[`${d}-${h}`];
                const isSelected = a && appointments[selectedIdx] === a;
                const c = a ? (a.status === "Cancelado" ? B.muted : (isSelected ? N.color : B.teal)) : "transparent";
                return (
                  <div key={d} style={{ borderLeft: `0.5px solid ${B.border}`, padding: "3px 4px", background: d === "Ter 03" ? N.color + "08" : "transparent" }}>
                    {a && (
                      <div
                        onClick={() => setSelectedIdx(a.index)}
                        style={{
                          background: c + "25",
                          border: `0.5px solid ${c}`,
                          borderRadius: 5,
                          padding: "3px 6px",
                          fontSize: 10,
                          color: c,
                          lineHeight: 1.3,
                          cursor: "pointer",
                          fontWeight: isSelected ? "bold" : "normal"
                        }}
                      >
                        {a.client} — {a.service}
                        {a.status === "Cancelado" && " (Cancelado)"}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </Card>

        {selectedAppt && (
          <Col gap={10} style={{ flex: 1 }}>
            <Card title="Detalhes">
              <Row gap={8} style={{ marginBottom: 10 }}>
                <Avatar name={selectedAppt.client} color={N.color} size={36} />
                <Col gap={2}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: B.text }}>{selectedAppt.client}</span>
                  <span style={{ fontSize: 11, color: B.muted }}>{selectedAppt.service}</span>
                </Col>
              </Row>
              <Divider />
              <Col gap={8}>
                <Row style={{ justifyContent: "space-between" }}><span style={{ fontSize: 11, color: B.muted }}>Data</span><span style={{ fontSize: 11, color: B.text }}>{selectedAppt.day} — {selectedAppt.hour}</span></Row>
                <Row style={{ justifyContent: "space-between" }}><span style={{ fontSize: 11, color: B.muted }}>Valor</span><span style={{ fontSize: 11, color: B.text }}>{selectedAppt.value}</span></Row>
                <Row style={{ justifyContent: "space-between" }}><span style={{ fontSize: 11, color: B.muted }}>{N.proLabel}</span><span style={{ fontSize: 11, color: B.text }}>{selectedAppt.pro}</span></Row>
                <Row style={{ justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, color: B.muted }}>Status</span>
                  <Badge text={selectedAppt.status} color={selectedAppt.status === "Pago" || selectedAppt.status === "Confirmado" ? B.teal : (selectedAppt.status === "Cancelado" ? B.red : B.amber)} />
                </Row>
              </Col>
              <Divider />
              <Col gap={6}>
                {selectedAppt.status !== "Pago" && selectedAppt.status !== "Cancelado" && (
                  <Btn color={N.color} onClick={() => {
                    const a = appointments[selectedIdx];
                    if (a) crmPushService(N.id, a.client, { svc: a.service, pro: a.pro, barb: (a.pro || "").split(" ")[0], val: a.value });
                    setAppointments(prev => prev.map((ap, i) => i === selectedIdx ? { ...ap, status: "Pago" } : ap));
                  }}><Check size={12} strokeWidth={2} /> Marcar como pago</Btn>
                )}
                <Row gap={6}>
                  {selectedAppt.status !== "Cancelado" && (
                    <Btn sm danger onClick={() => setAppointments(prev => prev.map((a, i) => i === selectedIdx ? { ...a, status: "Cancelado" } : a))}>Cancelar</Btn>
                  )}
                  <Btn sm danger onClick={() => { setAppointments(prev => prev.filter((_, i) => i !== selectedIdx)); setSelectedIdx(0); }}><Trash2 size={12} strokeWidth={1.8} /> Remover</Btn>
                </Row>
              </Col>
            </Card>
          </Col>
        )}
      </Row>
    </Col>
  );
};

const Financeiro = ({ N }) => {
  const [expenses, setExpenses] = useState([
    { name: "Aluguel", value: 3500, status: "Pago" },
    { name: "Materiais", value: 2800, status: "Pago" },
    { name: "Energia", value: 680, status: "Pendente" },
    { name: "Internet", value: 180, status: "Pago" },
  ]);
  const [payments, setPayments] = useState(() => N.clients.map((c, i) => ({
    client: c,
    service: N.services[i % N.services.length][0],
    value: N.services[i % N.services.length][2],
    type: ["PIX", "Cartão", "Dinheiro", "Cartão"][i % 4],
    status: ["Pago", "Pago", "Parcial", "Pendente"][i % 4],
  })));
  const [nomeGasto, setNomeGasto] = useState("");
  const [valorGasto, setValorGasto] = useState("");
  const [showAddGasto, setShowAddGasto] = useState(false);

  const handleAddGasto = () => {
    if (!nomeGasto.trim() || !valorGasto.trim()) return;
    setExpenses(prev => [...prev, { name: nomeGasto.trim(), value: parseFloat(valorGasto), status: "Pago" }]);
    setNomeGasto("");
    setValorGasto("");
    setShowAddGasto(false);
  };

  const totalPayments = payments.reduce((acc, p) => {
    if (p.status === "Pago" || p.status === "Parcial") {
      const v = parseFloat(p.value.replace("R$", "").replace(".", "").replace(",", ".").trim());
      return acc + (isNaN(v) ? 0 : v);
    }
    return acc;
  }, 0);

  const totalExpenses = expenses.reduce((acc, e) => acc + (parseFloat(e.value) || 0), 0);
  const netProfit = totalPayments - totalExpenses;

  return (
    <Col gap={14}>
      <PH
        title="Financeiro"
        sub="Junho 2025"
        N={N}
        action={showAddGasto ? "Fechar" : "+ Novo Gasto"}
        onAction={() => setShowAddGasto(!showAddGasto)}
        onExport={() => makePDF(N.name, N.name, [
          { title: "Recebimentos", columns: ["Cliente", "Serviço", "Valor", "Tipo", "Status"], rows: payments.map(p => [p.client, p.service, p.value, p.type, p.status]) },
          { title: "Gastos", columns: ["Descrição", "Valor (R$)", "Status"], rows: expenses.map(e => [e.name, e.value, e.status]) },
        ])}
      />
      <Row gap={10}>
        <Stat label="Faturamento real" value={`R$ ${totalPayments.toFixed(2).replace(".", ",")}`} color={N.secondary} />
        <Stat label="Gastos totais" value={`R$ ${totalExpenses.toFixed(2).replace(".", ",")}`} color={B.red} />
        <Stat label="Resultado estimado" value={`R$ ${netProfit.toFixed(2).replace(".", ",")}`} color={netProfit >= 0 ? N.color : B.amber} />
      </Row>

      {showAddGasto && (
        <Card title="Adicionar Despesa">
          <Row gap={10}>
            <Field label="DESCRIÇÃO DO GASTO" placeholder="Ex: Conta de Luz" value={nomeGasto} onChange={setNomeGasto} />
            <Field label="VALOR" placeholder="0,00" value={valorGasto} onChange={setValorGasto} />
          </Row>
          <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <Btn onClick={() => setShowAddGasto(false)}>Cancelar</Btn>
            <Btn color={N.color} onClick={handleAddGasto}>Adicionar</Btn>
          </div>
        </Card>
      )}

      <Row gap={10} style={{ alignItems: "flex-start" }}>
        <Card title="Faturamento — Últimos 6 meses" style={{ flex: 2 }}>
          <ChartLine h={130} color={N.color} />
          <Row gap={4} style={{ marginTop: 8, flexWrap: "wrap" }}>
            {[["Jan", "38k"], ["Fev", "41k"], ["Mar", "45k"], ["Abr", "42k"], ["Mai", "46k"], ["Jun", `${(totalPayments / 1000).toFixed(1)}k`]].map(([m, v]) => (
              <Badge key={m} text={`${m} R$ ${v}`} color={m === "Jun" ? N.secondary : B.muted} />
            ))}
          </Row>
        </Card>
        <Card title={`Por ${N.serviceLabel.toLowerCase()}`} style={{ flex: 1 }}>
          <ImgBox h={130} label="[ Gráfico pizza ]" />
          <Col gap={5} style={{ marginTop: 10 }}>
            {N.services.slice(0, 4).map((s, i) => (
              <Row key={i} style={{ justifyContent: "space-between" }}>
                <Row gap={6}><div style={{ width: 8, height: 8, borderRadius: "50%", background: [N.color, N.secondary, B.amber, B.muted][i] }} /><span style={{ fontSize: 11, color: B.muted }}>{s[0]}</span></Row>
                <span style={{ fontSize: 11, color: B.text, fontWeight: 600 }}>{[38, 28, 20, 14][i]}%</span>
              </Row>
            ))}
          </Col>
        </Card>
      </Row>
      <Row gap={10} style={{ alignItems: "flex-start" }}>
        <Card title="Pagamentos recentes" style={{ flex: 2 }}>
          <Table
            cols={[N.clientLabel.toUpperCase(), N.serviceLabel.toUpperCase(), "VALOR", "FORMA", "STATUS", "REMOVER"]}
            rows={payments.map((p, i) => [
              p.client, p.service, p.value, p.type,
              <Badge text={p.status} color={p.status === "Pago" ? B.teal : (p.status === "Parcial" ? B.amber : B.red)} />,
              <span onClick={() => setPayments(prev => prev.filter((_, idx) => idx !== i))} style={{ cursor: "pointer", color: B.red, fontSize: 16, padding: "2px 8px", fontWeight: 700, userSelect: "none" }} title="Remover"><X size={14} strokeWidth={2.2} /></span>
            ])}
          />
        </Card>
        <Card title="Gastos do mês" style={{ flex: 1 }}>
          {expenses.map((e, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `0.5px solid ${B.border}`, padding: "8px 0", fontSize: 11 }}>
              <span style={{ color: B.text }}>{e.name}</span>
              <Row gap={8}>
                <span style={{ color: B.text, fontWeight: 600 }}>R$ {e.value}</span>
                <Badge text={e.status} color={e.status === "Pendente" ? B.amber : B.teal} />
                <span onClick={() => setExpenses(prev => prev.filter((_, idx) => idx !== i))} style={{ cursor: "pointer", color: B.red, fontSize: 15, fontWeight: 700, userSelect: "none" }} title="Remover"><X size={14} strokeWidth={2.2} /></span>
              </Row>
            </div>
          ))}
        </Card>
      </Row>
    </Col>
  );
};



const Multiprofissional = ({ N }) => {
  const [pros, setPros] = useState(() => [...N.pros]);
  const [nomePro, setNomePro] = useState("");
  const [showAddPro, setShowAddPro] = useState(false);

  const handleAddPro = () => {
    if (!nomePro.trim()) return;
    setPros(prev => [...prev, nomePro.trim()]);
    setNomePro("");
    setShowAddPro(false);
  };

  return (
    <Col gap={14}>
      <PH
        title="Modo Multiprofissional"
        sub={`Gestão da equipe de ${N.proLabel.toLowerCase()}s`}
        action={showAddPro ? "Fechar" : `+ Adicionar ${N.proLabel}`}
        N={N}
        onAction={() => setShowAddPro(!showAddPro)}
      />
      <Row gap={10}>
        <Stat label={`${N.proLabel}s ativos`} value={pros.length + ""} />
        <Stat label="Atendimentos hoje" value="12" color={N.secondary} />
        <Stat label="Horas trabalhadas (mês)" value="284h" color={N.color} />
      </Row>

      {showAddPro && (
        <Card title={`Cadastrar ${N.proLabel}`}>
          <Row gap={10}>
            <Field label={`NOME DO ${N.proLabel.toUpperCase()}`} placeholder="Ex: Lucas Silva" value={nomePro} onChange={setNomePro} />
          </Row>
          <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <Btn onClick={() => setShowAddPro(false)}>Cancelar</Btn>
            <Btn color={N.color} onClick={handleAddPro}>Salvar</Btn>
          </div>
        </Card>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
        {pros.map((p, i) => (
          <Card key={i}>
            <Row style={{ justifyContent: "space-between", marginBottom: 10 }}>
              <Row gap={10}>
                <Avatar name={p} color={N.color} size={36} />
                <Col gap={2}><span style={{ fontSize: 13, fontWeight: 600, color: B.text }}>{p}</span><span style={{ fontSize: 11, color: B.muted }}>{N.proLabel}</span></Col>
              </Row>
              <Row gap={6}>
                <Badge text="Ativo" color={B.teal} />
                <span onClick={() => setPros(prev => prev.filter((_, idx) => idx !== i))} style={{ cursor: "pointer", color: B.red, fontSize: 15, fontWeight: 700, userSelect: "none", padding: "0 4px" }} title="Remover"><X size={14} strokeWidth={2.2} /></span>
              </Row>
            </Row>
            <Divider />
            <Row style={{ justifyContent: "space-between", marginBottom: 6 }}><span style={{ fontSize: 11, color: B.muted }}>Atendimentos (mês)</span><span style={{ fontSize: 11, color: B.text, fontWeight: 600 }}>{[38, 24, 30][i % 3]}</span></Row>
            <Row style={{ justifyContent: "space-between", marginBottom: 6 }}><span style={{ fontSize: 11, color: B.muted }}>Horas trabalhadas</span><span style={{ fontSize: 11, color: B.text, fontWeight: 600 }}>{["120h", "96h", "104h"][i % 3]}</span></Row>
            <Row style={{ justifyContent: "space-between" }}><span style={{ fontSize: 11, color: B.muted }}>Remuneração est.</span><span style={{ fontSize: 12, color: N.color, fontWeight: 700 }}>R$ {["8.400", "4.800", "7.200"][i % 3]}</span></Row>
            <Row gap={6} style={{ marginTop: 10 }}><Btn sm color={N.color}>Ver agenda</Btn><Btn sm>Editar</Btn></Row>
          </Card>
        ))}
      </div>
      <Card title="Registro de Ponto — Hoje">
        <Table
          cols={[N.proLabel.toUpperCase(), "ENTRADA", "SAÍDA", "HORAS", "ATENDIMENTOS"]}
          rows={pros.map((p, i) => [
            p,
            ["08:02", "09:00", "08:30"][i % 3] || "08:00",
            ["—", "14:30", "—"][i % 3] || "—",
            ["6h18m (em curso)", "5h30m", "5h48m (em curso)"][i % 3] || "8h00m",
            <Badge text={["5 atend.", "3 atend.", "4 atend."][i % 3] || "0 atend."} color={[N.color, B.teal, N.color][i % 3] || B.muted} />
          ])}
        />
      </Card>
    </Col>
  );
};

// ── SHARED CONFIG ──────────────────────────────────────────────────────────────

const WhatsAppEmail = ({ N }) => (
  <Col gap={14}>
    <PH title="Integrações" sub="WhatsApp, e-mail e notificações automáticas" N={N} />
    <Row gap={10} style={{ alignItems: "flex-start" }}>
      <Card title="WhatsApp" style={{ flex: 1 }}>
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <div style={{ width: 70, height: 70, background: B.teal + "20", border: `2px solid ${B.teal}`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}><Check size={28} color={B.teal} strokeWidth={2} /></div>
          <div style={{ fontSize: 14, fontWeight: 700, color: B.teal }}>WhatsApp conectado</div>
          <div style={{ fontSize: 11, color: B.muted, marginTop: 4 }}>+55 (11) 99999-0000</div>
          <Row gap={8} style={{ justifyContent: "center", marginTop: 12 }}><Btn danger>Desconectar</Btn><Btn>Verificar</Btn></Row>
        </div>
        <Divider />
        <Col gap={10}>
          {["Confirmação de agendamento", "Lembrete 24h antes", "Remarketing automático"].map((m, i) => (
            <Row key={i} style={{ justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, color: B.text }}>{m}</span>
              <Field type={i < 2 ? "toggle" : "toggle-off"} placeholder="" />
            </Row>
          ))}
        </Col>
        <div style={{ marginTop: 12 }}><Btn color={N.color}>Salvar configurações</Btn></div>
      </Card>
      <Card title="E-mail" style={{ flex: 1 }}>
        <Field label="E-MAIL DA EMPRESA" value={`contato@${N.id}.com.br`} />
        <Field label="NOME DO REMETENTE" value={N.name} />
        <Divider />
        <Col gap={10}>
          {["Confirmação de agendamento", "Resumo diário", "Alerta de estoque baixo", "Relatório semanal"].map((m, i) => (
            <Row key={i} style={{ justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, color: B.text }}>{m}</span>
              <Field type={i < 3 ? "toggle" : "toggle-off"} placeholder="" />
            </Row>
          ))}
        </Col>
        <div style={{ marginTop: 12 }}><Btn color={N.color}>Salvar configurações</Btn></div>
      </Card>
      <Card title="Preview do e-mail" style={{ flex: 1 }}>
        <div style={{ border: `0.5px solid ${B.border}`, borderRadius: 8, overflow: "hidden" }}>
          <div style={{ padding: "10px 14px", background: N.color, color: "#fff", fontSize: 12, fontWeight: 600 }}>{N.name}</div>
          <div style={{ padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: B.text, marginBottom: 8 }}>Seu agendamento foi confirmado!</div>
            <div style={{ fontSize: 11, color: B.muted, lineHeight: 1.8 }}>
              Olá <strong>{N.clients[0]}</strong>,<br />
              {N.services[0][0]} confirmado para:<br />
              <Calendar size={12} strokeWidth={1.8} style={{ verticalAlign: "middle", marginRight: 4 }} /> Terça-feira, 03/06/2025 às 09:00
            </div>
            <div style={{ marginTop: 12, padding: 10, background: N.color + "20", borderRadius: 6, border: `0.5px solid ${N.color}`, textAlign: "center" }}>
              <div style={{ fontSize: 12, color: N.color, fontWeight: 600 }}>Confirmar presença</div>
            </div>
          </div>
        </div>
      </Card>
    </Row>
  </Col>
);

const Taxas = ({ N }) => (
  <Col gap={14}>
    <PH title="Taxas & Configurações" sub="Configure taxas e módulos do sistema" N={N} />
    <Row gap={10} style={{ alignItems: "flex-start" }}>
      <Card title="Taxas de maquininha" style={{ flex: 1 }}>
        {[["Débito", "1,5%"], ["Crédito à vista", "2,5%"], ["Crédito 2×", "3,2%"], ["Crédito 3×–6×", "4,0%"], ["Crédito 7×–12×", "5,0%"], ["PIX", "0,99%"]].map((t, i) => (
          <Row key={i} style={{ justifyContent: "space-between", borderBottom: `0.5px solid ${B.border}`, padding: "9px 0" }}>
            <span style={{ fontSize: 12, color: B.text }}>{t[0]}</span>
            <div style={{ height: 30, width: 80, background: B.bg2, border: `0.5px solid ${B.border2}`, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: B.text }}>{t[1]}</div>
          </Row>
        ))}
        <div style={{ marginTop: 10 }}><Btn color={N.color}>Salvar taxas</Btn></div>
      </Card>
      <Card title="Módulos ativos" style={{ flex: 1 }}>
        <Col gap={14}>
          {[
            { l: "Modo Multiprofissional", on: true },
            { l: "Notificações WhatsApp", on: true },
            { l: "Notificações por e-mail", on: false },
            { l: N.id === "clinica" ? "Portfólio digital" : N.id === "barbearia" ? "Assinaturas mensais" : "Orçamentos digitais", on: true },
          ].map((m, i) => (
            <Row key={i} style={{ justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, color: B.text }}>{m.l}</span>
              <Field type={m.on ? "toggle" : "toggle-off"} placeholder="" />
            </Row>
          ))}
        </Col>
        <div style={{ marginTop: 16 }}><Btn color={N.color}>Salvar configurações</Btn></div>
      </Card>
    </Row>
  </Col>
);

// ── CLÍNICA-SPECIFIC ───────────────────────────────────────────────────────────

const Comanda = ({ N }) => {
  const clients = N.clients;
  const [comandas, setComandas] = useState([
    { client: clients[0], service: N.services[0][0], sessionsUsed: 2, sessionsTotal: 5, value: N.services[0][2], status: "Ativa" },
    { client: clients[1], service: N.services[1][0], sessionsUsed: 3, sessionsTotal: 3, value: N.services[1][2], status: "Concluído" },
    { client: clients[2], service: N.services[2][0], sessionsUsed: 1, sessionsTotal: 4, value: N.services[2][2], status: "Ativa" },
  ]);
  const [paciente, setPaciente] = useState(clients[0] || "");
  const [procedimento, setProcedimento] = useState(N.services[0][0]);
  const [sessoes, setSessoes] = useState("3");
  const [preco, setPreco] = useState("R$ 3.000");

  const handleCreateComanda = () => {
    if (!paciente.trim() || !procedimento.trim() || !sessoes.trim()) return;
    setComandas(prev => [...prev, {
      client: paciente,
      service: procedimento,
      sessionsUsed: 0,
      sessionsTotal: parseInt(sessoes),
      value: preco.startsWith("R$") ? preco : `R$ ${preco}`,
      status: "Ativa"
    }]);
    setPaciente(clients[0] || "");
    setSessoes("3");
    setPreco("R$ 3.000");
  };

  return (
    <Col gap={14}>
      <PH title="Comandas / Protocolos" sub="Pacotes de tratamento com múltiplas sessões" N={N} />
      <Row gap={10}>
        <Stat label="Comandas ativas" value={comandas.filter(c => c.status === "Ativa").length + ""} />
        <Stat label="Sessões este mês" value="28" color={N.secondary} />
        <Stat label="Receita projetada" value="R$ 32.400" color={N.color} />
      </Row>
      <Card title="Comandas Ativas">
        {comandas.map((c, i) => (
          <div key={i} style={{ borderBottom: `0.5px solid ${B.border}`, padding: "12px 0", display: "flex", alignItems: "center", gap: 12 }}>
            <Avatar name={c.client} color={N.color} size={34} />
            <Col gap={4} style={{ flex: 1 }}>
              <Row style={{ justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: B.text }}>{c.client}</span>
                <Row gap={8}>
                  <span style={{ fontSize: 11, color: B.muted }}>Status: {c.status}</span>
                  <span onClick={() => setComandas(prev => prev.filter((_, idx) => idx !== i))} style={{ cursor: "pointer", color: B.red, fontSize: 15, fontWeight: 700, userSelect: "none" }} title="Remover"><X size={14} strokeWidth={2.2} /></span>
                </Row>
              </Row>
              <Row gap={8}>
                <span style={{ fontSize: 11, color: B.muted }}>{c.service}</span>
                <span style={{ fontSize: 11, color: N.color }}>{c.value}</span>
              </Row>
              <div style={{ height: 4, background: B.border2, borderRadius: 2 }}>
                <div style={{ height: "100%", width: `${(c.sessionsUsed / c.sessionsTotal) * 100}%`, background: c.status === "Concluído" ? B.teal : N.color, borderRadius: 2 }} />
              </div>
              <span style={{ fontSize: 10, color: B.dim }}>{c.sessionsUsed}/{c.sessionsTotal} sessões realizadas</span>
            </Col>
          </div>
        ))}
      </Card>
      <Card title="Criar Nova Comanda">
        <Row gap={10}>
          <Field label="PACIENTE" type="select" value={paciente} onChange={setPaciente} options={clients} />
          <Field label="PROCEDIMENTO" type="select" value={procedimento} onChange={setProcedimento} options={N.services.map(s => s[0])} />
          <Field label="Nº DE SESSÕES" value={sessoes} onChange={setSessoes} />
        </Row>
        <Row gap={10} style={{ marginTop: 8 }}>
          <Field label="PREÇO TOTAL" value={preco} onChange={setPreco} />
        </Row>
        <Row gap={8} style={{ marginTop: 14, justifyContent: "flex-end" }}>
          <Btn onClick={() => { setPaciente(clients[0] || ""); setSessoes("3"); setPreco("R$ 3.000"); }}>Cancelar</Btn>
          <Btn color={N.color} onClick={handleCreateComanda}>Criar Comanda</Btn>
        </Row>
      </Card>
    </Col>
  );
};

const FichaPaciente = ({ N }) => {
  const [pacientes, setPacientes] = useState(() => crmLoadClients("clinica") || N.clients.map((c, i) => ({
    id: i, nome: c, telefone: `(11) 9${9000 + i * 111}-${8888 - i * 111}`,
    email: c.split(" ")[0].toLowerCase() + "@email.com",
    totalGasto: ["R$ 12.400", "R$ 8.200", "R$ 5.600", "R$ 3.100"][i] || "R$ 0",
    sessoes: [18, 12, 7, 4][i] || 0,
    ultimaVisita: ["28/05", "15/04", "02/03", "18/01"][i] || "—",
    notes: i === 0 ? ["28/05 — Boa resposta ao Botox.", "15/04 — Primeira aplicação de Bioestimulador."] : [],
    anamnese: { alergia: "Não", gravidez: "Não", anticoag: i === 0 ? "Sim — Aspirina" : "Não", autoimune: "Não" },
  })));
  const [selectedId, setSelectedId] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [fNome, setFNome] = useState("");
  const [fTel, setFTel] = useState("");
  const [fEmail, setFEmail] = useState("");
  const [newNote, setNewNote] = useState("");
  const [regSvc, setRegSvc] = useState(N.services[0]?.[0] || "");
  const [regPro, setRegPro] = useState(N.pros[0] || "");
  const [regVal, setRegVal] = useState(N.services[0]?.[2] || "");

  useEffect(() => { crmSaveClients("clinica", pacientes); }, [pacientes]);

  const handleAddPaciente = () => {
    if (!fNome.trim()) return;
    setPacientes(prev => [...prev, { id: Date.now(), nome: fNome.trim(), telefone: fTel, email: fEmail, totalGasto: "R$ 0", sessoes: 0, ultimaVisita: "—", notes: [], anamnese: { alergia: "Não", gravidez: "Não", anticoag: "Não", autoimune: "Não" } }]);
    setFNome(""); setFTel(""); setFEmail(""); setShowAdd(false);
  };

  const selected = pacientes.find(p => p.id === selectedId);

  const handleSaveNote = () => {
    if (!newNote.trim() || !selected) return;
    const today = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    setPacientes(prev => prev.map(p => p.id === selectedId ? { ...p, notes: [`${today} — ${newNote.trim()}`, ...p.notes] } : p));
    setNewNote("");
  };

  const handleRegSessao = () => {
    if (!regSvc || !selected) return;
    const today = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    setPacientes(prev => prev.map(p => p.id === selectedId ? {
      ...p,
      notes: [`${today} — ${regSvc} com ${regPro} · ${regVal}`, ...p.notes],
      sessoes: p.sessoes + 1,
      ultimaVisita: today,
    } : p));
  };

  const updateAnamnese = (field, val) => setPacientes(prev => prev.map(p => p.id === selectedId ? { ...p, anamnese: { ...p.anamnese, [field]: val } } : p));

  if (selected) return (
    <Col gap={14}>
      <Row style={{ justifyContent: "space-between" }}>
        <Row gap={10}>
          <button onClick={() => setSelectedId(null)} style={{ background: "transparent", border: `0.5px solid ${B.border}`, color: B.muted, cursor: "pointer", fontSize: 12, padding: "6px 12px", borderRadius: 7, fontFamily: "inherit" }}>← Voltar</button>
          <Col gap={1}>
            <span style={{ fontSize: 17, fontWeight: 700, color: B.text }}>{selected.nome}</span>
            <span style={{ fontSize: 11, color: B.muted }}>{selected.telefone} · {selected.email}</span>
          </Col>
        </Row>
        <Btn danger onClick={() => { setPacientes(prev => prev.filter(p => p.id !== selectedId)); setSelectedId(null); }}><Trash2 size={12} strokeWidth={1.8} /> Remover Paciente</Btn>
      </Row>
      <Row gap={10}><Stat label="Total gasto" value={selected.totalGasto} color={N.color} /><Stat label="Sessões" value={selected.sessoes + ""} /><Stat label="Última visita" value={selected.ultimaVisita} /></Row>
      <Row gap={10} style={{ alignItems: "flex-start" }}>
        <Col gap={10} style={{ flex: 2 }}>
          <Card title="Mapa de Toxina Facial">
            <Row gap={10}>
              <ImgBox h={160} label="[ Mapa facial ]" />
              <Col gap={8} style={{ flex: 1 }}>
                <Table cols={["MÚSCULO", "QTDE"]} rows={[["Frontal", "8u"], ["Glabela", "20u"], ["Orbicular", "4u"], ["Masseter", "30u"]]} />
                <Field label="PRODUTO" value="Botulotoxina 100u" />
                <Btn sm color={N.color}>Gerar PDF</Btn>
              </Col>
            </Row>
          </Card>
          <Card title="Registrar Sessão">
            <Row gap={10}>
              <Field label="PROCEDIMENTO" type="select" value={regSvc} onChange={v => { setRegSvc(v); const s = N.services.find(x => x[0] === v); if (s) setRegVal(s[2]); }} options={N.services.map(s => s[0])} />
              <Field label="PROFISSIONAL" type="select" value={regPro} onChange={setRegPro} options={N.pros} />
              <Field label="VALOR" value={regVal} onChange={setRegVal} />
            </Row>
            <div style={{ marginTop: 10 }}><Btn color={N.color} onClick={handleRegSessao}><CheckCircle size={12} strokeWidth={1.8} /> Registrar na Ficha</Btn></div>
          </Card>
          <Card title="Histórico / Notas Clínicas">
            {selected.notes.map((n, i) => (
              <div key={i} style={{ borderBottom: `0.5px solid ${B.border}`, padding: "8px 0", fontSize: 11, color: B.text, display: "flex", justifyContent: "space-between" }}>
                <span>{n}</span>
                <span onClick={() => setPacientes(prev => prev.map(p => p.id === selectedId ? { ...p, notes: p.notes.filter((_, idx) => idx !== i) } : p))} style={{ cursor: "pointer", color: B.red, fontSize: 14, fontWeight: 700, marginLeft: 8 }}><X size={14} strokeWidth={2.2} /></span>
              </div>
            ))}
            <div style={{ marginTop: 10 }}>
              <Field label="NOTA LIVRE" type="textarea" placeholder="Evolução clínica, observações..." value={newNote} onChange={setNewNote} />
              <div style={{ marginTop: 8 }}><Btn color={N.color} onClick={handleSaveNote}>Salvar Nota</Btn></div>
            </div>
          </Card>
        </Col>
        <Col gap={10} style={{ flex: 1 }}>
          <Card title="Anamnese">
            {[["Alergia a medicamentos?", "alergia"], ["Gravidez?", "gravidez"], ["Anticoagulantes?", "anticoag"], ["Autoimune?", "autoimune"]].map(([q, field], i) => (
              <div key={i} style={{ borderBottom: `0.5px solid ${B.border}`, padding: "8px 0" }}>
                <div style={{ fontSize: 11, color: B.muted, marginBottom: 4 }}>{q}</div>
                <Row gap={8}>
                  {["Não", "Sim"].map(opt => (
                    <div key={opt} onClick={() => updateAnamnese(field, opt === selected.anamnese[field] ? selected.anamnese[field] : opt)}
                      style={{ padding: "3px 12px", borderRadius: 6, fontSize: 11, cursor: "pointer", background: selected.anamnese[field] === opt ? (opt === "Sim" ? B.amber + "25" : B.teal + "25") : "transparent", border: `0.5px solid ${selected.anamnese[field] === opt ? (opt === "Sim" ? B.amber : B.teal) : B.border}`, color: selected.anamnese[field] === opt ? (opt === "Sim" ? B.amber : B.teal) : B.muted }}>
                      {opt}
                    </div>
                  ))}
                </Row>
              </div>
            ))}
          </Card>
        </Col>
      </Row>
    </Col>
  );

  return (
    <Col gap={14}>
      <PH title="Fichas de Pacientes" sub={`${pacientes.length} pacientes cadastrados`} action={showAdd ? "Fechar" : "+ Novo Paciente"} N={N} onAction={() => setShowAdd(v => !v)} />
      {showAdd && (
        <Card title="Cadastrar Paciente">
          <Row gap={10}>
            <Field label="NOME COMPLETO" placeholder="Nome do paciente" value={fNome} onChange={setFNome} />
            <Field label="TELEFONE" placeholder="(11) 99999-9999" value={fTel} onChange={setFTel} />
            <Field label="E-MAIL" placeholder="email@exemplo.com" value={fEmail} onChange={setFEmail} />
          </Row>
          <Row gap={8} style={{ marginTop: 12, justifyContent: "flex-end" }}>
            <Btn onClick={() => setShowAdd(false)}>Cancelar</Btn>
            <Btn color={N.color} onClick={handleAddPaciente}>Salvar Paciente</Btn>
          </Row>
        </Card>
      )}
      <Card title="Lista de Pacientes">
        {pacientes.map(p => (
          <div key={p.id} style={{ borderBottom: `0.5px solid ${B.border}`, padding: "12px 0", display: "flex", alignItems: "center", gap: 12 }}>
            <Avatar name={p.nome} color={N.color} size={38} />
            <Col gap={3} style={{ flex: 1 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: B.text }}>{p.nome}</span>
              <Row gap={14}><span style={{ fontSize: 11, color: B.muted }}><Phone size={11} strokeWidth={1.8} /> {p.telefone}</span><span style={{ fontSize: 11, color: B.muted }}>Última visita: {p.ultimaVisita}</span></Row>
            </Col>
            <Row gap={6}>
              <Badge text={p.totalGasto} color={N.color} />
              <Btn sm color={N.color} onClick={() => setSelectedId(p.id)}>Ver Ficha →</Btn>
              <span onClick={() => setPacientes(prev => prev.filter(x => x.id !== p.id))} style={{ cursor: "pointer", color: B.red, fontSize: 15, fontWeight: 700, padding: "4px 6px" }}><X size={14} strokeWidth={2.2} /></span>
            </Row>
          </div>
        ))}
      </Card>
    </Col>
  );
};

// ── BARBEARIA-SPECIFIC ─────────────────────────────────────────────────────────

const FilaEspera = ({ N }) => {
  const [fila, setFila] = useState([
    { id: 1, name: N.clients[0], service: N.services[0][0], barber: N.pros[0], entrou: "08:45", tipo: "assinante" },
    { id: 2, name: N.clients[1], service: N.services[1][0], barber: "Qualquer", entrou: "09:02", tipo: "avulso" },
    { id: 3, name: N.clients[2], service: N.services[2 % N.services.length][0], barber: "Qualquer", entrou: "09:18", tipo: "avulso" },
  ]);
  const [atendidos, setAtendidos] = useState(28);

  useEffect(() => {
    if (!crmLoadClients("barbearia")) {
      const seed = N.clients.map((c, i) => ({
        id: i, nome: c, telefone: `(11) 9${9800 + i * 111}-${7777 - i * 111}`,
        totalGasto: ["R$ 2.840", "R$ 1.620", "R$ 980", "R$ 450"][i] || "R$ 0",
        visitas: [24, 14, 8, 3][i] || 0, ultimaVisita: ["28/05", "12/05", "03/04", "18/03"][i] || "—",
        obs: "", barbeiroPref: N.pros[i % N.pros.length],
        tipo: i < 2 ? "assinante" : "avulso", historico: [],
      }));
      crmSaveClients("barbearia", seed);
    }
  }, []);
  const [fNome, setFNome] = useState("");
  const [fServico, setFServico] = useState(N.services[0][0]);
  const [fBarbeiro, setFBarbeiro] = useState("Qualquer");
  const [fTipoFila, setFTipoFila] = useState("avulso");

  const handleEntrar = () => {
    if (!fNome.trim()) return;
    const now = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    setFila(prev => [...prev, { id: Date.now(), name: fNome.trim(), service: fServico, barber: fBarbeiro, entrou: now, tipo: fTipoFila }]);
    setFNome(""); setFTipoFila("avulso");
  };

  const handleAtender = (id) => {
    const item = fila.find(c => c.id === id);
    if (item) {
      const svcObj = N.services.find(s => s[0] === item.service);
      crmPushService("barbearia", item.name, {
        svc: item.service,
        barb: item.barber === "Qualquer" ? (N.pros[0] || "").split(" ")[0] : item.barber.split(" ")[0],
        val: svcObj ? svcObj[2] : "—",
      });
    }
    setFila(prev => prev.filter(c => c.id !== id));
    setAtendidos(v => v + 1);
  };

  return (
    <Col gap={14}>
      <PH title="Fila de Espera" sub="Clientes walk-in — atualizado em tempo real" N={N} />
      <Row gap={10}>
        <Stat label="Na fila agora" value={fila.length + ""} sub="aguardando" color={N.color} />
        <Stat label="Atendidos hoje" value={atendidos + ""} color={N.secondary} />
        <Stat label="Barbeiros" value={N.pros.length + ""} color={B.teal} />
      </Row>
      <Row gap={10} style={{ alignItems: "flex-start" }}>
        <Card title="Fila atual" style={{ flex: 2 }}>
          {fila.length === 0 && <div style={{ fontSize: 12, color: B.muted, padding: "12px 0" }}>Fila vazia — nenhum cliente aguardando.</div>}
          {fila.map((c, i) => (
            <div key={c.id} style={{ borderBottom: `0.5px solid ${B.border}`, padding: "12px 0", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: i === 0 ? N.color + "30" : B.border2, border: `0.5px solid ${i === 0 ? N.color : B.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: i === 0 ? N.color : B.muted, flexShrink: 0 }}>{i + 1}°</div>
              <Col gap={3} style={{ flex: 1 }}>
                <Row style={{ justifyContent: "space-between" }}>
                  <Row gap={8}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: B.text }}>{c.name}</span>
                    <Badge text={TIPO_CLIENTE[c.tipo]?.label || c.tipo} color={TIPO_CLIENTE[c.tipo]?.color || B.muted} />
                  </Row>
                  <Badge text={`Entrou ${c.entrou}`} color={B.muted} />
                </Row>
                <Row gap={10}><span style={{ fontSize: 11, color: B.muted }}>{c.service}</span><span style={{ fontSize: 11, color: B.muted, display: "flex", alignItems: "center", gap: 4 }}><User size={11} strokeWidth={1.8} /> {c.barber}</span></Row>
              </Col>
              <Row gap={6}>
                <Btn sm color={N.color} onClick={() => handleAtender(c.id)}><Check size={12} strokeWidth={2} /> Atender</Btn>
                <span onClick={() => setFila(prev => prev.filter(x => x.id !== c.id))} style={{ cursor: "pointer", color: B.red, fontSize: 15, fontWeight: 700, padding: "4px 6px" }}><X size={14} strokeWidth={2.2} /></span>
              </Row>
            </div>
          ))}
        </Card>
        <Col gap={10} style={{ flex: 1 }}>
          <Card title="Adicionar à fila">
            <Field label="NOME DO CLIENTE" placeholder="Nome" value={fNome} onChange={setFNome} />
            <Field label="SERVIÇO" type="select" value={fServico} onChange={setFServico} options={N.services.map(s => s[0])} />
            <Field label="BARBEIRO" type="select" value={fBarbeiro} onChange={setFBarbeiro} options={["Qualquer", ...N.pros]} />
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: B.muted, marginBottom: 8, letterSpacing: ".06em" }}>TIPO DE CLIENTE</div>
              <Row gap={8}>
                {Object.entries(TIPO_CLIENTE).map(([key, t]) => (
                  <div key={key} onClick={() => setFTipoFila(key)} style={{ flex: 1, padding: "8px 10px", borderRadius: 7, border: `1px solid ${fTipoFila === key ? t.color + "70" : B.border}`, background: fTipoFila === key ? t.color + "15" : B.bg2, cursor: "pointer", textAlign: "center", transition: "all .15s" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: fTipoFila === key ? t.color : B.muted }}>{t.label}</span>
                  </div>
                ))}
              </Row>
            </div>
            <div style={{ marginTop: 12 }}><Btn color={N.color} onClick={handleEntrar}>+ Entrar na fila</Btn></div>
          </Card>
          <Card title="Status dos Barbeiros">
            {N.pros.map((p, i) => (
              <Row key={i} style={{ justifyContent: "space-between", borderBottom: `0.5px solid ${B.border}`, padding: "10px 0" }}>
                <Row gap={8}><Avatar name={p} color={N.color} size={28} /><span style={{ fontSize: 12, color: B.text }}>{p}</span></Row>
                <Badge text={fila.find(c => c.barber === p) ? "Atendendo" : "Disponível"} color={fila.find(c => c.barber === p) ? B.amber : B.teal} />
              </Row>
            ))}
          </Card>
        </Col>
      </Row>
    </Col>
  );
};

const TIPO_CLIENTE = { assinante: { label: "Assinante", color: B.teal }, avulso: { label: "Avulso", color: B.amber } };

const FichaClienteBarb = ({ N }) => {
  const [clientes, setClientes] = useState(() => crmLoadClients("barbearia") || N.clients.map((c, i) => ({
    id: i, nome: c, telefone: `(11) 9${9800 + i * 111}-${7777 - i * 111}`,
    totalGasto: ["R$ 2.840", "R$ 1.620", "R$ 980", "R$ 450"][i] || "R$ 0",
    visitas: [24, 14, 8, 3][i] || 0, ultimaVisita: ["28/05", "12/05", "03/04", "18/03"][i] || "—",
    obs: "Gosta do franjão. Não corta muito curto nos lados.", barbeiroPref: N.pros[i % N.pros.length],
    tipo: i < 2 ? "assinante" : "avulso",
    historico: [{ data: "28/05", svc: N.services[0][0], barb: N.pros[0].split(" ")[0], val: N.services[0][2] }, { data: "10/05", svc: N.services[1][0], barb: N.pros[1].split(" ")[0], val: N.services[1][2] }],
  })));
  const [selectedId, setSelectedId] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [fNome, setFNome] = useState("");
  const [fTel, setFTel] = useState("");
  const [fTipo, setFTipo] = useState("avulso");
  const [regSvc, setRegSvc] = useState(N.services[0]?.[0] || "");
  const [regBarb, setRegBarb] = useState(N.pros[0] || "");
  const [regVal, setRegVal] = useState(N.services[0]?.[2] || "");

  useEffect(() => { crmSaveClients("barbearia", clientes); }, [clientes]);

  const handleAddCliente = () => {
    if (!fNome.trim()) return;
    setClientes(prev => [...prev, { id: Date.now(), nome: fNome.trim(), telefone: fTel, totalGasto: "R$ 0", visitas: 0, ultimaVisita: "—", obs: "", barbeiroPref: N.pros[0], tipo: fTipo, historico: [] }]);
    setFNome(""); setFTel(""); setFTipo("avulso"); setShowAdd(false);
  };

  const selected = clientes.find(c => c.id === selectedId);

  const handleAddVisita = () => {
    if (!regSvc || !selected) return;
    const today = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    setClientes(prev => prev.map(c => c.id === selectedId ? {
      ...c,
      historico: [{ data: today, svc: regSvc, barb: regBarb.split(" ")[0], val: regVal }, ...c.historico],
      visitas: c.visitas + 1,
      ultimaVisita: today,
    } : c));
  };

  if (selected) return (
    <Col gap={14}>
      <Row style={{ justifyContent: "space-between" }}>
        <Row gap={10}>
          <button onClick={() => setSelectedId(null)} style={{ background: "transparent", border: `0.5px solid ${B.border}`, color: B.muted, cursor: "pointer", fontSize: 12, padding: "6px 12px", borderRadius: 7, fontFamily: "inherit" }}>← Voltar</button>
          <Col gap={2}>
            <Row gap={8}>
              <span style={{ fontSize: 17, fontWeight: 700, color: B.text }}>{selected.nome}</span>
              <Badge text={TIPO_CLIENTE[selected.tipo].label} color={TIPO_CLIENTE[selected.tipo].color} />
            </Row>
            <span style={{ fontSize: 11, color: B.muted }}>{selected.telefone}</span>
          </Col>
        </Row>
        <Row gap={8}>
          <button
            onClick={() => setClientes(prev => prev.map(c => c.id === selectedId ? { ...c, tipo: c.tipo === "assinante" ? "avulso" : "assinante" } : c))}
            style={{ padding: "6px 12px", borderRadius: 7, border: `0.5px solid ${TIPO_CLIENTE[selected.tipo].color}60`, background: TIPO_CLIENTE[selected.tipo].color + "18", color: TIPO_CLIENTE[selected.tipo].color, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
          >
            Tornar {selected.tipo === "assinante" ? "Avulso" : "Assinante"}
          </button>
          <Btn danger onClick={() => { setClientes(prev => prev.filter(c => c.id !== selectedId)); setSelectedId(null); }}><Trash2 size={12} strokeWidth={1.8} /> Remover</Btn>
        </Row>
      </Row>
      <Row gap={10}><Stat label="Total gasto" value={selected.totalGasto} color={N.color} /><Stat label="Visitas" value={selected.visitas + ""} /><Stat label="Última visita" value={selected.ultimaVisita} /><Stat label="Tipo" value={TIPO_CLIENTE[selected.tipo].label} color={TIPO_CLIENTE[selected.tipo].color} /></Row>
      <Row gap={10} style={{ alignItems: "flex-start" }}>
        <Card title="Preferências" style={{ flex: 1 }}>
          <Field label="OBSERVAÇÕES" type="textarea" value={selected.obs} onChange={v => setClientes(prev => prev.map(c => c.id === selectedId ? { ...c, obs: v } : c))} />
          <Field label="BARBEIRO PREFERIDO" type="select" value={selected.barbeiroPref} onChange={v => setClientes(prev => prev.map(c => c.id === selectedId ? { ...c, barbeiroPref: v } : c))} options={N.pros} />
        </Card>
        <Col gap={10} style={{ flex: 1 }}>
          <Card title="Histórico de Visitas">
            {selected.historico.map((h, i) => (
              <div key={i} style={{ borderBottom: `0.5px solid ${B.border}`, padding: "8px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Col gap={1}><span style={{ fontSize: 12, color: B.text }}>{h.svc}</span><span style={{ fontSize: 10, color: B.muted }}>{h.data} · {h.barb} · {h.val}</span></Col>
                <span onClick={() => setClientes(prev => prev.map(c => c.id === selectedId ? { ...c, historico: c.historico.filter((_, idx) => idx !== i) } : c))} style={{ cursor: "pointer", color: B.red, fontSize: 14, fontWeight: 700 }}><X size={14} strokeWidth={2.2} /></span>
              </div>
            ))}
            <Col gap={8} style={{ marginTop: 12 }}>
              <Row gap={8}>
                <Field label="SERVIÇO" type="select" value={regSvc} onChange={v => { setRegSvc(v); const s = N.services.find(x => x[0] === v); if (s) setRegVal(s[2]); }} options={N.services.map(s => s[0])} />
                <Field label="BARBEIRO" type="select" value={regBarb} onChange={setRegBarb} options={N.pros} />
                <Field label="VALOR" value={regVal} onChange={setRegVal} />
              </Row>
              <div><Btn color={N.color} onClick={handleAddVisita}><CheckCircle size={12} strokeWidth={1.8} /> Registrar Visita</Btn></div>
            </Col>
          </Card>
        </Col>
      </Row>
    </Col>
  );

  return (
    <Col gap={14}>
      <PH title="Fichas de Clientes" sub={`${clientes.length} clientes · ${clientes.filter(c => c.tipo === "assinante").length} assinantes`} action={showAdd ? "Fechar" : "+ Novo Cliente"} N={N} onAction={() => setShowAdd(v => !v)} />
      <Row gap={10}>
        <Stat label="Assinantes" value={clientes.filter(c => c.tipo === "assinante").length + ""} color={B.teal} />
        <Stat label="Avulsos" value={clientes.filter(c => c.tipo === "avulso").length + ""} color={B.amber} />
        <Stat label="Total" value={clientes.length + ""} color={N.color} />
      </Row>
      {showAdd && (
        <Card title="Cadastrar Cliente">
          <Row gap={10}><Field label="NOME" placeholder="Nome do cliente" value={fNome} onChange={setFNome} /><Field label="TELEFONE" placeholder="(11) 99999-9999" value={fTel} onChange={setFTel} /></Row>
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
          <Row gap={8} style={{ marginTop: 14, justifyContent: "flex-end" }}><Btn onClick={() => setShowAdd(false)}>Cancelar</Btn><Btn color={N.color} onClick={handleAddCliente}>Salvar</Btn></Row>
        </Card>
      )}
      <Card title="Lista de Clientes">
        {clientes.map(c => (
          <div key={c.id} style={{ borderBottom: `0.5px solid ${B.border}`, padding: "12px 0", display: "flex", alignItems: "center", gap: 12 }}>
            <Avatar name={c.nome} color={TIPO_CLIENTE[c.tipo].color} size={38} />
            <Col gap={3} style={{ flex: 1 }}>
              <Row gap={8}>
                <span style={{ fontSize: 13, fontWeight: 600, color: B.text }}>{c.nome}</span>
                <Badge text={TIPO_CLIENTE[c.tipo].label} color={TIPO_CLIENTE[c.tipo].color} />
              </Row>
              <Row gap={14}><span style={{ fontSize: 11, color: B.muted }}><Phone size={11} strokeWidth={1.8} /> {c.telefone}</span><span style={{ fontSize: 11, color: B.muted }}>{c.visitas} visitas · última {c.ultimaVisita}</span></Row>
            </Col>
            <Row gap={6}>
              <Badge text={c.totalGasto} color={N.color} />
              <Btn sm color={N.color} onClick={() => setSelectedId(c.id)}>Ver Ficha →</Btn>
              <span onClick={() => setClientes(prev => prev.filter(x => x.id !== c.id))} style={{ cursor: "pointer", color: B.red, fontSize: 15, fontWeight: 700, padding: "4px 6px" }}><X size={14} strokeWidth={2.2} /></span>
            </Row>
          </div>
        ))}
      </Card>
    </Col>
  );
};

const Assinaturas = ({ N }) => {
  const PLAN_COLORS = [B.teal, N.color, B.amber];
  const [planos, setPlanos] = useState([
    { id: 1, name: "Plano Básico", price: "R$ 99/mês", priceVal: 99, svcs: ["Corte masculino ilimitado"], assinantes: N.clients.slice(0, 2).map((c, i) => ({ id: i, nome: c, vence: "01/07" })) },
    { id: 2, name: "Plano Premium", price: "R$ 149/mês", priceVal: 149, svcs: ["Corte masculino ilimitado", "Barba completa 2× mês"], assinantes: N.clients.slice(2, 4).map((c, i) => ({ id: i + 10, nome: c, vence: "15/07" })) },
    { id: 3, name: "Plano VIP", price: "R$ 199/mês", priceVal: 199, svcs: ["Corte ilimitado", "Barba ilimitada", "1 tratamento capilar/mês"], assinantes: [] },
  ]);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [showNewPlan, setShowNewPlan] = useState(false);
  const [newPlanNome, setNewPlanNome] = useState("");
  const [newPlanPreco, setNewPlanPreco] = useState("");
  const [newPlanSvcs, setNewPlanSvcs] = useState("");
  const [newAss, setNewAss] = useState("");

  const totalAssinantes = planos.reduce((s, p) => s + p.assinantes.length, 0);
  const mrr = planos.reduce((s, p) => s + p.priceVal * p.assinantes.length, 0);

  const handleAddPlano = () => {
    if (!newPlanNome.trim()) return;
    const val = parseFloat(newPlanPreco.replace(/[^\d,.]/g, "").replace(",", ".")) || 0;
    setPlanos(prev => [...prev, { id: Date.now(), name: newPlanNome.trim(), price: `R$ ${val}/mês`, priceVal: val, svcs: newPlanSvcs.split("\n").filter(Boolean), assinantes: [] }]);
    setNewPlanNome(""); setNewPlanPreco(""); setNewPlanSvcs(""); setShowNewPlan(false);
  };

  const handleAddAssinante = (planId) => {
    if (!newAss.trim()) return;
    const today = new Date(); today.setMonth(today.getMonth() + 1);
    const vence = today.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    setPlanos(prev => prev.map(p => p.id === planId ? { ...p, assinantes: [...p.assinantes, { id: Date.now(), nome: newAss.trim(), vence }] } : p));
    setNewAss("");
  };

  const selectedPlan = planos.find(p => p.id === selectedPlanId);

  if (selectedPlan) {
    const color = PLAN_COLORS[planos.indexOf(selectedPlan) % PLAN_COLORS.length];
    return (
      <Col gap={14}>
        <Row style={{ justifyContent: "space-between" }}>
          <Row gap={10}>
            <button onClick={() => setSelectedPlanId(null)} style={{ background: "transparent", border: `0.5px solid ${B.border}`, color: B.muted, cursor: "pointer", fontSize: 12, padding: "6px 12px", borderRadius: 7, fontFamily: "inherit" }}>← Voltar</button>
            <Col gap={1}><span style={{ fontSize: 17, fontWeight: 700, color: B.text }}>{selectedPlan.name}</span><span style={{ fontSize: 11, color }}>{ selectedPlan.price}</span></Col>
          </Row>
          <Btn danger onClick={() => { setPlanos(prev => prev.filter(p => p.id !== selectedPlanId)); setSelectedPlanId(null); }}><Trash2 size={12} strokeWidth={1.8} /> Remover Plano</Btn>
        </Row>
        <Row gap={10}><Stat label="Assinantes" value={selectedPlan.assinantes.length + ""} color={color} /><Stat label="Receita" value={`R$ ${(selectedPlan.priceVal * selectedPlan.assinantes.length).toLocaleString("pt-BR")}/mês`} color={B.teal} /></Row>
        <Row gap={10} style={{ alignItems: "flex-start" }}>
          <Card title="Serviços incluídos" style={{ flex: 1 }}>
            {selectedPlan.svcs.map((s, i) => (
              <Row key={i} style={{ justifyContent: "space-between", padding: "6px 0", borderBottom: `0.5px solid ${B.border}` }}>
                <span style={{ fontSize: 12, color: B.text }}><Check size={11} strokeWidth={2} /> {s}</span>
                <span onClick={() => setPlanos(prev => prev.map(p => p.id === selectedPlanId ? { ...p, svcs: p.svcs.filter((_, idx) => idx !== i) } : p))} style={{ cursor: "pointer", color: B.red, fontSize: 14, fontWeight: 700 }}><X size={14} strokeWidth={2.2} /></span>
              </Row>
            ))}
            <Row gap={8} style={{ marginTop: 10 }}>
              <Field placeholder="Novo serviço incluído" value={newAss === "__svc__" ? "" : ""} onChange={() => {}} />
              <Btn sm color={color} onClick={() => { const el = document.getElementById("newsvc"); if (el && el.value) { setPlanos(prev => prev.map(p => p.id === selectedPlanId ? { ...p, svcs: [...p.svcs, el.value] } : p)); el.value = ""; } }}>+</Btn>
            </Row>
            <input id="newsvc" placeholder="Novo serviço incluído" style={{ width: "100%", background: B.bg2, border: `0.5px solid ${B.border}`, color: B.text, fontSize: 12, padding: "8px 10px", borderRadius: 7, boxSizing: "border-box", fontFamily: "inherit", outline: "none" }} />
          </Card>
          <Card title="Assinantes" style={{ flex: 1 }}>
            {selectedPlan.assinantes.map((a) => (
              <Row key={a.id} style={{ justifyContent: "space-between", padding: "8px 0", borderBottom: `0.5px solid ${B.border}` }}>
                <Row gap={8}><Avatar name={a.nome} color={color} size={28} /><Col gap={1}><span style={{ fontSize: 11, color: B.text }}>{a.nome}</span><span style={{ fontSize: 10, color: B.muted }}>Vence {a.vence}</span></Col></Row>
                <span onClick={() => setPlanos(prev => prev.map(p => p.id === selectedPlanId ? { ...p, assinantes: p.assinantes.filter(x => x.id !== a.id) } : p))} style={{ cursor: "pointer", color: B.red, fontSize: 14, fontWeight: 700 }}><X size={14} strokeWidth={2.2} /></span>
              </Row>
            ))}
            <Row gap={8} style={{ marginTop: 10 }}>
              <Field placeholder="Nome do assinante" value={newAss} onChange={setNewAss} />
              <Btn sm color={color} onClick={() => handleAddAssinante(selectedPlanId)}>+ Adicionar</Btn>
            </Row>
          </Card>
        </Row>
      </Col>
    );
  }

  return (
    <Col gap={14}>
      <PH title="Assinaturas Mensais" sub="Gerencie planos e assinaturas recorrentes" action={showNewPlan ? "Fechar" : "+ Novo Plano"} N={N} onAction={() => setShowNewPlan(v => !v)} />
      <Row gap={10}>
        <Stat label="Assinantes ativos" value={totalAssinantes + ""} color={N.color} />
        <Stat label="Receita recorrente" value={`R$ ${mrr.toLocaleString("pt-BR")}/mês`} sub="MRR" color={N.secondary} />
        <Stat label="Planos ativos" value={planos.length + ""} color={B.teal} />
      </Row>
      {showNewPlan && (
        <Card title="Criar Novo Plano">
          <Row gap={10}><Field label="NOME DO PLANO" placeholder="Ex: Plano Plus" value={newPlanNome} onChange={setNewPlanNome} /><Field label="PREÇO MENSAL" placeholder="R$ 0,00" value={newPlanPreco} onChange={setNewPlanPreco} /></Row>
          <Field label="SERVIÇOS INCLUÍDOS (um por linha)" type="textarea" placeholder="Corte ilimitado\nBarba..." value={newPlanSvcs} onChange={setNewPlanSvcs} />
          <Row gap={8} style={{ marginTop: 12, justifyContent: "flex-end" }}><Btn onClick={() => setShowNewPlan(false)}>Cancelar</Btn><Btn color={N.color} onClick={handleAddPlano}>Criar Plano</Btn></Row>
        </Card>
      )}
      <Card title="Planos disponíveis">
        {planos.map((p, i) => {
          const color = PLAN_COLORS[i % PLAN_COLORS.length];
          return (
            <div key={p.id} style={{ borderBottom: `0.5px solid ${B.border}`, padding: "14px 0" }}>
              <Row style={{ justifyContent: "space-between", marginBottom: 8 }}>
                <Row gap={8}><div style={{ width: 8, height: 8, borderRadius: "50%", background: color, marginTop: 2 }} /><span style={{ fontSize: 13, fontWeight: 600, color: B.text }}>{p.name}</span></Row>
                <Row gap={8}><span style={{ fontSize: 14, fontWeight: 700, color }}>{p.price}</span><span onClick={() => setPlanos(prev => prev.filter(x => x.id !== p.id))} style={{ cursor: "pointer", color: B.red, fontSize: 14, fontWeight: 700 }}><X size={14} strokeWidth={2.2} /></span></Row>
              </Row>
              {p.svcs.map((s, j) => <div key={j} style={{ fontSize: 11, color: B.muted, marginBottom: 3 }}><Check size={11} strokeWidth={2} /> {s}</div>)}
              <Row style={{ justifyContent: "space-between", marginTop: 8 }}>
                <span style={{ fontSize: 11, color: B.muted }}>{p.assinantes.length} assinantes</span>
                <Btn sm color={color} onClick={() => setSelectedPlanId(p.id)}>Ver membros →</Btn>
              </Row>
            </div>
          );
        })}
      </Card>
    </Col>
  );
};

// ── MECÂNICA-SPECIFIC ──────────────────────────────────────────────────────────

const STATUS_OS = ["Aberta", "Em andamento", "Aguardando peça", "Pronto para entrega", "Concluído", "Cancelado"];
const STATUS_COLOR = { "Aberta": "#68748A", "Em andamento": "#EFA420", "Aguardando peça": "#E84040", "Pronto para entrega": "#0FB884", "Concluído": "#22C55E", "Cancelado": "#3D4455" };

const OSDetail = ({ os, N, onBack, onUpdate, onRemove }) => {
  const [status, setStatus] = useState(os.status);
  const [servicos, setServicos] = useState(os.servicos);
  const [mec, setMec] = useState(os.mec);
  const [km, setKm] = useState(os.km);
  const [moDeObra, setMoDeObra] = useState(os.moDeObra);
  const [obs, setObs] = useState(os.obs);
  const [pecas, setPecas] = useState(os.pecas);
  const [nomePeca, setNomePeca] = useState("");
  const [valorPeca, setValorPeca] = useState("");

  const totalPecas = pecas.reduce((s, p) => s + (parseFloat(p.valor) || 0), 0);
  const totalOS = totalPecas + (parseFloat(moDeObra) || 0);

  const handleSave = () => {
    onUpdate({ ...os, status, servicos, mec, km, moDeObra, obs, pecas });
  };

  const handleAddPeca = () => {
    if (!nomePeca.trim() || !valorPeca) return;
    setPecas(prev => [...prev, { nome: nomePeca.trim(), valor: parseFloat(valorPeca) }]);
    setNomePeca("");
    setValorPeca("");
  };

  const sc = STATUS_COLOR[status] || B.muted;

  return (
    <Col gap={14}>
      {/* Header */}
      <Row style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        <Row gap={10}>
          <button onClick={onBack} style={{ background: "transparent", border: `0.5px solid ${B.border}`, color: B.muted, cursor: "pointer", fontSize: 12, padding: "6px 12px", borderRadius: 7, fontFamily: "inherit" }}>← Voltar</button>
          <Col gap={2}>
            <Row gap={10}>
              <span style={{ fontSize: 18, fontWeight: 700, color: B.text }}>{os.id}</span>
              <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: sc + "25", color: sc, border: `0.5px solid ${sc}` }}>{status}</span>
            </Row>
            <span style={{ fontSize: 12, color: B.muted, display: "flex", alignItems: "center", gap: 5 }}>Aberta em {os.data} · {os.client} · <Car size={12} strokeWidth={1.8} /> {os.veiculo} {os.placa}</span>
          </Col>
        </Row>
        <Row gap={8}>
          <Btn color={N.color} onClick={handleSave}><Save size={12} strokeWidth={1.8} /> Salvar OS</Btn>
          <Btn danger onClick={() => { onRemove(os.id); onBack(); }}><Trash2 size={12} strokeWidth={1.8} /> Remover</Btn>
        </Row>
      </Row>

      <Row gap={10} style={{ alignItems: "flex-start" }}>
        {/* Coluna principal */}
        <Col gap={10} style={{ flex: 2 }}>
          {/* Status + mecânico + KM */}
          <Card title="Informações da OS">
            <Row gap={10}>
              <Col gap={5} style={{ flex: 1 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: B.muted, letterSpacing: ".04em" }}>STATUS</div>
                <select value={status} onChange={e => setStatus(e.target.value)}
                  style={{ height: 34, background: sc + "18", border: `1px solid ${sc}60`, borderRadius: 7, padding: "0 10px", fontSize: 11, color: sc, fontFamily: "inherit", fontWeight: 600, outline: "none" }}>
                  {STATUS_OS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </Col>
              <Field label="MECÂNICO RESPONSÁVEL" type="select" value={mec} onChange={setMec} options={N.pros} />
              <Field label="KM ATUAL" value={km} onChange={setKm} />
            </Row>
          </Card>

          {/* Serviços */}
          <Card title="Serviços a Realizar">
            <textarea value={servicos} onChange={e => setServicos(e.target.value)}
              style={{ width: "100%", minHeight: 90, background: B.bg2, border: `0.5px solid ${B.border2}`, borderRadius: 7, padding: "10px 12px", fontSize: 12, color: B.text, fontFamily: "inherit", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
          </Card>

          {/* Peças */}
          <Card title="Peças Utilizadas">
            {pecas.length === 0 && <div style={{ fontSize: 11, color: B.muted, padding: "8px 0" }}>Nenhuma peça adicionada.</div>}
            {pecas.map((p, i) => (
              <Row key={i} style={{ justifyContent: "space-between", padding: "8px 0", borderBottom: `0.5px solid ${B.border}` }}>
                <span style={{ fontSize: 12, color: B.text }}>{p.nome}</span>
                <Row gap={10}>
                  <span style={{ fontSize: 12, color: N.secondary, fontWeight: 600 }}>R$ {parseFloat(p.valor).toFixed(2).replace(".", ",")}</span>
                  <span onClick={() => setPecas(prev => prev.filter((_, idx) => idx !== i))} style={{ cursor: "pointer", color: B.red, fontSize: 15, fontWeight: 700, userSelect: "none" }} title="Remover"><X size={14} strokeWidth={2.2} /></span>
                </Row>
              </Row>
            ))}
            <Row gap={8} style={{ marginTop: 10 }}>
              <Field label="NOME DA PEÇA" placeholder="Ex: Filtro de óleo" value={nomePeca} onChange={setNomePeca} />
              <Field label="VALOR (R$)" placeholder="0,00" value={valorPeca} onChange={setValorPeca} />
              <Col gap={5} style={{ justifyContent: "flex-end" }}>
                <div style={{ fontSize: 10, color: "transparent" }}>.</div>
                <Btn color={N.color} onClick={handleAddPeca}>+ Peça</Btn>
              </Col>
            </Row>
          </Card>

          {/* Observações */}
          <Card title="Observações Técnicas">
            <textarea value={obs} onChange={e => setObs(e.target.value)} placeholder="Descreva observações técnicas, defeitos encontrados, recomendações..." rows={4}
              style={{ width: "100%", background: B.bg2, border: `0.5px solid ${B.border2}`, borderRadius: 7, padding: "10px 12px", fontSize: 12, color: B.text, fontFamily: "inherit", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
          </Card>
        </Col>

        {/* Coluna lateral */}
        <Col gap={10} style={{ flex: 1 }}>
          {/* Resumo financeiro */}
          <Card title="Resumo Financeiro">
            <Col gap={6}>
              <Row style={{ justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: B.muted }}>Total em peças</span>
                <span style={{ fontSize: 12, color: B.text, fontWeight: 600 }}>R$ {totalPecas.toFixed(2).replace(".", ",")}</span>
              </Row>
              <Row style={{ justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: B.muted }}>Mão de obra</span>
                <input value={moDeObra} onChange={e => setMoDeObra(e.target.value)} placeholder="0,00"
                  style={{ width: 90, height: 28, background: B.bg2, border: `0.5px solid ${B.border2}`, borderRadius: 6, padding: "0 8px", fontSize: 12, color: B.text, outline: "none", textAlign: "right", fontFamily: "inherit" }} />
              </Row>
              <Divider />
              <Row style={{ justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: B.text }}>Total OS</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: N.secondary }}>R$ {totalOS.toFixed(2).replace(".", ",")}</span>
              </Row>
            </Col>
            <div style={{ marginTop: 14 }}><Btn color={N.secondary} onClick={handleSave}><Check size={12} strokeWidth={2} /> Finalizar e Cobrar</Btn></div>
          </Card>

          {/* Dados do veículo */}
          <Card title="Dados do Veículo">
            {[["Cliente", os.client], ["Veículo", os.veiculo], ["Placa", os.placa], ["KM entrada", km]].map(([k, v]) => (
              <Row key={k} style={{ justifyContent: "space-between", borderBottom: `0.5px solid ${B.border}`, padding: "6px 0" }}>
                <span style={{ fontSize: 11, color: B.muted }}>{k}</span>
                <span style={{ fontSize: 11, color: B.text, fontWeight: 500 }}>{v}</span>
              </Row>
            ))}
          </Card>

          {/* Assinatura */}
          <Card title="Assinatura do Cliente">
            <div style={{ height: 80, background: B.bg2, border: `1px dashed ${N.color}50`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 4, color: B.dim }}>
              <PenLine size={20} strokeWidth={1.8} />
              <span style={{ fontSize: 10 }}>Área de assinatura</span>
            </div>
            <div style={{ marginTop: 8 }}><Btn sm color={N.color}>Solicitar assinatura digital</Btn></div>
          </Card>
        </Col>
      </Row>
    </Col>
  );
};

const OS_DEFAULT = (N) => [
  { id: "OS-0248", client: N.clients[0], veiculo: "Honda Civic 2019", placa: "ABC-1234", km: "68.420", servicos: "Revisão completa + troca de pastilhas de freio", mec: N.pros[0], status: "Em andamento", pecas: [{ nome: "Óleo 5W30 4L", valor: 72 }, { nome: "Filtro de óleo", valor: 24 }, { nome: "Pastilha de freio", valor: 85 }], moDeObra: 200, obs: "", data: "28/05" },
  { id: "OS-0247", client: N.clients[1], veiculo: "Toyota Corolla 2020", placa: "DEF-5678", km: "52.100", servicos: "Troca de óleo + filtros", mec: N.pros[1], status: "Aguardando peça", pecas: [{ nome: "Óleo 5W30 4L", valor: 72 }, { nome: "Filtro de ar", valor: 32 }], moDeObra: 80, obs: "Aguardando filtro de cabine.", data: "27/05" },
  { id: "OS-0246", client: N.clients[2], veiculo: "VW Polo 2021", placa: "GHI-9012", km: "31.800", servicos: "Alinhamento + balanceamento", mec: N.pros[2], status: "Pronto para entrega", pecas: [], moDeObra: 140, obs: "", data: "26/05" },
];

const OrdemServico = ({ N }) => {
  const [ordens, setOrdens] = useState(() => {
    try { return JSON.parse(localStorage.getItem("crm_os_mecanica") || "null") || OS_DEFAULT(N); }
    catch { return OS_DEFAULT(N); }
  });

  useEffect(() => {
    try { localStorage.setItem("crm_os_mecanica", JSON.stringify(ordens)); } catch {}
  }, [ordens]);
  const [selectedId, setSelectedId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  // Criar OS form
  const nextNum = () => "OS-" + String(Math.max(...ordens.map(o => parseInt(o.id.replace("OS-", ""))), 248) + 1).padStart(4, "0");
  const [fCliente, setFCliente] = useState(N.clients[0]);
  const [fVeiculo, setFVeiculo] = useState("");
  const [fPlaca, setFPlaca] = useState("");
  const [fKm, setFKm] = useState("");
  const [fServicos, setFServicos] = useState("");
  const [fMec, setFMec] = useState(N.pros[0]);

  const handleCreate = () => {
    if (!fVeiculo.trim() || !fServicos.trim()) return;
    const today = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    const nova = { id: nextNum(), client: fCliente, veiculo: fVeiculo.trim(), placa: fPlaca.trim(), km: fKm.trim(), servicos: fServicos.trim(), mec: fMec, status: "Aberta", pecas: [], moDeObra: 0, obs: "", data: today };
    setOrdens(prev => [nova, ...prev]);
    setFVeiculo(""); setFPlaca(""); setFKm(""); setFServicos("");
    setShowCreate(false);
    setSelectedId(nova.id);
  };

  const handleUpdate = (updated) => setOrdens(prev => prev.map(o => o.id === updated.id ? updated : o));
  const handleRemove = (id) => setOrdens(prev => prev.filter(o => o.id !== id));

  const selected = ordens.find(o => o.id === selectedId);

  if (selected) {
    return <OSDetail os={selected} N={N} onBack={() => setSelectedId(null)} onUpdate={handleUpdate} onRemove={handleRemove} />;
  }

  const abertas = ordens.filter(o => !["Concluído", "Cancelado"].includes(o.status)).length;
  const concluidas = ordens.filter(o => o.status === "Concluído").length;

  return (
    <Col gap={14}>
      <PH title="Ordens de Serviço" sub="Gerencie todas as OS da oficina" action={showCreate ? "Fechar" : "+ Nova OS"} N={N} onAction={() => setShowCreate(v => !v)} />
      <Row gap={10}>
        <Stat label="OS abertas" value={abertas + ""} color={B.amber} />
        <Stat label="Concluídas (mês)" value={concluidas + ""} color={N.secondary} />
        <Stat label="Total de OS" value={ordens.length + ""} color={N.color} />
        <Stat label="Faturamento estimado" value={"R$ " + ordens.reduce((s, o) => s + o.pecas.reduce((ps, p) => ps + (parseFloat(p.valor) || 0), 0) + (parseFloat(o.moDeObra) || 0), 0).toLocaleString("pt-BR")} color={N.secondary} />
      </Row>

      {showCreate && (
        <Card title="Nova Ordem de Serviço">
          <Row gap={10}>
            <Field label="CLIENTE" type="select" value={fCliente} onChange={setFCliente} options={N.clients} />
            <Field label="VEÍCULO (modelo/ano)" placeholder="Ex: Honda Civic 2019" value={fVeiculo} onChange={setFVeiculo} />
            <Field label="PLACA" placeholder="ABC-1234" value={fPlaca} onChange={setFPlaca} />
            <Field label="KM ATUAL" placeholder="0" value={fKm} onChange={setFKm} />
            <Field label="MECÂNICO" type="select" value={fMec} onChange={setFMec} options={N.pros} />
          </Row>
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: B.muted, marginBottom: 6 }}>SERVIÇOS A REALIZAR</div>
            <textarea value={fServicos} onChange={e => setFServicos(e.target.value)} placeholder="Descreva os serviços..." rows={3}
              style={{ width: "100%", background: B.bg2, border: `0.5px solid ${B.border2}`, borderRadius: 7, padding: "10px 12px", fontSize: 12, color: B.text, fontFamily: "inherit", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
          </div>
          <Row gap={8} style={{ marginTop: 12, justifyContent: "flex-end" }}>
            <Btn onClick={() => setShowCreate(false)}>Cancelar</Btn>
            <Btn color={N.color} onClick={handleCreate}>Abrir OS →</Btn>
          </Row>
        </Card>
      )}

      <Card title="Ordens de Serviço">
        {ordens.length === 0 && <div style={{ fontSize: 12, color: B.muted, padding: "12px 0" }}>Nenhuma OS criada.</div>}
        {ordens.map((o) => {
          const sc = STATUS_COLOR[o.status] || B.muted;
          const total = o.pecas.reduce((s, p) => s + (parseFloat(p.valor) || 0), 0) + (parseFloat(o.moDeObra) || 0);
          return (
            <div key={o.id} style={{ borderBottom: `0.5px solid ${B.border}`, padding: "14px 0", display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div style={{ padding: "4px 10px", background: sc + "20", border: `0.5px solid ${sc}60`, borderRadius: 6, fontSize: 10, fontWeight: 700, color: sc, flexShrink: 0, minWidth: 64, textAlign: "center" }}>{o.id}</div>
              <Col gap={4} style={{ flex: 1 }}>
                <Row style={{ justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: B.text }}>{o.client}</span>
                  <span style={{ padding: "2px 10px", borderRadius: 6, fontSize: 10, fontWeight: 600, background: sc + "20", color: sc, border: `0.5px solid ${sc}` }}>{o.status}</span>
                </Row>
                <Row gap={14}>
                  <span style={{ fontSize: 11, color: B.muted, display: "flex", alignItems: "center", gap: 4 }}><Car size={11} strokeWidth={1.8} /> {o.veiculo} · {o.placa}</span>
                  <span style={{ fontSize: 11, color: B.muted, display: "flex", alignItems: "center", gap: 4 }}><Wrench size={11} strokeWidth={1.8} /> {o.mec}</span>
                  <span style={{ fontSize: 11, color: B.muted, display: "flex", alignItems: "center", gap: 4 }}><Calendar size={11} strokeWidth={1.8} /> {o.data}</span>
                </Row>
                <span style={{ fontSize: 11, color: B.muted, fontStyle: "italic" }}>{o.servicos.length > 60 ? o.servicos.slice(0, 60) + "…" : o.servicos}</span>
                {total > 0 && <span style={{ fontSize: 11, color: N.secondary, fontWeight: 600 }}>Total: R$ {total.toFixed(2).replace(".", ",")}</span>}
              </Col>
              <Row gap={6}>
                <Btn sm color={N.color} onClick={() => setSelectedId(o.id)}>Abrir OS →</Btn>
                <span onClick={() => handleRemove(o.id)} style={{ cursor: "pointer", color: B.red, fontSize: 15, fontWeight: 700, userSelect: "none", padding: "4px 8px" }} title="Remover OS"><X size={14} strokeWidth={2.2} /></span>
              </Row>
            </div>
          );
        })}
      </Card>
    </Col>
  );
};

const FichaVeiculo = ({ N }) => {
  const [ordens, setOrdens] = useState(() => {
    try { return JSON.parse(localStorage.getItem("crm_os_mecanica") || "null") || OS_DEFAULT(N); }
    catch { return OS_DEFAULT(N); }
  });
  const [selectedClient, setSelectedClient] = useState(null);
  const [regSvc, setRegSvc] = useState(N.services[0]?.[0] || "");
  const [regMec, setRegMec] = useState(N.pros[0] || "");
  const [regVal, setRegVal] = useState("");

  const clientMap = {};
  ordens.forEach(o => {
    if (!clientMap[o.client]) clientMap[o.client] = { nome: o.client, veiculo: o.veiculo, placa: o.placa, km: o.km, ordens: [] };
    clientMap[o.client].ordens.push(o);
    clientMap[o.client].veiculo = o.veiculo;
    clientMap[o.client].placa = o.placa;
    clientMap[o.client].km = o.km;
  });
  const clientes = Object.values(clientMap);
  const selected = selectedClient ? clientMap[selectedClient] : null;

  const handleRegSvc = () => {
    if (!regSvc || !selectedClient) return;
    const today = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    const nova = { id: `OS-R${Date.now()}`, client: selectedClient, veiculo: selected?.veiculo || "—", placa: selected?.placa || "—", km: selected?.km || "—", servicos: regSvc, mec: regMec, status: "Concluído", pecas: [], moDeObra: parseFloat(regVal.replace(",", ".")) || 0, obs: "", data: today };
    const updated = [nova, ...ordens];
    setOrdens(updated);
    try { localStorage.setItem("crm_os_mecanica", JSON.stringify(updated)); } catch {}
    setRegVal("");
  };

  if (selected) {
    const totalGasto = selected.ordens.reduce((s, o) => s + o.pecas.reduce((ps, p) => ps + (parseFloat(p.valor) || 0), 0) + (parseFloat(o.moDeObra) || 0), 0);
    return (
      <Col gap={14}>
        <Row style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
          <Row gap={10}>
            <button onClick={() => setSelectedClient(null)} style={{ background: "transparent", border: `0.5px solid ${B.border}`, color: B.muted, cursor: "pointer", fontSize: 12, padding: "6px 12px", borderRadius: 7, fontFamily: "inherit" }}>← Voltar</button>
            <Col gap={2}>
              <span style={{ fontSize: 17, fontWeight: 700, color: B.text }}>{selected.nome}</span>
              <span style={{ fontSize: 11, color: B.muted, display: "flex", alignItems: "center", gap: 5 }}><Car size={11} strokeWidth={1.8} /> {selected.veiculo} · <Badge text={selected.placa} color={N.color} /></span>
            </Col>
          </Row>
        </Row>
        <Row gap={10}>
          <Stat label="Total em OS" value={`R$ ${totalGasto.toFixed(2).replace(".", ",")}`} color={N.color} />
          <Stat label="Ordens de Serviço" value={selected.ordens.length + ""} />
          <Stat label="Última OS" value={selected.ordens[0]?.data || "—"} />
          <Stat label="KM registrado" value={selected.km || "—"} />
        </Row>
        <Row gap={10} style={{ alignItems: "flex-start" }}>
          <Col gap={10} style={{ flex: 2 }}>
            <Card title="Registrar Serviço na Ficha">
              <Row gap={10}>
                <Field label="SERVIÇO REALIZADO" type="select" value={regSvc} onChange={setRegSvc} options={N.services.map(s => s[0])} />
                <Field label="MECÂNICO" type="select" value={regMec} onChange={setRegMec} options={N.pros} />
                <Field label="VALOR MÃO DE OBRA (R$)" placeholder="0,00" value={regVal} onChange={setRegVal} />
              </Row>
              <div style={{ marginTop: 10 }}><Btn color={N.color} onClick={handleRegSvc}><CheckCircle size={12} strokeWidth={1.8} /> Registrar na Ficha</Btn></div>
            </Card>
            <Card title="Histórico de Serviços">
              {selected.ordens.length === 0 && <div style={{ fontSize: 12, color: B.muted, padding: "8px 0" }}>Nenhuma OS registrada.</div>}
              <Table cols={["OS", "DATA", "SERVIÇO", "MECÂNICO", "STATUS", "TOTAL"]} rows={selected.ordens.map(o => {
                const total = o.pecas.reduce((s, p) => s + (parseFloat(p.valor) || 0), 0) + (parseFloat(o.moDeObra) || 0);
                const sc = STATUS_COLOR[o.status] || B.muted;
                return [o.id, o.data, o.servicos.length > 35 ? o.servicos.slice(0, 35) + "…" : o.servicos, o.mec, <Badge text={o.status} color={sc} />, `R$ ${total.toFixed(2).replace(".", ",")}`];
              })} />
            </Card>
          </Col>
          <Col gap={10} style={{ flex: 1 }}>
            <Card title="Dados do Veículo">
              {[["Cliente", selected.nome], ["Veículo", selected.veiculo], ["Placa", selected.placa], ["KM", selected.km], ["Total de OS", selected.ordens.length + ""]].map(([k, v]) => (
                <Row key={k} style={{ justifyContent: "space-between", borderBottom: `0.5px solid ${B.border}`, padding: "6px 0" }}>
                  <span style={{ fontSize: 11, color: B.muted }}>{k}</span>
                  <span style={{ fontSize: 11, color: B.text, fontWeight: 500 }}>{v}</span>
                </Row>
              ))}
            </Card>
            <Card title="Documentos">
              <Btn sm color={N.color} onClick={() => makePDF(N.name, N.name, [{ title: `Histórico — ${selected.nome}`, columns: ["OS", "Data", "Serviço", "Mecânico", "Total"], rows: selected.ordens.map(o => { const t = o.pecas.reduce((s, p) => s + (parseFloat(p.valor) || 0), 0) + (parseFloat(o.moDeObra) || 0); return [o.id, o.data, o.servicos, o.mec, `R$ ${t.toFixed(2).replace(".", ",")}`]; }) }])}><FileText size={12} strokeWidth={1.8} /> Histórico PDF</Btn>
            </Card>
          </Col>
        </Row>
      </Col>
    );
  }

  return (
    <Col gap={14}>
      <PH title="Fichas de Veículos" sub={`${clientes.length} veículos cadastrados`} N={N} />
      {clientes.length === 0 && (
        <Card>
          <div style={{ padding: "24px 0", textAlign: "center", color: B.muted, fontSize: 13 }}>Nenhum veículo cadastrado ainda. Crie uma OS na tela de Ordens de Serviço para registrar automaticamente.</div>
        </Card>
      )}
      {clientes.length > 0 && (
        <Card title="Lista de Veículos / Clientes">
          {clientes.map((c, i) => {
            const total = c.ordens.reduce((s, o) => s + o.pecas.reduce((ps, p) => ps + (parseFloat(p.valor) || 0), 0) + (parseFloat(o.moDeObra) || 0), 0);
            return (
              <div key={i} style={{ borderBottom: `0.5px solid ${B.border}`, padding: "12px 0", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: N.color + "20", border: `0.5px solid ${N.color}60`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Car size={20} color={N.color} strokeWidth={1.5} /></div>
                <Col gap={3} style={{ flex: 1 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: B.text }}>{c.nome}</span>
                  <Row gap={10}>
                    <span style={{ fontSize: 11, color: B.muted, display: "flex", alignItems: "center", gap: 4 }}><Car size={11} strokeWidth={1.8} /> {c.veiculo}</span>
                    <Badge text={c.placa} color={N.secondary} />
                  </Row>
                </Col>
                <Row gap={6}>
                  <Badge text={`R$ ${total.toFixed(0)} total`} color={N.color} />
                  <Badge text={c.ordens.length + " OS"} color={N.secondary} />
                  <Btn sm color={N.color} onClick={() => setSelectedClient(c.nome)}>Ver Ficha →</Btn>
                </Row>
              </div>
            );
          })}
        </Card>
      )}
    </Col>
  );
};

const Orcamentos = ({ N }) => (
  <Col gap={14}>
    <PH title="Orçamentos" sub="Crie, envie e acompanhe aprovações de orçamentos" action="+ Novo Orçamento" N={N} />
    <Row gap={10}>
      <Stat label="Orçamentos enviados (mês)" value="28" color={N.color} />
      <Stat label="Aprovados" value="19" sub="67,8% de aprovação" color={N.secondary} />
      <Stat label="Valor aprovado" value="R$ 34.200" color={N.secondary} />
      <Stat label="Aguardando resposta" value="6" color={B.amber} />
    </Row>
    <Row gap={10} style={{ alignItems: "flex-start" }}>
      <Card title="Orçamentos recentes" style={{ flex: 2 }}>
        <Table
          cols={["Nº", "CLIENTE", "VEÍCULO", "SERVIÇO", "VALOR", "STATUS", "AÇÕES"]}
          rows={[
            ["#082", N.clients[0], "Civic 2019", "Revisão completa", "R$ 580", <Badge text="Aprovado" color={B.teal} />, "···"],
            ["#081", N.clients[1], "Corolla 2020", "Pastilhas freio", "R$ 320", <Badge text="Aguardando" color={B.amber} />, "···"],
            ["#080", N.clients[2], "Polo 2021", "Alinhamento", "R$ 160", <Badge text="Aprovado" color={B.teal} />, "···"],
            ["#079", N.clients[3], "Argo 2022", "Diagnóstico", "R$ 120", <Badge text="Recusado" color={B.red} />, "···"],
          ]}
        />
      </Card>
      <Card title="Criar Orçamento" style={{ flex: 1 }}>
        <Field label="CLIENTE" type="select" value={N.clients[0]} />
        <Field label="VEÍCULO" type="select" value="Honda Civic 2019" />
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: B.muted, marginBottom: 8 }}>ITENS DO ORÇAMENTO</div>
          <Col gap={6}>
            {[["Mão de obra — Revisão", "R$ 380"], ["Óleo Motor 5W30 (4L)", "R$ 72"], ["Filtro de óleo", "R$ 24"], ["Pastilha de freio (diant.)", "R$ 104"]].map(([d, v], i) => (
              <Row key={i} style={{ justifyContent: "space-between", padding: "6px 8px", background: B.bg2, borderRadius: 6, border: `0.5px solid ${B.border}` }}>
                <span style={{ fontSize: 11, color: B.text }}>{d}</span>
                <Row gap={6}><span style={{ fontSize: 11, color: B.muted }}>{v}</span><span style={{ fontSize: 12, color: B.dim }}>×</span></Row>
              </Row>
            ))}
            <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 10, background: N.color + "20", color: N.color, border: `0.5px solid ${N.color}`, cursor: "pointer", textAlign: "center" }}>+ Adicionar item</span>
          </Col>
        </div>
        <div style={{ marginTop: 10, padding: 10, background: B.bg2, borderRadius: 8, border: `0.5px solid ${B.border}` }}>
          <Row style={{ justifyContent: "space-between" }}><span style={{ fontSize: 11, color: B.muted }}>Subtotal</span><span style={{ fontSize: 11, color: B.text }}>R$ 580,00</span></Row>
          <Row style={{ justifyContent: "space-between", marginTop: 4 }}><span style={{ fontSize: 11, color: B.muted }}>Desconto</span><span style={{ fontSize: 11, color: B.text }}>R$ 0,00</span></Row>
          <Divider />
          <Row style={{ justifyContent: "space-between" }}><span style={{ fontSize: 12, fontWeight: 700, color: B.text }}>Total</span><span style={{ fontSize: 14, fontWeight: 700, color: N.secondary }}>R$ 580,00</span></Row>
        </div>
        <Field label="VALIDADE DO ORÇAMENTO" value="3 dias" />
        <Row gap={8} style={{ marginTop: 10 }}>
          <Btn color={N.color}>Enviar por WhatsApp</Btn>
          <Btn>Enviar por E-mail</Btn>
        </Row>
      </Card>
    </Row>
  </Col>
);



// ── LEMBRETES & REMARKETING (todas as verticais) ───────────────────────────────
const Lembretes = ({ N }) => {
  const [lembretes, setLembretes] = useState([
    { client: N.clients[0], service: N.services[0][0], date: "Hoje", tipo: "Retorno de procedimento", cor: B.amber },
    { client: N.clients[1], service: N.services[1][0], date: "Amanhã", tipo: "Retorno automático", cor: N.color },
    { client: N.clients[2], service: N.services[2 % N.services.length][0], date: "12/06", tipo: "Remarketing — inativo", cor: N.secondary },
    { client: N.clients[3 % N.clients.length], service: N.services[0][0], date: "15/06", tipo: "Aniversário", cor: B.amber },
  ]);
  const [novoCliente, setNovoCliente] = useState(N.clients[0]);
  const [novoServico, setNovoServico] = useState(N.services[0][0]);
  const [novaData, setNovaData] = useState("");
  const [novaMensagem, setNovaMensagem] = useState("");

  const handleCriar = () => {
    if (!novaData) return;
    setLembretes(prev => [...prev, { client: novoCliente, service: novoServico, date: novaData, tipo: "Manual", cor: N.color }]);
    setNovaData("");
    setNovaMensagem("");
  };

  return (
    <Col gap={14}>
      <PH title="Lembretes & Remarketing" sub="Automatize o relacionamento e retenção de clientes" N={N} />
      <Row gap={10}>
        <Stat label="Lembretes agendados" value={lembretes.length + ""} color={N.color} />
        <Stat label="Para hoje" value={lembretes.filter(l => l.date === "Hoje").length + ""} sub="a enviar" color={B.amber} />
        <Stat label={`${N.clientsLabel} inativos`} value="7" sub="+90 dias sem visita" color={B.red} />
        <Stat label="Disparados (30d)" value="18" color={N.secondary} />
      </Row>
      <Row gap={10} style={{ alignItems: "flex-start" }}>
        <Col gap={10} style={{ flex: 2 }}>
          <Card title="Lembretes Agendados">
            {lembretes.length === 0 && <div style={{ fontSize: 12, color: B.muted, padding: "12px 0" }}>Nenhum lembrete agendado.</div>}
            {lembretes.map((r, i) => (
              <div key={i} style={{ borderBottom: `0.5px solid ${B.border}`, padding: "12px 0", display: "flex", alignItems: "flex-start", gap: 12 }}>
                <Avatar name={r.client} color={r.cor} size={32} />
                <Col gap={3} style={{ flex: 1 }}>
                  <Row style={{ justifyContent: "space-between" }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: B.text }}>{r.client}</span>
                    <Row gap={8}>
                      <Badge text={r.date} color={r.date === "Hoje" ? B.amber : B.muted} />
                      <span onClick={() => setLembretes(prev => prev.filter((_, idx) => idx !== i))} style={{ cursor: "pointer", color: B.red, fontSize: 15, fontWeight: 700, userSelect: "none" }} title="Remover"><X size={14} strokeWidth={2.2} /></span>
                    </Row>
                  </Row>
                  <span style={{ fontSize: 11, color: B.muted }}>{r.service} — {r.tipo}</span>
                </Col>
                <Row gap={5}><Btn sm color={N.color}>Enviar</Btn></Row>
              </div>
            ))}
            {lembretes.filter(l => l.date === "Hoje").length > 0 && (
              <div style={{ marginTop: 12 }}><Btn color={N.color}><MessageSquare size={12} strokeWidth={1.8} /> Enviar todos de hoje ({lembretes.filter(l => l.date === "Hoje").length})</Btn></div>
            )}
          </Card>
        </Col>
        <Col gap={10} style={{ flex: 1 }}>
          <Card title="Criar Lembrete">
            <Field label={N.clientLabel.toUpperCase()} type="select" value={novoCliente} onChange={setNovoCliente} options={N.clients} />
            <Field label={N.serviceLabel.toUpperCase()} type="select" value={novoServico} onChange={setNovoServico} options={N.services.map(s => s[0])} />
            <Field label="DATA" value={novaData} onChange={setNovaData} />
            <Field label="MENSAGEM" type="textarea" value={novaMensagem} onChange={setNovaMensagem} placeholder={`Olá {nome}, lembrete do seu ${novoServico}!`} />
            <div style={{ marginTop: 10 }}><Btn color={N.color} onClick={handleCriar}>Criar Lembrete</Btn></div>
          </Card>
          <Card title="Remarketing Automático">
            <Col gap={12}>
              {[
                [`${N.clientsLabel} inativos (+90 dias)`, true],
                ["Lembrete de retorno", true],
                ["Aniversariantes (dia anterior)", true],
                ["Alerta de estoque baixo", false],
              ].map(([label, on], i) => (
                <Row key={i} style={{ justifyContent: "space-between" }}>
                  <span style={{ fontSize: 12, color: B.text }}>{label}</span>
                  <Field type={on ? "toggle" : "toggle-off"} placeholder="" />
                </Row>
              ))}
            </Col>
          </Card>
        </Col>
      </Row>
    </Col>
  );
};

// ── CLÍNICA — ANAMNESE & DOCUMENTOS ───────────────────────────────────────────
const Anamnese = ({ N }) => {
  const [templates, setTemplates] = useState([
    { name: "Anamnese Geral — Harmonização", qs: 12, fills: 34, color: N.color },
    { name: "Pré-Procedimento Bioestimulador", qs: 8, fills: 10, color: N.secondary },
    { name: "Anamnese Corporal Completa", qs: 15, fills: 4, color: B.teal },
  ]);
  const [nomeTemplate, setNomeTemplate] = useState("");
  const [numPerguntas, setNumPerguntas] = useState("10");

  const handleCriarTemplate = () => {
    if (!nomeTemplate.trim()) return;
    setTemplates(prev => [...prev, { name: nomeTemplate.trim(), qs: parseInt(numPerguntas) || 10, fills: 0, color: N.color }]);
    setNomeTemplate("");
    setNumPerguntas("10");
  };

  return (
  <Col gap={14}>
    <PH title="Anamnese & Documentos" sub="Templates, preenchimento e assinatura digital" N={N} />
    <Row gap={10}>
      <Stat label="Templates ativos" value={templates.length + ""} color={N.color} />
      <Stat label="Anamneses preenchidas" value="48" color={N.secondary} />
      <Stat label="Assinadas digitalmente" value="44" sub="91% de adesão" color={B.teal} />
      <Stat label="Pendentes de assinatura" value="2" color={B.amber} />
    </Row>
    <Row gap={10} style={{ alignItems: "flex-start" }}>
      <Col gap={10} style={{ flex: 2 }}>
        <Card title="Templates de Anamnese">
          {templates.map((t, i) => (
            <div key={i} style={{ borderBottom: `0.5px solid ${B.border}`, padding: "14px 0", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: t.color + "20", border: `0.5px solid ${t.color}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><FileText size={18} color={t.color} strokeWidth={1.8} /></div>
              <Col gap={3} style={{ flex: 1 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: B.text }}>{t.name}</span>
                <Row gap={16}>
                  <span style={{ fontSize: 10, color: B.muted }}>{t.qs} perguntas</span>
                  <span style={{ fontSize: 10, color: B.muted }}>{t.fills} preenchimentos</span>
                </Row>
              </Col>
              <Row gap={6}>
                <Btn sm color={t.color}>Preencher</Btn>
                <span onClick={() => setTemplates(prev => prev.filter((_, idx) => idx !== i))} style={{ cursor: "pointer", color: B.red, fontSize: 15, fontWeight: 700, userSelect: "none", padding: "0 6px" }} title="Remover"><X size={14} strokeWidth={2.2} /></span>
              </Row>
            </div>
          ))}
        </Card>
        <Card title={`Preencher Anamnese — ${N.clients[0]}`}>
          <div style={{ marginBottom: 14, padding: "10px 14px", background: N.color + "14", border: `0.5px solid ${N.color}40`, borderRadius: 8, display: "flex", alignItems: "center", gap: 10 }}>
            <Avatar name={N.clients[0]} color={N.color} size={32} />
            <Col gap={1}>
              <span style={{ fontSize: 12, fontWeight: 600, color: B.text }}>{N.clients[0]}</span>
              <span style={{ fontSize: 10, color: B.muted }}>Template: Anamnese Geral — Harmonização</span>
            </Col>
          </div>
          <Col gap={10}>
            {[
              { q: "Possui alergia a algum medicamento?", ans: "Não" },
              { q: "Faz uso de anticoagulantes?", ans: "Sim", detail: "Aspirina 100mg/dia" },
              { q: "Está grávida ou amamentando?", ans: "Não" },
              { q: "Possui doenças autoimunes diagnosticadas?", ans: "Não" },
            ].map((item, i) => (
              <div key={i} style={{ padding: "10px 12px", background: B.bg2, borderRadius: 8, border: `0.5px solid ${B.border}` }}>
                <div style={{ fontSize: 12, color: B.text, marginBottom: 8 }}>{item.q}</div>
                <Row gap={8}>
                  <div style={{ padding: "4px 14px", borderRadius: 6, background: item.ans === "Não" ? B.teal + "20" : "transparent", border: `0.5px solid ${item.ans === "Não" ? B.teal : B.border}`, fontSize: 11, color: item.ans === "Não" ? B.teal : B.muted, cursor: "pointer" }}>Não</div>
                  <div style={{ padding: "4px 14px", borderRadius: 6, background: item.ans === "Sim" ? B.amber + "20" : "transparent", border: `0.5px solid ${item.ans === "Sim" ? B.amber : B.border}`, fontSize: 11, color: item.ans === "Sim" ? B.amber : B.muted, cursor: "pointer" }}>Sim</div>
                  {item.detail && <div style={{ flex: 1, height: 28, background: B.card2, border: `0.5px solid ${B.border2}`, borderRadius: 6, padding: "0 8px", display: "flex", alignItems: "center", fontSize: 11, color: B.text }}>{item.detail}</div>}
                </Row>
              </div>
            ))}
            <div>
              <div style={{ fontSize: 10, color: B.muted, marginBottom: 6 }}>OBSERVAÇÕES ADICIONAIS</div>
              <div style={{ minHeight: 60, background: B.bg2, border: `0.5px solid ${B.border2}`, borderRadius: 8, padding: "8px 10px", fontSize: 11, color: B.muted }}>Escrever observações clínicas...</div>
            </div>
          </Col>
          <Divider />
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: B.muted, marginBottom: 8 }}>ASSINATURA DIGITAL DO PACIENTE</div>
            <div style={{ height: 90, background: B.bg2, border: `1px dashed ${N.color}50`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 5, color: B.dim }}>
              <PenLine size={22} strokeWidth={1.8} />
              <span style={{ fontSize: 11 }}>Área de assinatura — paciente assina aqui</span>
            </div>
          </div>
          <Row gap={8}><Btn color={N.color}>Salvar + Gerar PDF</Btn><Btn>Salvar sem assinar</Btn></Row>
        </Card>
      </Col>
      <Col gap={10} style={{ flex: 1 }}>
        <Card title="Histórico de Anamneses">
          {N.clients.map((c, i) => (
            <div key={i} style={{ borderBottom: `0.5px solid ${B.border}`, padding: "10px 0" }}>
              <Row style={{ justifyContent: "space-between", marginBottom: 4 }}>
                <Row gap={8}><Avatar name={c} color={N.color} size={24} /><span style={{ fontSize: 11, color: B.text }}>{c}</span></Row>
                <Badge text={i === 2 ? "Pendente" : "Assinado"} color={i === 2 ? B.amber : B.teal} />
              </Row>
              <Row gap={12} style={{ paddingLeft: 30 }}>
                <span style={{ fontSize: 10, color: B.muted }}>{["28/05", "15/04", "—", "02/03"][i]}</span>
                <span style={{ fontSize: 10, color: B.muted }}>Anamnese Geral</span>
              </Row>
              {i !== 2 && <div style={{ paddingLeft: 30, marginTop: 4 }}><Btn sm>Ver PDF</Btn></div>}
            </div>
          ))}
        </Card>
        <Card title="Documentos para Assinar">
          {["Termo de Consentimento — Botox", "Autorização de Uso de Imagem"].map((doc, i) => (
            <div key={i} style={{ borderBottom: `0.5px solid ${B.border}`, padding: "10px 0" }}>
              <Row gap={8} style={{ marginBottom: 6 }}><FileText size={16} color={B.muted} strokeWidth={1.8} /><span style={{ fontSize: 11, color: B.text }}>{doc}</span></Row>
              <Row gap={6}><Btn sm color={N.color}>Solicitar assinatura</Btn><Btn sm>Ver PDF</Btn></Row>
            </div>
          ))}
          <div style={{ marginTop: 10 }}><Btn sm>+ Upload de documento</Btn></div>
        </Card>
        <Card title="Criar Template de Anamnese">
          <Field label="NOME DO TEMPLATE" placeholder="Ex: Anamnese Corporal" value={nomeTemplate} onChange={setNomeTemplate} />
          <Field label="Nº DE PERGUNTAS" value={numPerguntas} onChange={setNumPerguntas} />
          <div style={{ marginTop: 10 }}><Btn color={N.color} onClick={handleCriarTemplate}>Criar template</Btn></div>
        </Card>
      </Col>
    </Row>
  </Col>
  );
};

// ── CLÍNICA — PORTFÓLIO DIGITAL ────────────────────────────────────────────────
const Portfolio = ({ N }) => {
  const [entries, setEntries] = useState(() => N.services.slice(0, 4).map((s, i) => ({
    id: i, procedimento: s[0], paciente: i % 2 === 0 ? N.clients[i % N.clients.length] : "Anônimo",
    anonimo: i % 2 !== 0, depoimento: i % 2 === 0 ? "Resultado incrível! Super natural e sem exageros. Recomendo muito!" : "",
    sessoes: i + 1,
  })));
  const [showForm, setShowForm] = useState(false);
  const [fProc, setFProc] = useState(N.services[0][0]);
  const [fPac, setFPac] = useState("");
  const [fDep, setFDep] = useState("");
  const [fAnon, setFAnon] = useState(false);
  const [filter, setFilter] = useState("Todos");

  const handlePublish = () => {
    if (!fProc) return;
    setEntries(prev => [...prev, { id: Date.now(), procedimento: fProc, paciente: fAnon ? "Anônimo" : (fPac || "Paciente"), anonimo: fAnon, depoimento: fDep, sessoes: 1 }]);
    setFProc(N.services[0][0]); setFPac(""); setFDep(""); setFAnon(false); setShowForm(false);
  };

  const filters = ["Todos", ...N.services.map(s => s[0].split(" ").slice(0, 2).join(" "))];
  const visible = filter === "Todos" ? entries : entries.filter(e => e.procedimento.startsWith(filter));
  const comDep = entries.filter(e => e.depoimento).length;

  return (
    <Col gap={14}>
      <PH title="Portfólio Digital" sub="Galeria de antes e depois por procedimento" action={showForm ? "Fechar" : "+ Novo Registro"} N={N} onAction={() => setShowForm(v => !v)} />
      <Row gap={10}>
        <Stat label="Registros" value={entries.length + ""} color={N.color} />
        <Stat label="Com depoimento" value={comDep + ""} sub={`${Math.round(comDep / (entries.length || 1) * 100)}% do portfólio`} color={N.secondary} />
        <Stat label="Anônimos" value={entries.filter(e => e.anonimo).length + ""} color={B.muted} />
      </Row>
      {showForm && (
        <Card title="Adicionar ao Portfólio">
          <Row gap={10}>
            <Field label="PROCEDIMENTO" type="select" value={fProc} onChange={setFProc} options={N.services.map(s => s[0])} />
            {!fAnon && <Field label="PACIENTE" placeholder="Nome do paciente" value={fPac} onChange={setFPac} />}
          </Row>
          <Field label="DEPOIMENTO DO PACIENTE" type="textarea" placeholder={`"O resultado foi incrível!..."`} value={fDep} onChange={setFDep} />
          <Row style={{ justifyContent: "space-between", marginTop: 8 }}>
            <span style={{ fontSize: 12, color: B.text }}>Publicar como anônimo</span>
            <div onClick={() => setFAnon(v => !v)} style={{ width: 36, height: 20, borderRadius: 10, background: fAnon ? N.color : B.card2, cursor: "pointer", position: "relative", transition: "background 0.2s" }}>
              <div style={{ position: "absolute", top: 2, left: fAnon ? 18 : 2, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
            </div>
          </Row>
          <Row gap={8} style={{ marginTop: 12, justifyContent: "flex-end" }}><Btn onClick={() => setShowForm(false)}>Cancelar</Btn><Btn color={N.color} onClick={handlePublish}>Publicar</Btn></Row>
        </Card>
      )}
      <Row gap={10} style={{ alignItems: "flex-start" }}>
        <Col gap={10} style={{ flex: 2 }}>
          <Card>
            <Row gap={6} style={{ flexWrap: "wrap" }}>
              {filters.map((f, i) => (
                <div key={f} onClick={() => setFilter(f)} style={{ padding: "5px 12px", borderRadius: 999, background: filter === f ? N.color + "20" : B.card2, border: `0.5px solid ${filter === f ? N.color : B.border}`, fontSize: 11, color: filter === f ? N.color : B.muted, cursor: "pointer" }}>{f}</div>
              ))}
            </Row>
          </Card>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 }}>
            {visible.map((e) => (
              <Card key={e.id}>
                <Row gap={8} style={{ marginBottom: 10 }}>
                  <ImgBox h={80} label="Antes" />
                  <ImgBox h={80} label="Depois" />
                </Row>
                <Row gap={6} style={{ marginBottom: 8 }}>
                  <Badge text={e.procedimento} color={N.color} />
                  <Badge text={`${e.sessoes} sessão`} color={N.secondary} />
                </Row>
                {e.depoimento && (
                  <div style={{ fontSize: 10, color: B.muted, lineHeight: 1.6, marginBottom: 8, fontStyle: "italic" }}>"{e.depoimento}"</div>
                )}
                <Row style={{ justifyContent: "space-between", borderTop: `0.5px solid ${B.border}`, paddingTop: 8 }}>
                  <span style={{ fontSize: 10, color: B.dim }}>{e.paciente}</span>
                  <span onClick={() => setEntries(prev => prev.filter(x => x.id !== e.id))} style={{ cursor: "pointer", color: B.red, fontSize: 14, fontWeight: 700, padding: "0 4px" }}><X size={14} strokeWidth={2.2} /></span>
                </Row>
              </Card>
            ))}
          </div>
        </Col>
      </Row>
    </Col>
  );
};

// ── MECÂNICA — LAUDOS & DOCUMENTOS ────────────────────────────────────────────
const Laudos = ({ N }) => (
  <Col gap={14}>
    <PH title="Laudos & Documentos" sub="Upload e assinatura digital de documentos técnicos" action="+ Upload Documento" N={N} />
    <Row gap={10}>
      <Stat label="Documentos cadastrados" value="24" color={N.color} />
      <Stat label="Laudos técnicos" value="18" color={N.secondary} />
      <Stat label="Assinados digitalmente" value="15" sub="83% de adesão" color={B.teal} />
      <Stat label="Aguardando assinatura" value="3" color={B.amber} />
    </Row>
    <Row gap={10} style={{ alignItems: "flex-start" }}>
      <Card title="Documentos Cadastrados" style={{ flex: 2 }}>
        <Row gap={8} style={{ marginBottom: 12 }}>
          <SearchBar placeholder="Buscar por cliente, veículo ou OS..." />
          <Btn sm>Filtrar ▾</Btn>
        </Row>
        <Table
          cols={["DOCUMENTO", "CLIENTE", "VEÍCULO", "DATA", "STATUS", "AÇÕES"]}
          rows={N.clients.map((c, i) => [
            <Row key={i} gap={6}><FileText size={14} color={B.muted} strokeWidth={1.8} /><span>{["Laudo Técnico OS-0248", "Termo de Garantia 90d", "Laudo de Diagnóstico", "Autorização de Reparo"][i]}</span></Row>,
            c,
            ["Civic 2019", "Corolla 2020", "Polo 2021", "Argo 2022"][i],
            ["28/05", "14/03", "08/01", "15/10"][i],
            <Badge text={i === 2 ? "Aguardando" : "Assinado"} color={i === 2 ? B.amber : B.teal} />,
            "···"
          ])}
        />
      </Card>
      <Col gap={10} style={{ flex: 1 }}>
        <Card title="Upload de Documento">
          <Field label="TIPO" type="select" value="Laudo Técnico" />
          <Field label="CLIENTE" type="select" value={N.clients[0]} />
          <Field label="VEÍCULO" type="select" value="Honda Civic 2019 — ABC-1234" />
          <Field label="OS VINCULADA" type="select" placeholder="OS-0248 (opcional)" />
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 10, color: B.muted, marginBottom: 6 }}>ARQUIVO PDF</div>
            <div style={{ height: 80, background: B.bg2, border: `1px dashed ${B.border2}`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 4, color: B.dim, cursor: "pointer" }}>
              <FileText size={22} color={B.muted} strokeWidth={1.8} />
              <span style={{ fontSize: 11 }}>Arraste o PDF ou clique para selecionar</span>
            </div>
          </div>
          <div style={{ marginTop: 10 }}><Btn color={N.color}>Salvar Documento</Btn></div>
        </Card>
        <Card title="Pendentes de Assinatura">
          {N.clients.slice(0, 2).map((c, i) => (
            <div key={i} style={{ borderBottom: `0.5px solid ${B.border}`, padding: "10px 0" }}>
              <Row style={{ justifyContent: "space-between", marginBottom: 6 }}>
                <Col gap={2}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: B.text }}>{["Laudo de Diagnóstico", "Termo de Garantia"][i]}</span>
                  <span style={{ fontSize: 10, color: B.muted }}>{c} · {["08/01", "14/03"][i]}</span>
                </Col>
                <Badge text="Aguardando" color={B.amber} />
              </Row>
              <Row gap={6}><Btn sm color={N.color}>Solicitar assinatura</Btn><Btn sm>Ver PDF</Btn></Row>
            </div>
          ))}
        </Card>
        <Card title="Geração de PDF">
          <Col gap={8}>
            <Btn color={N.color}><FileText size={12} strokeWidth={1.8} /> Histórico do veículo</Btn>
            <Btn><Wrench size={12} strokeWidth={1.8} /> Relatório de OS</Btn>
            <Btn><Settings size={12} strokeWidth={1.8} /> Checklist de manutenção</Btn>
          </Col>
        </Card>
      </Col>
    </Row>
  </Col>
);

const ADMIN_EMAIL = "djhugomartis2018@gmail.com";

// ── Client store — shared via localStorage between screens ─────────────────────
function crmLoadClients(nicheId) {
  try { return JSON.parse(localStorage.getItem(`crm_clientes_${nicheId}`) || "null"); } catch { return null; }
}
function crmSaveClients(nicheId, data) {
  try { localStorage.setItem(`crm_clientes_${nicheId}`, JSON.stringify(data)); } catch {}
}
function crmPushService(nicheId, clientName, entry) {
  const data = crmLoadClients(nicheId);
  if (!data) return;
  const today = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  const idx = data.findIndex(c => c.nome && c.nome.toLowerCase() === clientName.toLowerCase());
  if (idx === -1) return;
  if (nicheId === "clinica") {
    const noteText = `${today} — ${entry.svc}${entry.pro ? ` com ${entry.pro}` : ""}${entry.val ? ` · ${entry.val}` : ""}`;
    data[idx] = { ...data[idx], notes: [noteText, ...(data[idx].notes || [])], sessoes: (data[idx].sessoes || 0) + 1, ultimaVisita: today };
  } else {
    data[idx] = { ...data[idx], historico: [{ data: today, svc: entry.svc, barb: entry.barb || "—", val: entry.val || "—" }, ...(data[idx].historico || [])], visitas: (data[idx].visitas || 0) + 1, ultimaVisita: today };
  }
  crmSaveClients(nicheId, data);
}

// ── Auth helpers ───────────────────────────────────────────────────────────────
function loadUsers() {
  try { return JSON.parse(localStorage.getItem("crm_users") || "[]"); }
  catch { return []; }
}
function saveUsers(arr) { localStorage.setItem("crm_users", JSON.stringify(arr)); }
function loadSession() {
  try { return JSON.parse(localStorage.getItem("crm_session") || "null"); }
  catch { return null; }
}
function saveSession(u) { localStorage.setItem("crm_session", JSON.stringify(u)); }
function clearSession() { localStorage.removeItem("crm_session"); }

// ── Dashboard ─────────────────────────────────────────────────────────────────
const Dashboard = ({ N, user, onNavigate }) => {
  const today = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  const quickLinks = [
    { id: "agenda",     icon: CalendarDays,  label: "Ver Agenda" },
    { id: "estoque",    icon: Package,       label: "Estoque" },
    { id: "financeiro", icon: Wallet,        label: "Financeiro" },
    { id: "servicos",   icon: ClipboardList, label: N.servicesLabel },
  ];
  const activities = [
    { icon: CheckCircle, text: `Agendamento confirmado — ${N.clients[0]}`, time: "há 5 min", color: B.teal },
    { icon: DollarSign,  text: `Pagamento recebido — ${N.services[0][2]}`, time: "há 18 min", color: B.green },
    { icon: Package,     text: `Estoque baixo — ${N.products[0][0]}`, time: "há 1h", color: B.amber },
    { icon: Bell,        text: `Lembrete enviado — ${N.clients[1]}`, time: "há 2h", color: N.color },
  ];
  return (
    <Col gap={16}>
      <Row style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        <Col gap={3}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: B.text, margin: 0 }}>Olá, {user.name.split(" ")[0]}</h2>
          <p style={{ fontSize: 12, color: B.muted, margin: 0, textTransform: "capitalize" }}>{today}</p>
        </Col>
        <Badge text={N.name} color={N.color} />
      </Row>

      {/* KPIs */}
      <Row gap={10}>
        {N.kpis.map((k, i) => (
          <Stat key={i} label={k.l} value={k.v} color={k.c} />
        ))}
      </Row>

      <Row gap={10} style={{ alignItems: "flex-start" }}>
        <Col gap={10} style={{ flex: 2 }}>
          {/* Ações rápidas */}
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

          {/* Gráfico faturamento */}
          <Card title="Faturamento — últimos 7 dias">
            <ChartBar h={110} color={N.color} data={[55, 72, 48, 90, 63, 78, 85]} />
            <Row gap={4} style={{ marginTop: 8 }}>
              {["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"].map((d,i) => (
                <div key={d} style={{ flex: 1, textAlign: "center", fontSize: 9, color: B.dim }}>{d}</div>
              ))}
            </Row>
          </Card>
        </Col>

        <Col gap={10} style={{ flex: 1 }}>
          {/* Próximos agendamentos */}
          <Card title="Próximos agendamentos">
            {[
              { h: "09:00", client: N.clients[0], svc: N.services[0][0] },
              { h: "11:00", client: N.clients[1], svc: N.services[1][0] },
              { h: "14:30", client: N.clients[2], svc: N.services[2 % N.services.length][0] },
            ].map((a, i) => (
              <Row key={i} gap={10} style={{ padding: "8px 0", borderBottom: i < 2 ? `0.5px solid ${B.border}` : "none" }}>
                <div style={{ fontSize: 11, color: N.color, fontWeight: 700, minWidth: 38 }}>{a.h}</div>
                <Col gap={2} style={{ flex: 1 }}>
                  <span style={{ fontSize: 12, color: B.text, fontWeight: 600 }}>{a.client}</span>
                  <span style={{ fontSize: 10, color: B.muted }}>{a.svc}</span>
                </Col>
                <Badge text="Conf." color={B.teal} />
              </Row>
            ))}
            <div style={{ marginTop: 10 }}><Btn sm color={N.color} onClick={() => onNavigate("agenda")}>Ver agenda completa</Btn></div>
          </Card>

          {/* Atividade recente */}
          <Card title="Atividade recente">
            {activities.map((a, i) => (
              <Row key={i} gap={8} style={{ padding: "7px 0", borderBottom: i < activities.length - 1 ? `0.5px solid ${B.border}` : "none" }}>
                <a.icon size={14} color={a.color} strokeWidth={1.8} style={{ flexShrink: 0 }} />
                <Col gap={1} style={{ flex: 1 }}>
                  <span style={{ fontSize: 11, color: B.text }}>{a.text}</span>
                  <span style={{ fontSize: 10, color: B.muted }}>{a.time}</span>
                </Col>
              </Row>
            ))}
          </Card>
        </Col>
      </Row>
    </Col>
  );
};

// ── Landing Page ───────────────────────────────────────────────────────────────
const LandingPage = ({ onLogin, onRegister }) => {
  const [tab, setTab] = useState("clinica");

  const ND = {
    clinica: {
      tabName: "Clínicas", icon: Sparkles, color: "#7B6CF6",
      badge: "GESTÃO INTELIGENTE PARA CLÍNICAS !",
      l1: "Gestão", l2: "completa da", l3: "sua clínica.",
      sub: "Agenda, prontuário e financeiro em uma plataforma desenhada para a rotina de clínicas de harmonização.",
      count: "+850", countLabel: "Clínicas ativas",
      dashLabel: "Painel · Clínicas",
      kpis: [{ l: "RECEITA", v: "R$ 48.2k", d: "+18% este mês" }, { l: "AGENDAMENTOS", v: "126", d: "+12% este mês" }, { l: "TICKET MÉDIO", v: "R$ 890", d: "+7% este mês" }, { l: "RETENÇÃO", v: "94%", d: "+3% este mês" }],
      feat3: [
        { n: "Serviço para qualquer nível de expertise.", d: "" },
        { n: "Agenda inteligente com IA.", d: "Visualização por profissional, lembretes via WhatsApp e bloqueios dinâmicos de horários." },
        { n: "Protegida por conformidade LGPD.", d: "" },
      ],
      chartV: "R$ 48.2k", chartD: "+18%", chartLabel: "Receita mensal",
      cta: "Pronta para transformar sua clínica?",
      cp: "M0,80 C80,72 140,52 200,42 C260,32 300,60 360,38 C420,16 460,32 520,16 C580,2 630,24 690,14 L800,10 L800,120 L0,120 Z",
      cl: "M0,80 C80,72 140,52 200,42 C260,32 300,60 360,38 C420,16 460,32 520,16 C580,2 630,24 690,14 L800,10",
    },
    mecanica: {
      tabName: "Mecânicas", icon: Wrench, color: "#EFA420",
      badge: "GESTÃO COMPLETA PARA OFICINAS !",
      l1: "Sua oficina", l2: "rodando no", l3: "ritmo certo.",
      sub: "Ordens de serviço, peças, mão-de-obra e histórico veicular em um só sistema feito para a oficina mecânica brasileira.",
      count: "+1.2k", countLabel: "Oficinas ativas",
      dashLabel: "Painel · Mecânicas",
      kpis: [{ l: "FATURAMENTO", v: "R$ 92.4k", d: "+22% este mês" }, { l: "OS ABERTAS", v: "38", d: "+9% esta semana" }, { l: "TICKET MÉDIO", v: "R$ 1.240", d: "+11% este mês" }, { l: "RETORNO 90D", v: "67%", d: "+5% este mês" }],
      feat3: [
        { n: "OS para qualquer tipo de serviço.", d: "" },
        { n: "Histórico completo do veículo.", d: "Placa, quilometragem, manutenções realizadas e próximas revisões programadas." },
        { n: "Financeiro e comissão automática.", d: "" },
      ],
      chartV: "R$ 92.4k", chartD: "+22%", chartLabel: "Faturamento mensal",
      cta: "Pronto para deixar sua oficina no azul?",
      cp: "M0,85 C75,76 135,58 195,48 C258,36 295,65 355,44 C415,22 458,38 515,20 C572,4 628,26 688,16 L800,12 L800,120 L0,120 Z",
      cl: "M0,85 C75,76 135,58 195,48 C258,36 295,65 355,44 C415,22 458,38 515,20 C572,4 628,26 688,16 L800,12",
    },
    barbearia: {
      tabName: "Barbearias", icon: Scissors, color: "#0FB884",
      badge: "GESTÃO MODERNA PARA BARBEARIAS !",
      l1: "Sua barbearia", l2: "no próximo", l3: "nível.",
      sub: "Agenda online, comanda por cliente e comissão por barbeiro — tudo em um só app pensado para a barbearia moderna.",
      count: "+2.4k", countLabel: "Barbearias ativas",
      dashLabel: "Painel · Barbearias",
      kpis: [{ l: "FATURAMENTO", v: "R$ 28.6k", d: "+24% este mês" }, { l: "ATENDIMENTOS", v: "412", d: "+18% este mês" }, { l: "TICKET MÉDIO", v: "R$ 69", d: "+8% este mês" }, { l: "RECORRÊNCIA", v: "82%", d: "+6% este mês" }],
      feat3: [
        { n: "Agenda para qualquer volume de clientes.", d: "" },
        { n: "Assinatura mensal.", d: "Clube do cliente com cortes mensais e benefícios exclusivos." },
        { n: "Comissão automática por barbeiro.", d: "" },
      ],
      chartV: "R$ 28.6k", chartD: "+24%", chartLabel: "Faturamento mensal",
      cta: "Pronto para lotar suas cadeiras?",
      cp: "M0,90 C78,82 138,60 198,50 C260,38 298,68 358,46 C418,24 460,40 518,22 C576,6 632,28 692,18 L800,14 L800,120 L0,120 Z",
      cl: "M0,90 C78,82 138,60 198,50 C260,38 298,68 358,46 C418,24 460,40 518,22 C576,6 632,28 692,18 L800,14",
    },
  };

  const n = ND[tab];
  const c = n.color;

  const allSegs = [
    { id: "clinica",   icon: Sparkles, name: "Clínicas",   color: "#7B6CF6", desc: "Agenda, prontuário e financeiro em uma plataforma desenhada para a rotina de clínicas de harmonização." },
    { id: "mecanica",  icon: Wrench,   name: "Mecânicas",  color: "#EFA420", desc: "Ordens de serviço, peças, mão-de-obra e histórico veicular em um só sistema feito para a oficina mecânica brasileira." },
    { id: "barbearia", icon: Scissors, name: "Barbearias", color: "#0FB884", desc: "Agenda online, comanda por cliente e comissão por barbeiro — tudo em um só app pensado para a barbearia moderna." },
  ];

  const avatarColors = ["#7B6CF6", "#EFA420", "#0FB884", "#E84040", "#22C55E"];
  const avatarIcons  = [Sparkles, Wrench, Scissors, Briefcase, Star];

  return (
    <div style={{ height: "100vh", overflowY: "auto", background: "#070809", color: B.text, fontFamily: '"DM Sans", system-ui, sans-serif', position: "relative" }}>

      {/* ── Grid sutil de fundo ── */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: "linear-gradient(rgba(255,255,255,.022) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.022) 1px,transparent 1px)",
        backgroundSize: "52px 52px" }} />

      {/* ── Glow de cor no canto direito/centro (como no crypto) ── */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, transition: "background .6s",
        background: `radial-gradient(ellipse 65% 75% at 72% 20%, ${c}38 0%, ${c}10 45%, transparent 70%)` }} />

      {/* ── Header ── */}
      <div style={{ position: "sticky", top: 0, zIndex: 100, padding: "0 56px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(7,8,9,0.72)", backdropFilter: "blur(30px) saturate(160%)", boxShadow: "0 1px 0 rgba(255,255,255,0.05), 0 8px 32px rgba(0,0,0,0.4)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: c + "25", backdropFilter: "blur(8px)", border: `1px solid ${c}65`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, color: "#fff", fontWeight: 900, transition: "all .4s", boxShadow: `0 2px 14px ${c}40, inset 0 1px 0 rgba(255,255,255,0.28)` }}>+</div>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>ControlCRM</span>
        </div>
        <div style={{ display: "flex", gap: 32, fontSize: 13, color: B.muted }}>
          {["Home", "Recursos", "Preços", "Novidades?"].map(l => <span key={l} style={{ cursor: "pointer" }}>{l}</span>)}
        </div>
        <button onClick={onRegister} style={{ padding: "9px 22px", borderRadius: 8, background: c, color: "#fff", border: `1px solid ${c}80`, fontSize: 13, cursor: "pointer", fontFamily: "inherit", fontWeight: 700, transition: "all .4s", boxShadow: `0 4px 18px ${c}45, inset 0 1px 0 rgba(255,255,255,0.32)` }}>
          Começar agora
        </button>
      </div>

      {/* ══════════════════════════════════════════════ */}
      {/* ── HERO — 2 colunas (esq: texto | dir: 3D) ── */}
      {/* ══════════════════════════════════════════════ */}
      <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 0, padding: "56px 56px 48px", maxWidth: 1280, margin: "0 auto", minHeight: "calc(100vh - 60px)" }}>

        {/* ── Coluna esquerda ── */}
        <div style={{ flex: "0 0 520px", paddingRight: 40 }}>
          {/* Overline multi-niche */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <div style={{ display: "flex", gap: 6 }}>{allSegs.map(s => <s.icon key={s.id} size={14} color={s.color} strokeWidth={1.8} />)}</div>
            <span style={{ fontSize: 9, color: B.muted, letterSpacing: ".16em", textTransform: "uppercase" }}>Controle de Negócios · Multi-Segmento</span>
          </div>
          {/* Niche tabs — antes do headline para deixar claro que é multi-nicho */}
          <div style={{ display: "flex", gap: 6, marginBottom: 24, flexWrap: "wrap" }}>
            {allSegs.map(s => (
              <button key={s.id} onClick={() => setTab(s.id)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 15px", borderRadius: 999, border: `1px solid ${tab === s.id ? s.color : "rgba(255,255,255,0.12)"}`, background: tab === s.id ? s.color + "22" : "rgba(255,255,255,0.05)", backdropFilter: "blur(12px)", color: tab === s.id ? "#fff" : B.muted, fontSize: 12, fontWeight: tab === s.id ? 600 : 400, cursor: "pointer", fontFamily: "inherit", transition: "all .2s", boxShadow: tab === s.id ? `0 2px 12px ${s.color}35, inset 0 1px 0 rgba(255,255,255,0.22)` : "inset 0 1px 0 rgba(255,255,255,0.07)" }}>
                <s.icon size={13} strokeWidth={1.8} />{s.name}
              </button>
            ))}
          </div>
          {/* Badge */}
          <div style={{ fontSize: 10, fontWeight: 800, color: c, letterSpacing: ".14em", marginBottom: 20, transition: "color .4s" }}>
            {n.badge}
          </div>
          {/* Headline 3 linhas */}
          <h1 style={{ fontSize: 56, fontWeight: 800, color: "#fff", margin: 0, lineHeight: 1.06, letterSpacing: "-2px" }}>{n.l1}</h1>
          <h1 style={{ fontSize: 56, fontWeight: 800, color: c, margin: 0, lineHeight: 1.06, letterSpacing: "-2px", transition: "color .4s" }}>{n.l2}</h1>
          <h1 style={{ fontSize: 56, fontWeight: 800, color: "#3A3F50", margin: "0 0 26px", lineHeight: 1.06, letterSpacing: "-2px" }}>{n.l3}</h1>
          {/* Sub */}
          <p style={{ fontSize: 14, color: B.muted, margin: "0 0 32px", lineHeight: 1.75, maxWidth: 400 }}>{n.sub}</p>
          {/* CTAs */}
          <div style={{ display: "flex", gap: 12, marginBottom: 40 }}>
            <button onClick={onRegister} style={{ padding: "11px 24px", borderRadius: 8, background: c, color: "#fff", border: `1px solid ${c}75`, fontSize: 14, cursor: "pointer", fontFamily: "inherit", fontWeight: 700, transition: "all .4s", boxShadow: `0 4px 22px ${c}48, inset 0 1px 0 rgba(255,255,255,0.32)` }}>Começar gratuitamente →</button>
            <button onClick={onLogin} style={{ padding: "11px 24px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.13)", background: "rgba(255,255,255,0.06)", backdropFilter: "blur(14px)", color: B.text, fontSize: 14, cursor: "pointer", fontFamily: "inherit", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)" }}>Ver demonstração</button>
          </div>
          {/* Prova social */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ display: "flex" }}>
              {avatarColors.map((col, i) => (
                <div key={i} style={{ width: 32, height: 32, borderRadius: "50%", background: col + "50", border: `2px solid ${col}80`, marginLeft: i > 0 ? -10 : 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {React.createElement(avatarIcons[i], { size: 14, color: col, strokeWidth: 1.8 })}
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", letterSpacing: "-0.5px" }}>{n.count}</div>
              <div style={{ fontSize: 11, color: B.muted }}>{n.countLabel}</div>
            </div>
            <div style={{ width: 1, height: 30, background: "#ffffff12" }} />
            <div style={{ fontSize: 11, color: B.muted }}>
              <div style={{ display: "flex", gap: 2, marginBottom: 2 }}>{[1,2,3,4,5].map(i => <Star key={i} size={13} color={c} fill={c} strokeWidth={0} />)}</div>Avaliação 5 estrelas
            </div>
          </div>
        </div>

        {/* ── Coluna direita — visual 3D ── */}
        <div style={{ flex: 1, position: "relative", height: 540, overflow: "visible" }}>
          {/* Ring orbital externo */}
          <div style={{ position: "absolute", left: "50%", top: "50%", width: 460, height: 460, marginLeft: -230, marginTop: -230, borderRadius: "50%", border: `1.5px solid ${c}22`, transform: "rotateX(75deg) rotateZ(-25deg)", pointerEvents: "none", transition: "border-color .4s" }} />
          {/* Ring orbital interno */}
          <div style={{ position: "absolute", left: "50%", top: "50%", width: 340, height: 340, marginLeft: -170, marginTop: -170, borderRadius: "50%", border: `1px solid ${c}15`, transform: "rotateX(75deg) rotateZ(40deg)", pointerEvents: "none", transition: "border-color .4s" }} />
          {/* Dot orbital */}
          <div style={{ position: "absolute", left: "50%", top: "17%", width: 8, height: 8, marginLeft: 100, borderRadius: "50%", background: c, boxShadow: `0 0 16px ${c}, 0 0 32px ${c}60`, transition: "background .4s, box-shadow .4s" }} />
          <div style={{ position: "absolute", left: "20%", top: "70%", width: 5, height: 5, borderRadius: "50%", background: c + "80", boxShadow: `0 0 10px ${c}`, transition: "background .4s" }} />

          {/* Card 3D principal — dashboard */}
          <div style={{
            position: "absolute", left: "50%", top: "50%",
            transform: "translate(-46%, -50%) perspective(1000px) rotateY(-10deg) rotateX(4deg)",
            width: 310, borderRadius: 16, overflow: "hidden",
            background: "#0B0E15",
            border: `1px solid ${c}40`,
            boxShadow: `0 0 100px ${c}28, 0 40px 80px #00000090`,
            transition: "border-color .4s, box-shadow .4s"
          }}>
            <div style={{ padding: "10px 14px", borderBottom: "1px solid #ffffff0d", display: "flex", alignItems: "center", gap: 6, background: "#090B10" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#FF5F57" }} />
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#FEBC2E" }} />
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#28C840" }} />
              <div style={{ marginLeft: "auto", fontSize: 9, color: B.muted, display: "flex", alignItems: "center", gap: 4 }}><BarChart2 size={9} strokeWidth={1.8} /> {n.dashLabel}</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
              {n.kpis.map((k, i) => (
                <div key={k.l} style={{ padding: "14px 15px", borderRight: i % 2 === 0 ? "1px solid #ffffff0c" : "none", borderBottom: i < 2 ? "1px solid #ffffff0c" : "none" }}>
                  <div style={{ fontSize: 7, fontWeight: 700, color: B.muted, letterSpacing: ".09em", marginBottom: 5 }}>{k.l}</div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: "#fff", marginBottom: 2 }}>{k.v}</div>
                  <div style={{ fontSize: 8, color: c, transition: "color .4s" }}>{k.d}</div>
                </div>
              ))}
            </div>
            <div style={{ height: 90, background: "#070A0F", overflow: "hidden" }}>
              <svg viewBox="0 0 310 90" style={{ width: "100%", height: "100%", display: "block" }} preserveAspectRatio="none">
                <defs>
                  <linearGradient id={`hg${tab}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={c} stopOpacity="0.5" />
                    <stop offset="100%" stopColor={c} stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0,60 C40,52 65,36 100,28 C135,20 155,46 190,28 C225,10 250,24 310,8 L310,90 L0,90 Z" fill={`url(#hg${tab})`} />
                <path d="M0,60 C40,52 65,36 100,28 C135,20 155,46 190,28 C225,10 250,24 310,8" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* Card flutuante — topo esquerdo */}
          <div style={{ position: "absolute", top: 48, left: 0, padding: "14px 18px", background: "rgba(8,11,18,0.72)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, backdropFilter: "blur(24px) saturate(150%)", boxShadow: `0 8px 32px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.12)`, transition: "all .4s" }}>
            <div style={{ fontSize: 8, color: B.muted, letterSpacing: ".08em", marginBottom: 5 }}>{n.kpis[0].l}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>{n.kpis[0].v}</div>
            <div style={{ fontSize: 9, color: c, marginTop: 3, transition: "color .4s" }}>{n.kpis[0].d}</div>
          </div>

          {/* Card flutuante — baixo direito */}
          <div style={{ position: "absolute", bottom: 60, right: 10, padding: "14px 18px", background: "rgba(8,11,18,0.72)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, backdropFilter: "blur(24px) saturate(150%)", boxShadow: `0 8px 32px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.12)`, transition: "all .4s" }}>
            <div style={{ fontSize: 8, color: B.muted, letterSpacing: ".08em", marginBottom: 5 }}>{n.kpis[2].l}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>{n.kpis[2].v}</div>
            <div style={{ fontSize: 9, color: c, marginTop: 3, transition: "color .4s" }}>{n.kpis[2].d}</div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════ */}
      {/* ── Frase de confiança ── */}
      {/* ══════════════════════════════════ */}
      <div style={{ position: "relative", zIndex: 1, padding: "0 56px 56px", maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 80, paddingTop: 48, borderTop: "1px solid #ffffff0c" }}>
          <h2 style={{ fontSize: 42, fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "-1.5px", lineHeight: 1.1, flex: "0 0 480px" }}>
            Seu parceiro de{" "}
            <span style={{ color: c, transition: "color .4s" }}>confiança</span>{" "}
            para a gestão do negócio.
          </h2>
          <p style={{ fontSize: 14, color: B.muted, lineHeight: 1.85, maxWidth: 400, paddingTop: 6 }}>
            ControlCRM unifica agenda, financeiro e estoque em uma única plataforma adaptada ao seu segmento de negócio. Configure em menos de 1 minuto.
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════ */}
      {/* ── 01 / 02 / 03 Features ── */}
      {/* ══════════════════════════════════ */}
      <div style={{ position: "relative", zIndex: 1, padding: "0 56px 80px", maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.15fr 1fr", borderRadius: 18, overflow: "hidden", border: "1px solid #ffffff0c" }}>
          {/* 01 */}
          <div style={{ padding: "48px 40px", background: "rgba(10,12,17,0.9)", backdropFilter: "blur(12px)", borderRight: "1px solid rgba(255,255,255,0.07)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#3A3F50", marginBottom: 28, letterSpacing: ".02em" }}>01.</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", lineHeight: 1.25, letterSpacing: "-0.5px" }}>{n.feat3[0].n}</div>
          </div>
          {/* 02 — destacado */}
          <div style={{ padding: "48px 40px", background: c, position: "relative", overflow: "hidden", transition: "background .4s", boxShadow: `inset 0 1px 0 rgba(255,255,255,0.25)` }}>
            <div style={{ position: "absolute", top: -50, right: -50, width: 180, height: 180, borderRadius: "50%", background: "#ffffff14", pointerEvents: "none" }} />
            <div style={{ position: "absolute", bottom: -40, left: -20, width: 120, height: 120, borderRadius: "50%", background: "#ffffff0a", pointerEvents: "none" }} />
            <div style={{ fontSize: 14, fontWeight: 700, color: "#ffffff60", marginBottom: 28, letterSpacing: ".02em", position: "relative", zIndex: 1 }}>02.</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", lineHeight: 1.25, marginBottom: 16, letterSpacing: "-0.5px", position: "relative", zIndex: 1 }}>{n.feat3[1].n}</div>
            <div style={{ fontSize: 13, color: "#ffffffa0", lineHeight: 1.75, marginBottom: 32, position: "relative", zIndex: 1 }}>{n.feat3[1].d}</div>
            <button onClick={onRegister} style={{ padding: "10px 20px", borderRadius: 8, background: "rgba(255,255,255,0.95)", color: c, border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 6, position: "relative", zIndex: 1, transition: "all .4s", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4), 0 4px 12px rgba(0,0,0,0.3)" }}>
              Começar agora →
            </button>
          </div>
          {/* 03 */}
          <div style={{ padding: "48px 40px", background: "rgba(10,12,17,0.9)", backdropFilter: "blur(12px)", borderLeft: "1px solid rgba(255,255,255,0.07)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#3A3F50", marginBottom: 28, letterSpacing: ".02em" }}>03.</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", lineHeight: 1.25, letterSpacing: "-0.5px" }}>{n.feat3[2].n}</div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════ */}
      {/* ── Bottom: chart flutuante + cópia de confiança ── */}
      {/* ══════════════════════════════════════════════════ */}
      <div style={{ position: "relative", zIndex: 1, padding: "0 56px 80px", maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ display: "flex", gap: 80, alignItems: "center" }}>

          {/* Esquerda — cards de chart flutuantes */}
          <div style={{ flex: "0 0 400px", position: "relative" }}>
            {/* Card principal */}
            <div style={{ background: "rgba(11,14,21,0.82)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "22px 24px", marginBottom: 16, backdropFilter: "blur(20px) saturate(140%)", boxShadow: "0 20px 60px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.09)" }}>
              <div style={{ fontSize: 10, color: B.muted, marginBottom: 6, letterSpacing: ".06em" }}>{n.chartLabel.toUpperCase()}</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: "#fff", letterSpacing: "-1.5px", marginBottom: 4 }}>{n.chartV}</div>
              <div style={{ height: 90, marginTop: 16, overflow: "hidden" }}>
                <svg viewBox="0 0 360 90" style={{ width: "100%", height: "100%" }} preserveAspectRatio="none">
                  <defs>
                    <linearGradient id={`cg${tab}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={c} stopOpacity="0.45" />
                      <stop offset="100%" stopColor={c} stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d={`${n.cp.replace("L800,", "L360,").replace("L0,120", "L0,90")}`} fill={`url(#cg${tab})`} />
                  <path d={`${n.cl.replace("L800,", "L360,")}`} fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
            </div>
            {/* Card menor flutuante */}
            <div style={{ display: "inline-block", background: "rgba(11,14,21,0.78)", border: "1px solid rgba(255,255,255,0.11)", borderRadius: 12, padding: "14px 20px", backdropFilter: "blur(18px) saturate(130%)", boxShadow: `0 8px 24px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.1)`, transition: "all .4s" }}>
              <div style={{ fontSize: 9, color: B.muted, marginBottom: 4, letterSpacing: ".08em" }}>TAXA DE CRESCIMENTO</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: c, letterSpacing: "-1px", transition: "color .4s" }}>{n.chartD}</div>
            </div>
          </div>

          {/* Direita — cópia de confiança */}
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 42, fontWeight: 800, color: "#fff", margin: "0 0 16px", letterSpacing: "-1.5px", lineHeight: 1.12 }}>
              Plataforma{" "}
              <span style={{ color: c, transition: "color .4s" }}>confiada</span>{" "}
              anytime &amp; anywhere.
            </h2>
            <div style={{ display: "flex", gap: 2, marginBottom: 20 }}>
              {[1,2,3,4,5].map(i => <Star key={i} size={20} color={c} fill={c} strokeWidth={0} style={{ transition: "color .4s" }} />)}
            </div>
            <p style={{ fontSize: 14, color: B.muted, lineHeight: 1.85, marginBottom: 10 }}>
              ControlCRM unifica toda a operação do seu negócio — da agenda ao financeiro — em uma plataforma simples e poderosa.
            </p>
            <p style={{ fontSize: 14, color: B.muted, lineHeight: 1.85, marginBottom: 36 }}>
              Mais de <strong style={{ color: "#fff" }}>{n.count} negócios</strong> confiam no ControlCRM para crescer com inteligência.
            </p>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <button onClick={onRegister} style={{ padding: "12px 26px", borderRadius: 8, background: c, color: "#fff", border: `1px solid ${c}75`, fontSize: 14, cursor: "pointer", fontFamily: "inherit", fontWeight: 700, transition: "all .4s", display: "inline-flex", alignItems: "center", gap: 6, boxShadow: `0 4px 22px ${c}45, inset 0 1px 0 rgba(255,255,255,0.32)` }}>
                Começar agora →
              </button>
              <button onClick={onLogin} style={{ padding: "12px 20px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)", backdropFilter: "blur(14px)", color: B.muted, fontSize: 14, cursor: "pointer", fontFamily: "inherit", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1)" }}>
                Fazer login
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={{ position: "relative", zIndex: 1, padding: "22px 56px", borderTop: "1px solid #ffffff0c", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12, color: B.muted }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 22, height: 22, borderRadius: 6, background: c, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff", fontWeight: 900, transition: "background .4s" }}>+</div>
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

// ── Login Page ─────────────────────────────────────────────────────────────────
const LoginPage = ({ onSuccess, onRegister, onBack }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handle = () => {
    if (!email.trim() || !password) { setError("Preencha e-mail e senha."); return; }
    const users = loadUsers();
    const u = users.find(x => x.email === email.trim() && x.password === password);
    if (!u) { setError("E-mail ou senha incorretos. Não tem conta? Cadastre-se."); return; }
    saveSession(u);
    onSuccess(u);
  };

  const inp = { width: "100%", padding: "10px 12px", background: "rgba(255,255,255,0.05)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 9, color: B.text, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)", transition: "border-color .15s" };

  return (
    <div style={{ minHeight: "100vh", background: "#0A0C10", color: B.text, fontFamily: '"DM Sans", system-ui, sans-serif', display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
      {/* Glow de fundo */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse 70% 60% at 50% 30%, #7B6CF625 0%, #7B6CF608 50%, transparent 75%)" }} />
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", backgroundImage: "linear-gradient(rgba(255,255,255,.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.018) 1px,transparent 1px)", backgroundSize: "52px 52px" }} />
      <div style={{ width: "100%", maxWidth: 400, padding: "0 24px", position: "relative", zIndex: 1 }}>
        <button onClick={onBack} style={{ background: "transparent", border: "none", color: B.muted, cursor: "pointer", fontSize: 13, marginBottom: 28, padding: 0, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}>← Voltar</button>
        <div style={{ padding: 32, background: "rgba(22,27,34,0.72)", backdropFilter: "blur(32px) saturate(160%)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 20, boxShadow: "0 8px 56px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.1)" }}>
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Entrar</div>
          <div style={{ fontSize: 13, color: B.muted, marginBottom: 28 }}>Acesse seu painel ControlCRM</div>
          {error && <div style={{ padding: "10px 14px", background: "#E8404018", border: `0.5px solid ${B.red}`, borderRadius: 8, fontSize: 12, color: B.red, marginBottom: 16 }}>{error}</div>}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: B.muted, marginBottom: 6, letterSpacing: ".06em" }}>E-MAIL</div>
            <input value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handle()} placeholder="seu@email.com" type="email" style={inp} />
          </div>
          <div style={{ marginBottom: 26 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: B.muted, marginBottom: 6, letterSpacing: ".06em" }}>SENHA</div>
            <input value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handle()} placeholder="••••••••" type="password" style={inp} />
          </div>
          <button onClick={handle} style={{ width: "100%", padding: "11px", borderRadius: 9, background: "#7B6CF6", color: "#fff", border: "1px solid #7B6CF680", fontSize: 14, cursor: "pointer", fontFamily: "inherit", fontWeight: 700, boxShadow: "0 4px 18px #7B6CF640, inset 0 1px 0 rgba(255,255,255,0.3)" }}>Entrar →</button>
          <div style={{ marginTop: 20, textAlign: "center", fontSize: 12, color: B.muted }}>
            Não tem conta?{" "}<span onClick={onRegister} style={{ color: "#7B6CF6", cursor: "pointer", fontWeight: 600 }}>Cadastrar grátis</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Register Page ──────────────────────────────────────────────────────────────
const RegisterPage = ({ onSuccess, onLogin, onBack }) => {
  const [form, setForm] = useState({ name: "", whatsapp: "", email: "", password: "" });
  const [niche, setNiche] = useState("");
  const [error, setError] = useState("");

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const regNiches = [
    { id: "clinica",   icon: Sparkles, name: "Clínica Estética", color: "#7B6CF6" },
    { id: "barbearia", icon: Scissors, name: "Barbearia",         color: "#EFA420" },
    { id: "mecanica",  icon: Wrench,   name: "Mecânica",          color: "#E84040" },
  ];

  const handle = () => {
    if (!form.name.trim()) { setError("Informe seu nome completo."); return; }
    if (!form.whatsapp.trim()) { setError("Informe seu WhatsApp."); return; }
    if (!form.email.trim() || !form.email.includes("@")) { setError("Informe um e-mail válido."); return; }
    if (!form.password || form.password.length < 6) { setError("A senha deve ter pelo menos 6 caracteres."); return; }
    if (!niche) { setError("Selecione o segmento do seu negócio."); return; }
    const users = loadUsers();
    if (users.find(x => x.email === form.email.trim())) { setError("Este e-mail já está cadastrado. Faça login."); return; }
    const u = { ...form, email: form.email.trim(), niche };
    saveUsers([...users, u]);
    saveSession(u);
    onSuccess(u);
  };

  const inp = { width: "100%", padding: "10px 12px", background: "rgba(255,255,255,0.05)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 9, color: B.text, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)", transition: "border-color .15s" };

  return (
    <div style={{ minHeight: "100vh", background: "#0A0C10", color: B.text, fontFamily: '"DM Sans", system-ui, sans-serif', display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", position: "relative", overflow: "hidden" }}>
      {/* Glow de fundo */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse 70% 60% at 50% 30%, #7B6CF620 0%, #7B6CF606 50%, transparent 75%)" }} />
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", backgroundImage: "linear-gradient(rgba(255,255,255,.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.018) 1px,transparent 1px)", backgroundSize: "52px 52px" }} />
      <div style={{ width: "100%", maxWidth: 440, position: "relative", zIndex: 1 }}>
        <button onClick={onBack} style={{ background: "transparent", border: "none", color: B.muted, cursor: "pointer", fontSize: 13, marginBottom: 28, padding: 0, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}>← Voltar</button>
        <div style={{ padding: 32, background: "rgba(22,27,34,0.72)", backdropFilter: "blur(32px) saturate(160%)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 20, boxShadow: "0 8px 56px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.1)" }}>
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Criar conta</div>
          <div style={{ fontSize: 13, color: B.muted, marginBottom: 28 }}>Configure uma vez, use para sempre</div>
          {error && <div style={{ padding: "10px 14px", background: "#E8404018", border: `0.5px solid ${B.red}`, borderRadius: 8, fontSize: 12, color: B.red, marginBottom: 16 }}>{error}</div>}
          {[
            { k: "name", label: "NOME COMPLETO", type: "text", ph: "João Silva" },
            { k: "whatsapp", label: "WHATSAPP", type: "tel", ph: "(11) 99999-9999" },
            { k: "email", label: "E-MAIL", type: "email", ph: "seu@email.com" },
            { k: "password", label: "SENHA", type: "password", ph: "mínimo 6 caracteres" },
          ].map(({ k, label, type, ph }) => (
            <div key={k} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: B.muted, marginBottom: 6, letterSpacing: ".06em" }}>{label}</div>
              <input value={form[k]} onChange={set(k)} placeholder={ph} type={type} style={inp} />
            </div>
          ))}
          <div style={{ marginTop: 6, marginBottom: 22 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: B.muted, marginBottom: 10, letterSpacing: ".06em" }}>SEU SEGMENTO DE NEGÓCIO</div>
            <div style={{ display: "flex", gap: 8 }}>
              {regNiches.map(n => (
                <div key={n.id} onClick={() => setNiche(n.id)}
                  style={{ flex: 1, padding: "14px 8px", textAlign: "center", borderRadius: 12, border: `1px solid ${niche === n.id ? n.color + "75" : "rgba(255,255,255,0.1)"}`, background: niche === n.id ? n.color + "18" : "rgba(255,255,255,0.04)", backdropFilter: "blur(12px)", cursor: "pointer", transition: "all .15s", boxShadow: niche === n.id ? `0 4px 18px ${n.color}28, inset 0 1px 0 rgba(255,255,255,0.2)` : "inset 0 1px 0 rgba(255,255,255,0.07)" }}>
                  <div style={{ marginBottom: 8, display: "flex", justifyContent: "center" }}><n.icon size={24} color={niche === n.id ? n.color : B.muted} strokeWidth={1.6} /></div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: niche === n.id ? n.color : B.muted, lineHeight: 1.3 }}>{n.name}</div>
                </div>
              ))}
            </div>
          </div>
          <button onClick={handle} style={{ width: "100%", padding: "11px", borderRadius: 9, background: "#7B6CF6", color: "#fff", border: "1px solid #7B6CF680", fontSize: 14, cursor: "pointer", fontFamily: "inherit", fontWeight: 700, boxShadow: "0 4px 18px #7B6CF640, inset 0 1px 0 rgba(255,255,255,0.3)" }}>Criar conta →</button>
          <div style={{ marginTop: 20, textAlign: "center", fontSize: 12, color: B.muted }}>
            Já tem conta?{" "}<span onClick={onLogin} style={{ color: "#7B6CF6", cursor: "pointer", fontWeight: 600 }}>Entrar</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── PDF Export ────────────────────────────────────────────────────────────────
function makePDF(nomeNegocio, niche, sections) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const now = new Date().toLocaleString("pt-BR");

  // header
  doc.setFillColor(22, 27, 34);
  doc.rect(0, 0, W, 22, "F");
  doc.setTextColor(230, 232, 240);
  doc.setFontSize(13); doc.setFont("helvetica", "bold");
  doc.text("ControlCRM — Exportação de Dados", 14, 10);
  doc.setFontSize(8); doc.setFont("helvetica", "normal");
  doc.text(`${nomeNegocio} · ${niche}`, 14, 16);
  doc.text(`Gerado em ${now}`, W - 14, 16, { align: "right" });

  // migration notice
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

const ExportarDados = ({ N, user }) => {
  const nomeNegocio = user?.name ? `${user.name} — ${N.name}` : N.name;

  const sections = {
    clientes: {
      title: "Clientes / Pacientes",
      columns: ["Nome", "Telefone", "Última visita", "Total gasto"],
      rows: N.clients.map((c, i) => [c, `(11) 9${9800 + i * 111}-${7777 - i * 111}`, ["28/05", "12/05", "03/04", "—"][i] || "—", ["R$ 2.840", "R$ 1.620", "R$ 980", "R$ 450"][i] || "R$ 0"]),
    },
    servicos: {
      title: N.servicesLabel,
      columns: ["Nome", "Duração", "Preço", "Retorno"],
      rows: N.services.map(s => [s[0], s[1], s[2], s[3]]),
    },
    estoque: {
      title: `Estoque de ${N.stocksLabel}`,
      columns: [N.stockLabel, "Preço unit.", "Qtd. atual", "Mínimo"],
      rows: N.products.map(p => [p[0], p[1], p[2], p[3]]),
    },
    equipe: {
      title: `Equipe de ${N.proLabel}s`,
      columns: [N.proLabel, "Cargo", "Comissão"],
      rows: N.pros.map(p => [p, N.proLabel, "40%"]),
    },
    financeiro: {
      title: "Resumo Financeiro",
      columns: ["Indicador", "Valor"],
      rows: N.kpis.map(k => [k.l, k.v]),
    },
  };

  const nicheExtra = {
    clinica: {
      anamnese: { title: "Campos de Anamnese (padrão)", columns: ["Campo", "Tipo"], rows: [["Alergias", "Texto"], ["Gravidez", "Sim/Não"], ["Anticoagulantes", "Texto"], ["Doenças autoimunes", "Sim/Não"]] },
      comandas: { title: "Protocolos / Comandas", columns: ["Paciente", "Procedimento", "Sessões"], rows: N.clients.map((c, i) => [c, N.services[i % N.services.length][0], `${i + 1}/3`]) },
    },
    barbearia: {
      assinaturas: { title: "Planos de Assinatura", columns: ["Plano", "Preço", "Assinantes"], rows: [["Plano Básico", "R$ 99/mês", "2"], ["Plano Premium", "R$ 149/mês", "2"], ["Plano VIP", "R$ 199/mês", "0"]] },
      fila: { title: "Tipos de Cliente", columns: ["Tipo", "Descrição"], rows: [["Assinante", "Cliente com plano mensal ativo"], ["Avulso", "Cliente sem plano (walk-in)"]] },
    },
    mecanica: {
      veiculos: { title: "Histórico de Veículos", columns: ["Cliente", "Veículo", "Placa", "KM"], rows: N.clients.map((c, i) => [c, ["Honda Civic", "Toyota Corolla", "VW Polo", "Fiat Argo"][i] || "—", `ABC-${1000 + i * 111}`, `${45000 + i * 8000}`]) },
      os: { title: "Ordens de Serviço (modelo)", columns: ["OS", "Cliente", "Veículo", "Status", "Valor"], rows: N.clients.map((c, i) => [`OS-00${i + 1}`, c, N.services[i % N.services.length][0], ["Concluído", "Em andamento", "Concluído", "Aberta"][i] || "Aberta", N.services[i % N.services.length][2]]) },
    },
  };

  const allSections = [
    ...Object.values(sections),
    ...Object.values(nicheExtra[N.id] || {}),
  ];

  const exportAll = () => makePDF(nomeNegocio, N.name, allSections);
  const exportSection = (key) => {
    const s = sections[key] || Object.values(nicheExtra[N.id] || {}).find((_, i) => Object.keys(nicheExtra[N.id] || {})[i] === key);
    if (s) makePDF(nomeNegocio, N.name, [s]);
  };

  const sectionList = [
    ...Object.entries(sections).map(([k, s]) => ({ key: k, ...s, icon: Package })),
    ...Object.entries(nicheExtra[N.id] || {}).map(([k, s]) => ({ key: k, ...s, icon: FileText })),
  ];
  const icons = { clientes: Users, servicos: ClipboardList, estoque: Package, equipe: Users, financeiro: Wallet, anamnese: FileHeart, comandas: FileText, assinaturas: CreditCard, fila: ListOrdered, veiculos: Car, os: FileCheck };

  return (
    <Col gap={16}>
      <PH title="Exportar Dados" sub="Gere PDFs para migração ou backup do seu sistema" N={N} />

      {/* Aviso de migração */}
      <Card>
        <Row gap={12}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: N.color + "20", border: `0.5px solid ${N.color}40`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <FileText size={20} color={N.color} strokeWidth={1.8} />
          </div>
          <Col gap={4} style={{ flex: 1 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: B.text }}>Exportação para migração de sistema</span>
            <span style={{ fontSize: 11, color: B.muted, lineHeight: 1.6 }}>
              Os PDFs gerados contêm todos os seus dados estruturados em tabelas prontas para importação em outro sistema.
              Exporte por seção ou gere um arquivo completo com todas as informações de uma vez.
            </span>
          </Col>
        </Row>
      </Card>

      {/* Exportar tudo */}
      <Card style={{ border: `1px solid ${N.color}40`, background: N.color + "08" }}>
        <Row style={{ justifyContent: "space-between", alignItems: "center" }}>
          <Col gap={4}>
            <span style={{ fontSize: 14, fontWeight: 700, color: B.text }}>Exportação completa</span>
            <span style={{ fontSize: 11, color: B.muted }}>{allSections.length} seções · Clientes, serviços, estoque, equipe, financeiro {Object.keys(nicheExtra[N.id] || {}).length > 0 ? "e mais" : ""}</span>
          </Col>
          <button onClick={exportAll} style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 22px", borderRadius: 9, background: N.color, color: "#fff", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 700, boxShadow: `0 4px 18px ${N.color}40` }}>
            <FileText size={15} strokeWidth={2} /> Exportar tudo em PDF
          </button>
        </Row>
      </Card>

      {/* Seções individuais */}
      <div style={{ fontSize: 10, fontWeight: 700, color: N.color, letterSpacing: ".08em" }}>EXPORTAR POR SEÇÃO</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
        {sectionList.map(s => {
          const Icon = icons[s.key] || FileText;
          return (
            <Card key={s.key} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px" }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: B.bg2, border: `0.5px solid ${B.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={17} color={N.color} strokeWidth={1.8} />
              </div>
              <Col gap={2} style={{ flex: 1 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: B.text }}>{s.title}</span>
                <span style={{ fontSize: 10, color: B.muted }}>{s.rows.length} registros</span>
              </Col>
              <button onClick={() => makePDF(nomeNegocio, N.name, [s])} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 13px", borderRadius: 7, background: B.bg2, color: B.muted, border: `0.5px solid ${B.border}`, cursor: "pointer", fontFamily: "inherit", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>
                <FileText size={12} strokeWidth={1.8} /> PDF
              </button>
            </Card>
          );
        })}
      </div>

      {/* Instruções */}
      <Card title="Como usar no novo sistema">
        {[
          ["1. Exporte os dados", "Clique em 'Exportar tudo em PDF' ou exporte seção por seção."],
          ["2. Abra o PDF gerado", "O arquivo será baixado automaticamente com todos os dados em tabelas."],
          ["3. Importe no novo sistema", "Use as tabelas do PDF para preencher os cadastros do novo sistema manualmente ou via importação CSV."],
          ["4. Verifique os dados", "Confira que todos os clientes, serviços e histórico foram migrados corretamente antes de encerrar o ControlCRM."],
        ].map(([t, d], i) => (
          <Row key={i} gap={12} style={{ borderBottom: i < 3 ? `0.5px solid ${B.border}` : "none", padding: "10px 0" }}>
            <div style={{ width: 24, height: 24, borderRadius: "50%", background: N.color + "20", border: `0.5px solid ${N.color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: N.color, flexShrink: 0 }}>{i + 1}</div>
            <Col gap={2}><span style={{ fontSize: 12, fontWeight: 600, color: B.text }}>{t}</span><span style={{ fontSize: 11, color: B.muted }}>{d}</span></Col>
          </Row>
        ))}
      </Card>
    </Col>
  );
};

// ── Navigation config per niche ────────────────────────────────────────────────
const NICHE_GROUPS = {
  clinica: [
    { label: "CORE DO SISTEMA", items: [
      { id: "dashboard",     icon: LayoutDashboard, label: "Visão Geral" },
      { id: "estoque",       icon: Package,         label: "Estoque" },
      { id: "servicos",      icon: ClipboardList,   label: "Procedimentos" },
      { id: "agenda",        icon: CalendarDays,    label: "Agenda" },
      { id: "comanda",       icon: FileText,        label: "Comanda" },
      { id: "ficharegistro", icon: User,            label: "Ficha do Paciente" },
      { id: "anamnese",      icon: FileHeart,       label: "Anamnese & Docs" },
      { id: "financeiro",    icon: Wallet,          label: "Financeiro" },
    ] },
    { label: "GESTÃO & ANALYTICS", items: [
      { id: "portfolio",     icon: Image,           label: "Portfólio Digital" },
    ] },
    { label: "FUNCIONALIDADES", items: [
      { id: "multiprofissional", icon: Users,       label: "Multiprofissional" },
      { id: "lembretes",         icon: Bell,        label: "Lembretes & Remarketing" },
    ] },
    { label: "CONFIGURAÇÕES", items: [
      { id: "whatsappemail", icon: MessageSquare,   label: "Integrações" },
      { id: "taxas",         icon: Settings,        label: "Taxas & Config" },
      { id: "exportar",      icon: Download,        label: "Exportar Dados" },
    ] },
  ],
  barbearia: [
    { label: "CORE DO SISTEMA", items: [
      { id: "dashboard",     icon: LayoutDashboard, label: "Visão Geral" },
      { id: "estoque",       icon: Package,         label: "Estoque" },
      { id: "servicos",      icon: Scissors,        label: "Serviços" },
      { id: "agenda",        icon: CalendarDays,    label: "Agenda" },
      { id: "fila",          icon: ListOrdered,     label: "Fila de Espera" },
      { id: "ficharegistro", icon: User,            label: "Ficha do Cliente" },
      { id: "financeiro",    icon: Wallet,          label: "Financeiro" },
    ] },
    { label: "FUNCIONALIDADES", items: [
      { id: "assinaturas",       icon: CreditCard,  label: "Assinaturas" },
      { id: "multiprofissional", icon: Users,       label: "Multiprofissional" },
      { id: "lembretes",         icon: Bell,        label: "Lembretes & Remarketing" },
    ] },
    { label: "CONFIGURAÇÕES", items: [
      { id: "whatsappemail", icon: MessageSquare,   label: "Integrações" },
      { id: "taxas",         icon: Settings,        label: "Taxas & Config" },
      { id: "exportar",      icon: Download,        label: "Exportar Dados" },
    ] },
  ],
  mecanica: [
    { label: "CORE DO SISTEMA", items: [
      { id: "dashboard",     icon: LayoutDashboard, label: "Visão Geral" },
      { id: "estoque",       icon: Nut,             label: "Estoque de Peças" },
      { id: "servicos",      icon: Wrench,          label: "Serviços" },
      { id: "agenda",        icon: CalendarDays,    label: "Agenda" },
      { id: "os",            icon: FileCheck,       label: "Ordens de Serviço" },
      { id: "ficharegistro", icon: Car,             label: "Fichas de Veículos" },
      { id: "financeiro",    icon: Wallet,          label: "Financeiro" },
    ] },
    { label: "GESTÃO & ANALYTICS", items: [
      { id: "orcamentos",    icon: FolderOpen,      label: "Orçamentos" },
    ] },
    { label: "FUNCIONALIDADES", items: [
      { id: "multiprofissional", icon: Users,       label: "Multiprofissional" },
      { id: "lembretes",         icon: Bell,        label: "Lembretes & Remarketing" },
    ] },
    { label: "CONFIGURAÇÕES", items: [
      { id: "whatsappemail", icon: MessageSquare,   label: "Integrações" },
      { id: "taxas",         icon: Settings,        label: "Taxas & Config" },
      { id: "exportar",      icon: Download,        label: "Exportar Dados" },
    ] },
  ],
};

// ── App ────────────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState(() => loadSession() ? "app" : "landing");
  const [user, setUser] = useState(loadSession);
  const [currentNiche, setCurrentNiche] = useState(() => {
    const u = loadSession();
    return u ? u.niche : "clinica";
  });
  const [active, setActive] = useState(() => {
    const u = loadSession();
    return u ? NICHE_GROUPS[u.niche][0].items[0].id : null;
  });

  const enterApp = u => {
    setUser(u);
    setCurrentNiche(u.niche);
    setPage("app");
    setActive(NICHE_GROUPS[u.niche][0].items[0].id);
  };

  const switchNiche = (nicheId) => {
    setCurrentNiche(nicheId);
    setActive(NICHE_GROUPS[nicheId][0].items[0].id);
  };

  const logout = () => {
    clearSession();
    setUser(null);
    setPage("landing");
    setActive(null);
  };

  if (page === "landing") return <LandingPage onLogin={() => setPage("login")} onRegister={() => setPage("register")} />;
  if (page === "login") return <LoginPage onSuccess={enterApp} onRegister={() => setPage("register")} onBack={() => setPage("landing")} />;
  if (page === "register") return <RegisterPage onSuccess={enterApp} onLogin={() => setPage("login")} onBack={() => setPage("landing")} />;

  const N = NICHES[currentNiche];
  const groups = NICHE_GROUPS[currentNiche];

  const screens = {
    dashboard: <Dashboard N={N} user={user} onNavigate={setActive} />,
    estoque: <Estoque N={N} />,
    servicos: <Servicos N={N} />,
    agenda: <Agenda N={N} />,
    financeiro: <Financeiro N={N} />,
    multiprofissional: <Multiprofissional N={N} />,
    whatsappemail: <WhatsAppEmail N={N} />,
    taxas: <Taxas N={N} />,
    comanda: <Comanda N={N} />,
    ficharegistro: currentNiche === "mecanica" ? <FichaVeiculo N={N} /> : currentNiche === "barbearia" ? <FichaClienteBarb N={N} /> : <FichaPaciente N={N} />,
    fila: <FilaEspera N={N} />,
    assinaturas: <Assinaturas N={N} />,
    os: <OrdemServico N={N} />,
    orcamentos: <Orcamentos N={N} />,
    lembretes: <Lembretes N={N} />,
    anamnese: <Anamnese N={N} />,
    portfolio: <Portfolio N={N} />,
    exportar: <ExportarDados N={N} user={user} />,
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: B.bg, color: B.text, fontFamily: '"DM Sans", system-ui, sans-serif', overflow: "hidden" }}>
      <GlobalStyles />
      {/* Sidebar */}
      <div style={{ width: 230, background: "#08090F", borderRight: `1px solid ${B.border}`, display: "flex", flexDirection: "column", overflow: "hidden", flexShrink: 0, boxShadow: `4px 0 28px rgba(0,0,0,0.4)` }}>
        {/* Brand header */}
        <div style={{ padding: "16px 14px 14px", borderBottom: `1px solid ${B.border}` }}>
          <Row gap={10}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${N.color}30, ${N.color}10)`, border: `1px solid ${N.color}50`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 4px 16px ${N.color}28, inset 0 1px 0 rgba(255,255,255,0.2)` }}>
              <N.icon size={17} color={N.color} strokeWidth={1.8} />
            </div>
            <Col gap={2} style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: B.text, letterSpacing: "-.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{N.name}</div>
              <div style={{ fontSize: 10, color: B.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</div>
            </Col>
          </Row>
          {user.email === ADMIN_EMAIL && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#C9A227", letterSpacing: ".1em", marginBottom: 7, display: "flex", alignItems: "center", gap: 5 }}>
                <Crown size={10} color="#C9A227" strokeWidth={2} /> ADMIN — TROCAR NICHO
              </div>
              <div style={{ display: "flex", gap: 5 }}>
                {Object.values(NICHES).map(n => (
                  <div key={n.id} onClick={() => switchNiche(n.id)} title={n.name}
                    style={{ flex: 1, padding: "7px 4px", borderRadius: 9, cursor: "pointer", textAlign: "center", transition: "all .15s",
                      background: currentNiche === n.id ? n.color + "22" : "rgba(255,255,255,0.03)",
                      border: `1px solid ${currentNiche === n.id ? n.color + "70" : "rgba(255,255,255,0.08)"}`,
                      boxShadow: currentNiche === n.id ? `0 2px 14px ${n.color}28, inset 0 1px 0 rgba(255,255,255,0.14)` : "none",
                    }}>
                    <div style={{ display: "flex", justifyContent: "center" }}><n.icon size={14} color={currentNiche === n.id ? n.color : B.dim} strokeWidth={1.8} /></div>
                    <div style={{ fontSize: 8, fontWeight: 700, color: currentNiche === n.id ? n.color : B.dim, marginTop: 3, letterSpacing: ".04em" }}>{n.name.split(" ")[0].toUpperCase()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        {/* Nav */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 8px 0" }}>
          {groups.map(g => (
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
                      boxShadow: isActive ? `0 2px 12px ${N.color}16, inset 0 1px 0 rgba(255,255,255,0.07)` : "none",
                    }}>
                    <item.icon size={13} strokeWidth={isActive ? 2 : 1.8} style={{ flexShrink: 0 }} />
                    {item.label}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        {/* Logout */}
        <div style={{ padding: "8px 8px 10px" }}>
          <div onClick={logout}
            style={{ padding: "9px 12px", borderRadius: 9, border: `1px solid ${B.border}`, background: "transparent", fontSize: 11, fontWeight: 500, color: B.muted, cursor: "pointer", display: "flex", alignItems: "center", gap: 7, transition: "all .14s" }}
            onMouseEnter={e => { e.currentTarget.style.background = B.card; e.currentTarget.style.color = B.text; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = B.muted; }}
          >
            <LogOut size={12} strokeWidth={1.8} /> Sair da conta
          </div>
        </div>
      </div>
      {/* Main */}
      <div style={{ flex: 1, overflow: "auto", padding: "28px 32px", background: B.bg }}>
        {screens[active] || <div style={{ color: B.muted, marginTop: 60, textAlign: "center", fontSize: 13 }}>Selecione um módulo</div>}
      </div>
    </div>
  );
}
