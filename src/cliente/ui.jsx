// Peças de interface da área do cliente. Ficam separadas porque as três telas
// (início, busca e estabelecimento) montam as mesmas coisas: cartão, logo da
// barbearia, estrelas, campo de busca.
//
// `Girando`, `Carregando` e `Vazio` têm xarás em src/ui/base.jsx, e isso NÃO é
// duplicação a ser unificada: são dois produtos com linguagens visuais
// diferentes. O painel é desktop-first e escuro (tokens `B`); aqui é
// mobile-first (tokens `LP`). O `Vazio` de lá é uma linha de texto; o daqui é um
// estado vazio com ícone e título. Juntar os dois quebraria um dos dois.

import { Loader2, AlertTriangle, X, Star, Search } from "lucide-react";
import { LP } from "../lib/tema.js";
import { campoEstilo } from "./formatos.js";

// ── Estados ───────────────────────────────────────────────────────────────────

export const Girando = ({ size = 15 }) => (
  <Loader2 size={size} color={LP.dim} strokeWidth={2} className="crm-girar" />
);

export const Carregando = ({ texto = "Carregando..." }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9, padding: "34px 0", color: LP.dim, fontSize: 13 }}>
    <Girando /> {texto}
  </div>
);

export const Erro = ({ texto, onFechar }) => texto ? (
  <div style={{
    display: "flex", alignItems: "center", gap: 10, padding: "12px 15px",
    background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.35)",
    borderRadius: 14, fontSize: 13, color: "#FCA5A5", marginBottom: 16,
  }}>
    <AlertTriangle size={16} strokeWidth={1.9} style={{ flexShrink: 0 }} />
    <span style={{ flex: 1, lineHeight: 1.5 }}>{texto}</span>
    {onFechar && <X size={15} strokeWidth={2.2} style={{ cursor: "pointer", flexShrink: 0 }} onClick={onFechar} />}
  </div>
) : null;

export const Vazio = ({ icone, titulo, texto }) => (
  <div style={{ textAlign: "center", padding: "56px 24px" }}>
    {icone && (
      <div style={{
        width: 72, height: 72, borderRadius: "50%", margin: "0 auto 20px",
        background: "rgba(255,255,255,0.04)", border: `1px solid ${LP.border}`,
        display: "flex", alignItems: "center", justifyContent: "center", color: LP.dimmer,
      }}>{icone}</div>
    )}
    <div style={{ fontSize: 17, fontWeight: 700, color: "#fff", marginBottom: 8 }}>{titulo}</div>
    {texto && <div style={{ fontSize: 13.5, color: LP.dim, lineHeight: 1.6 }}>{texto}</div>}
  </div>
);

// ── Blocos ────────────────────────────────────────────────────────────────────

export const Cartao = ({ children, style, destaque, onClick }) => (
  <div onClick={onClick} style={{
    background: destaque
      ? `linear-gradient(160deg, ${LP.roxo}22, rgba(255,255,255,0.02))`
      : LP.card,
    border: `1px solid ${destaque ? LP.roxo + "50" : LP.border}`,
    borderRadius: 20, padding: 20,
    boxShadow: destaque
      ? `0 0 40px ${LP.roxo}22, 0 20px 50px rgba(0,0,0,0.4)`
      : "0 16px 44px rgba(0,0,0,0.3)",
    cursor: onClick ? "pointer" : undefined,
    ...style,
  }}>{children}</div>
);

export const Rotulo = ({ children, acao }) => (
  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
    <div style={{ fontSize: 10, fontWeight: 700, color: LP.dimmer, letterSpacing: ".13em", textTransform: "uppercase" }}>
      {children}
    </div>
    {acao}
  </div>
);

export const Titulo = ({ children, style }) => (
  <h2 style={{ fontSize: 23, fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "-0.03em", lineHeight: 1.2, ...style }}>
    {children}
  </h2>
);

export const Estrelas = ({ nota, size = 13, mostrarNumero = true }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
    <span style={{ display: "inline-flex", gap: 1 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={size}
          color={i <= Math.round(nota) ? "#F59E0B" : LP.dimmer}
          fill={i <= Math.round(nota) ? "#F59E0B" : "transparent"}
          strokeWidth={i <= Math.round(nota) ? 0 : 1.6} />
      ))}
    </span>
    {mostrarNumero && (
      <span style={{ fontSize: size - 1, color: "#F59E0B", fontWeight: 700 }}>
        {Number(nota).toFixed(1)}
      </span>
    )}
  </span>
);

// Logo da barbearia: as iniciais num círculo com a cor da casa. Substitui a
// imagem real que uma barbearia de verdade subiria no cadastro.
//
// Sem o selo de nota que ficava no canto: a média vinha de `loja.nota`, que o
// servidor devolvia como 4,9 fixo quando a barbearia não tinha avaliação
// nenhuma. Estrela inventada em cima do nome de um negócio real.
export const LogoLoja = ({ loja, size = 48 }) => {
  const cor = loja?.cor || LP.roxo;
  return (
    <div style={{ position: "relative", flexShrink: 0, width: size, height: size }}>
      <div style={{
        width: size, height: size, borderRadius: "50%",
        background: `linear-gradient(140deg, ${cor}, ${cor}70)`,
        border: `1.5px solid ${cor}90`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: Math.round(size / 2.6), fontWeight: 800, color: "#fff",
        letterSpacing: "-0.02em",
        boxShadow: `0 6px 20px ${cor}45`,
      }}>{loja?.sigla || "?"}</div>
    </div>
  );
};

// Avatar de pessoa (barbeiro ou quem avaliou).
export const Inicial = ({ nome, size = 40, cor }) => {
  const c = cor || LP.roxo;
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: `linear-gradient(135deg, ${c}66, ${c}1E)`,
      border: `1.5px solid ${c}55`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: Math.round(size / 2.4), fontWeight: 800, color: LP.roxoClaro,
    }}>{nome ? nome[0].toUpperCase() : "?"}</div>
  );
};

export const Opcao = ({ children, ativo, onClick, style }) => (
  <div className="lp-op" onClick={onClick} style={{
    padding: "15px 17px", borderRadius: 16, cursor: "pointer",
    border: `1px solid ${ativo ? LP.roxo : LP.border}`,
    background: ativo ? `${LP.roxo}1E` : "rgba(255,255,255,0.02)",
    display: "flex", alignItems: "center", gap: 13,
    ...style,
  }}>{children}</div>
);

// Pílula de filtro (Nome / Cidade / Próximas, Todos / Produtos / Serviços...).
export const Chip = ({ children, ativo, onClick }) => (
  <button onClick={onClick} className="lp-btn" style={{
    display: "inline-flex", alignItems: "center", gap: 6, flexShrink: 0,
    padding: "9px 18px", borderRadius: 999, cursor: "pointer", fontFamily: "inherit",
    fontSize: 13, fontWeight: 600, whiteSpace: "nowrap",
    border: `1px solid ${ativo ? LP.roxo : LP.border}`,
    background: ativo ? `${LP.roxo}2E` : "rgba(255,255,255,0.03)",
    color: ativo ? "#fff" : LP.dim,
  }}>{children}</button>
);

// `style` recebido soma-se ao estilo base em vez de substituí-lo: com o spread
// depois do style, quem passasse `style` perdia borda, fundo e espaçamento.
export const Campo = ({ rotulo, style, ...props }) => (
  <div style={{ marginBottom: 14 }}>
    {rotulo && <Rotulo>{rotulo}</Rotulo>}
    <input {...props} style={{ ...campoEstilo, ...style }} />
  </div>
);

// Campo de busca com a lupa embutida.
export const Busca = ({ valor, onChange, placeholder, onClick, autoFocus }) => (
  <div onClick={onClick} style={{ position: "relative", cursor: onClick ? "pointer" : undefined }}>
    <Search size={17} color={LP.dimmer} strokeWidth={2}
      style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
    <input
      value={valor}
      onChange={onChange ? (e => onChange(e.target.value)) : undefined}
      placeholder={placeholder}
      readOnly={!onChange}
      autoFocus={autoFocus}
      style={{ ...campoEstilo, paddingLeft: 44, fontSize: 15, cursor: onClick ? "pointer" : undefined }}
    />
  </div>
);

// Linha de uma barbearia na busca e nos favoritos.
export const LinhaLoja = ({ loja, onClick, direita }) => (
  <div className="lp-op" onClick={onClick} style={{
    display: "flex", alignItems: "center", gap: 14, padding: "14px 4px",
    borderBottom: `1px solid ${LP.border}`, cursor: "pointer",
  }}>
    <LogoLoja loja={loja} size={48} />
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 3 }}>{loja.nome}</div>
      {/* Saíram daqui o endereço e a cidade (fixos no código, iguais para toda
          barbearia) e a distância, que nunca teve fonte de dados: não há
          geolocalização nem endereço cadastrado. Sobra o dono, que é real. */}
      <div style={{ fontSize: 12, color: LP.dim, lineHeight: 1.5 }}>{loja.dono}</div>
    </div>
    {direita}
  </div>
);
