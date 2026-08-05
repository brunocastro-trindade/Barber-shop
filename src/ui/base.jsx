// Peças de UI do painel. Sem nada de domínio aqui dentro: estes componentes não
// sabem o que é uma visita ou um agendamento, só como desenhar uma linha, um
// cartão ou um campo.
//
// A área do cliente (src/cliente/ui.jsx) tem peças próprias, mobile-first, e
// reaproveita daqui só o que é idêntico.
import { useState, useEffect } from "react";
import { Loader2, AlertTriangle, X, Download } from "lucide-react";
import { emReais } from "../lib/formato.js";
import { B, N, inputBase } from "./tokens.js";

export const GlobalStyles = () => {
  useEffect(() => {
    const s = document.createElement("style");
    s.id = "crm-gs";
    s.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap');
      *{box-sizing:border-box}body{margin:0}
      ::-webkit-scrollbar{width:4px;height:4px}
      ::-webkit-scrollbar-track{background:transparent}
      ::-webkit-scrollbar-thumb{background:#221B38;border-radius:10px}
      ::-webkit-scrollbar-thumb:hover{background:#2E2549}
      ::selection{background:#8B5CF645;color:#F2F0FA}
      input,select,textarea{transition:border-color .15s,box-shadow .15s}
      input:focus,select:focus,textarea:focus{border-color:#8B5CF680!important;box-shadow:0 0 0 3px #8B5CF61E!important;outline:none!important}
      .crm-nav:hover{background:rgba(255,255,255,0.04)!important;color:#A79FC4!important}
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
export const Row = ({ children, style, gap = 10, onClick }) => (
  <div onClick={onClick} style={{ display: "flex", gap, alignItems: "center", ...style }}>{children}</div>
);
export const Col = ({ children, style, gap = 10 }) => (
  <div style={{ display: "flex", flexDirection: "column", gap, ...style }}>{children}</div>
);

export const Btn = ({ children, color, sm, danger, outline, onClick, disabled }) => {
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
        padding: sm ? "5px 13px" : "8px 18px", borderRadius: 999,
        fontSize: sm ? 11 : 12, fontWeight: 600, letterSpacing: ".01em",
        transition: "all 0.14s ease",
        background: isColor
          ? hov && !disabled ? color : color + "e8"
          : danger ? (hov ? "rgba(58,18,18,.95)" : "rgba(40,14,14,.85)")
          : outline ? (hov ? color + "18" : "transparent")
          : hov ? "#1E1734" : "#161126",
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

export const Badge = ({ text, color }) => {
  const c = color || B.teal;
  return <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: c + "1e", color: c, border: `1px solid ${c}38`, letterSpacing: ".02em", whiteSpace: "nowrap" }}>{text}</span>;
};

export const Stat = ({ label, value, sub, color }) => (
  <div style={{
    background: `linear-gradient(160deg, ${B.card2} 0%, ${B.card} 100%)`,
    border: `1px solid ${B.border}`,
    borderRadius: 18, padding: "18px 20px", flex: 1, minWidth: 0,
    boxShadow: "0 20px 50px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05)",
    position: "relative", overflow: "hidden",
  }}>
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: color ? `radial-gradient(ellipse 70% 90% at 100% 0%, ${color}20, transparent 65%)` : "none" }} />
    <div style={{ position: "relative", fontSize: 10, fontWeight: 600, color: B.muted, marginBottom: 10, letterSpacing: ".08em", textTransform: "uppercase" }}>{label}</div>
    <div style={{ position: "relative", fontSize: 27, fontWeight: 800, color: color || B.text, letterSpacing: "-0.03em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{value}</div>
    {sub && <div style={{ position: "relative", fontSize: 11, color: B.muted, marginTop: 7 }}>{sub}</div>}
  </div>
);

export const Card = ({ children, title, action, style, accentColor }) => (
  <div style={{
    background: B.card, border: `1px solid ${B.border}`, borderRadius: 20, padding: 20,
    boxShadow: "0 20px 60px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)",
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
export const ChartBar = ({ h = 120, valores, rotulos, color }) => {
  const c = color || B.teal;
  const max = Math.max(...valores, 1);
  return (
    <div>
      <div style={{ height: h, background: B.bg2, borderRadius: 14, border: `1px solid ${B.border}`, position: "relative", overflow: "hidden" }}>
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

export const ChartLine = ({ h = 110, valores, color }) => {
  const c = color || B.teal;
  const max = Math.max(...valores, 1);
  const pontos = valores.map((v, i) => {
    const x = valores.length > 1 ? (i / (valores.length - 1)) * 300 : 0;
    const y = 72 - (v / max) * 62;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const linha = pontos.join(" ");
  return (
    <div style={{ height: h, background: B.bg2, borderRadius: 14, border: `1px solid ${B.border}`, overflow: "hidden" }}>
      <svg width="100%" height="100%" viewBox="0 0 300 80" preserveAspectRatio="none">
        <polygon points={`0,80 ${linha} 300,80`} fill={c + "20"} />
        <polyline points={linha} fill="none" stroke={c} strokeWidth="2" />
      </svg>
    </div>
  );
};

export const ImgBox = ({ h = 80, label }) => (
  <div style={{ height: h, background: B.bg2, border: `1px solid ${B.border}`, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", color: B.dim, fontSize: 10, flexShrink: 0 }}>
    {label || "[ img ]"}
  </div>
);

export const Field = ({ label, type = "text", placeholder, value, onChange, options, name }) => {
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

export const Divider = () => <div style={{ height: "1px", background: B.border, margin: "12px 0", opacity: 0.7 }} />;

export const Table = ({ cols, rows }) => (
  <div style={{ borderRadius: 16, overflow: "hidden", border: `1px solid ${B.border}` }}>
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

export const Avatar = ({ name, color, size = 28 }) => {
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

export const PH = ({ title, sub, action, onAction, onExport }) => (
  <div style={{ marginBottom: 28 }}>
    <Row style={{ alignItems: "flex-start" }}>
      <Col gap={5} style={{ flex: 1 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: B.text, margin: 0, letterSpacing: "-0.04em", lineHeight: 1.1 }}>{title}</h2>
        {sub && <p style={{ fontSize: 12, color: B.muted, margin: 0, fontWeight: 400 }}>{sub}</p>}
      </Col>
      <Row gap={8}>
        {onExport && (
          <button onClick={onExport} title="Exportar PDF"
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 15px", borderRadius: 999, background: B.card, border: `1px solid ${B.border}`, color: B.muted, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)", transition: "all .14s" }}
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

export const Girando = ({ size = 14, color }) => (
  <Loader2 size={size} color={color || B.muted} strokeWidth={2} className="crm-girar" />
);

export const Carregando = ({ texto = "Carregando..." }) => (
  <Row gap={8} style={{ padding: "28px 0", justifyContent: "center", color: B.muted, fontSize: 12 }}>
    <Girando /> {texto}
  </Row>
);

export const Aviso = ({ texto, onFechar }) => texto ? (
  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", background: B.red + "14", border: `1px solid ${B.red}45`, borderRadius: 14, fontSize: 12, color: B.red }}>
    <AlertTriangle size={15} strokeWidth={1.9} style={{ flexShrink: 0 }} />
    <span style={{ flex: 1 }}>{texto}</span>
    {onFechar && <span onClick={onFechar} style={{ cursor: "pointer", opacity: 0.8 }}><X size={14} strokeWidth={2.2} /></span>}
  </div>
) : null;

export const Vazio = ({ texto }) => (
  <div style={{ fontSize: 12, color: B.muted, padding: "18px 0", textAlign: "center" }}>{texto}</div>
);

