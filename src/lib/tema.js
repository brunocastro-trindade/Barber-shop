// Tokens visuais compartilhados entre a landing e a área do cliente.
// O painel do dono (src/App.jsx) usa a paleta B, mais densa; estas cores são
// da "vitrine": fundo quase preto arroxeado, glow violeta e muito respiro.

export const LP = {
  bg: "#050309",
  text: "#F2F0FA",
  dim: "#928CAB",
  dimmer: "#5B5570",
  border: "rgba(255,255,255,0.08)",
  card: "rgba(255,255,255,0.025)",
  roxo: "#8B5CF6",
  roxoClaro: "#C4B5FD",
};

export const lpBtnPrimario = {
  padding: "13px 28px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.22)",
  background: "linear-gradient(180deg, #9F7AFF 0%, #7C4DEF 100%)", color: "#fff",
  fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
  boxShadow: "0 0 0 1px rgba(139,92,246,0.35), 0 8px 32px rgba(139,92,246,0.45), inset 0 1px 0 rgba(255,255,255,0.35)",
};

export const lpBtnFantasma = {
  padding: "13px 28px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.04)", color: LP.text, fontSize: 14, fontWeight: 500,
  cursor: "pointer", fontFamily: "inherit", backdropFilter: "blur(12px)",
};

// Regras de hover/animação usadas pelas duas telas. Injetadas uma única vez,
// por id, para não duplicar a tag quando os dois componentes montam juntos.
export const CSS_VITRINE = `
  .lp-link{color:${LP.dim};cursor:pointer;transition:color .2s;text-decoration:none;font-size:14px}
  .lp-link:hover{color:#fff}
  .lp-btn{transition:transform .18s ease, box-shadow .18s ease, background .18s ease}
  .lp-btn:hover{transform:translateY(-1px)}
  .lp-btn:disabled{opacity:.45;cursor:not-allowed;transform:none}
  .lp-btn-primario:hover:not(:disabled){box-shadow:0 0 0 1px rgba(139,92,246,.5),0 12px 44px rgba(139,92,246,.6),inset 0 1px 0 rgba(255,255,255,.35)!important}
  .lp-btn-fantasma:hover:not(:disabled){background:rgba(255,255,255,.08)!important}
  @keyframes lpSubir{from{opacity:0;transform:translateY(26px)}to{opacity:1;transform:translateY(0)}}
  .lp-anim{animation:lpSubir .8s cubic-bezier(.2,.65,.3,1) both}
  .lp-op{transition:border-color .18s, background .18s, transform .18s}
  .lp-op:hover{border-color:${LP.roxo}70!important;background:rgba(139,92,246,.09)!important}
  @media(max-width:900px){
    .lp-nav-links{display:none!important}
    .lp-recursos{grid-template-columns:1fr!important}
    .lp-footer{flex-direction:column;gap:32px}
    .lp-hero-botoes{flex-direction:column;align-items:center}
  }
  /* No celular a barra só comporta uma ação: fica a do visitante mais
     provável — o cliente que veio marcar corte. O resto vai para o rodapé. */
  @media(max-width:620px){
    .lp-so-desktop{display:none!important}
    .lp-nav-acoes button{padding:8px 16px!important;font-size:12.5px!important}
  }
`;
