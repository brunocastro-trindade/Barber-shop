// Tokens visuais compartilhados entre a landing e a área do cliente.
// O painel do dono (src/App.jsx) usa a paleta B, mais densa; estas cores são
// da "vitrine": fundo quase preto arroxeado, glow violeta e muito respiro.

export const LP = {
  bg: "#121418",
  text: "#F1F5F9",
  dim: "#94A3B8",
  dimmer: "#64748B",
  border: "rgba(241, 245, 249, 0.1)",
  card: "rgba(241, 245, 249, 0.03)",
  roxo: "#7C3AED",
  roxoClaro: "#A78BFA",
  laranja: "#FF5500",
};

export const lpBtnPrimario = {
  padding: "13px 28px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.22)",
  background: "linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)", color: "#fff",
  fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
  boxShadow: "0 0 0 1px rgba(124,58,237,0.35), 0 8px 32px rgba(124,58,237,0.45), inset 0 1px 0 rgba(255,255,255,0.35)",
};

export const lpBtnFantasma = {
  padding: "13px 28px", borderRadius: 999, border: "1px solid rgba(241, 245, 249, 0.14)",
  background: "rgba(241, 245, 249, 0.04)", color: LP.text, fontSize: 14, fontWeight: 500,
  cursor: "pointer", fontFamily: "inherit", backdropFilter: "blur(12px)",
};

// Regras de hover/animação usadas pelas duas telas. Injetadas uma única vez,
// por id, para não duplicar a tag quando os dois componentes montam juntos.
export const CSS_VITRINE = `
  .lp-link{color:${LP.dim};cursor:pointer;transition:color .2s;text-decoration:none;font-size:14px}
  .lp-link:hover{color:#fff}
  .lp-btn{transition:transform .2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow .2s ease, background .2s ease, border-color .2s ease}
  .lp-btn:hover:not(:disabled){
    transform:translateY(-2px) scale(1.02)!important;
    background:linear-gradient(135deg, #FF5500 0%, #FF3300 100%)!important;
    border-color:#FF5500!important;
    color:#ffffff!important;
    box-shadow:0 0 32px rgba(255,85,0,0.8), 0 8px 24px rgba(255,85,0,0.55), inset 0 1px 0 rgba(255,255,255,0.4)!important;
  }
  .lp-btn:disabled{opacity:.45;cursor:not-allowed;transform:none}
  @keyframes lpSubir{from{opacity:0;transform:translateY(26px)}to{opacity:1;transform:translateY(0)}}
  .lp-anim{animation:lpSubir .8s cubic-bezier(.2,.65,.3,1) both}
  .lp-op{transition:border-color .18s, background .18s, transform .18s}
  .lp-op:hover{border-color:${LP.roxo}70!important;background:rgba(124,58,237,.09)!important}
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
