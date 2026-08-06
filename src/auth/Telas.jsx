import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { api } from "../lib/api.js";
import { B, N } from "../ui/tokens.js";
import { Aviso, Girando } from "../ui/base.jsx";

// ── Telas de autenticação ─────────────────────────────────────────────────────
//
// As duas telas são <form> de verdade, e não divs com Enter amarrado em cada
// campo. Isso não é purismo: é o que faz gerenciador de senha reconhecer,
// salvar e preencher o login, e o que dá validação nativa do navegador de graça.
// Os `autoComplete` abaixo são a parte que o gerenciador realmente lê.

// A redefinição de senha é manual, direto no banco (decisão de produto: o
// piloto é fechado e não há e-mail transacional). Este é o contato de quem
// administra o sistema — vira um link na tela de login.
const CONTATO_SUPORTE = "ag.sekoia@gmail.com";

const molduraAuth = {
  minHeight: "100vh", background: "#121418", color: B.text,
  fontFamily: '"DM Sans", system-ui, sans-serif', display: "flex", flexDirection: "column",
  alignItems: "center", justifyContent: "center", padding: "40px 24px",
  position: "relative", overflow: "hidden",
};

const inp = {
  width: "100%", padding: "10px 12px", background: "rgba(241,245,249,0.05)",
  border: "1px solid rgba(241,245,249,0.12)", borderRadius: 9, color: B.text,
  fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box",
};

const cartaoAuth = {
  padding: 32, background: "rgba(29,33,42,0.85)", backdropFilter: "blur(32px)",
  border: "1px solid rgba(241,245,249,0.12)", borderRadius: 20,
  boxShadow: "0 8px 56px rgba(0,0,0,0.55)",
};

const botaoPrimario = (enviando) => ({
  width: "100%", marginTop: 12, padding: 11, borderRadius: 999,
  background: N.color, color: "#fff", border: `1px solid ${N.color}80`,
  fontSize: 14, cursor: enviando ? "wait" : "pointer", fontFamily: "inherit",
  fontWeight: 700, opacity: enviando ? 0.7 : 1,
});

const botaoVoltar = {
  background: "transparent", border: "none", color: B.muted, cursor: "pointer",
  fontSize: 13, marginBottom: 28, padding: 0, fontFamily: "inherit",
};

const estiloRotulo = {
  display: "block", fontSize: 10, fontWeight: 600, color: B.muted,
  marginBottom: 6, letterSpacing: ".06em",
};

const CampoAuth = ({ label, ...props }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={estiloRotulo}>
      {label}
      <input style={{ ...inp, marginTop: 6 }} {...props} />
    </label>
  </div>
);

// Campo de senha com olho para revelar. Digitar senha às cegas no celular é a
// maior fonte de erro de login — e o erro só aparece depois de enviar.
//
// O botão fica FORA do <label>: dentro, clicar nele focaria o input (é o que
// um label faz), e o cursor pularia para o fim do texto a cada alternância.
// `tabIndex={-1}` mantém o Tab indo do campo direto para o botão de entrar.
const CampoSenha = ({ label, ...props }) => {
  const [visivel, setVisivel] = useState(false);
  const Icone = visivel ? EyeOff : Eye;

  return (
    <div style={{ marginBottom: 14 }}>
      <label style={estiloRotulo} htmlFor={props.name}>{label}</label>
      <div style={{ position: "relative" }}>
        <input id={props.name} {...props} type={visivel ? "text" : "password"}
          style={{ ...inp, paddingRight: 42 }} />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setVisivel(v => !v)}
          title={visivel ? "Ocultar senha" : "Mostrar senha"}
          aria-label={visivel ? "Ocultar senha" : "Mostrar senha"}
          style={{
            position: "absolute", right: 4, top: 0, bottom: 0, width: 36,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "transparent", border: "none", cursor: "pointer",
            color: visivel ? N.color : B.muted, padding: 0,
          }}
        >
          <Icone size={16} strokeWidth={1.8} />
        </button>
      </div>
    </div>
  );
};

export const LoginPage = ({ onSuccess, onRegister, onBack }) => {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  const entrar = async (e) => {
    e.preventDefault();
    setErro(""); setEnviando(true);
    try {
      onSuccess(await api.auth.entrar({ email, senha }));
    } catch (erroApi) {
      setErro(erroApi.message);
      setEnviando(false);
    }
  };

  const entrarDemo = async () => {
    setErro(""); setEnviando(true);
    const creds = { email: "demo@barbearia.com", senha: "demo123" };
    try {
      onSuccess(await api.auth.entrar(creds));
    } catch {
      try {
        onSuccess(await api.auth.cadastrar({
          nome: "Barbeiro Mestre",
          barbearia: "Barbearia Premium Demo",
          whatsapp: "(11) 99999-8888",
          ...creds,
        }));
      } catch (errCad) {
        setErro(errCad.message);
        setEnviando(false);
      }
    }
  };

  return (
    <div style={molduraAuth}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", background: `radial-gradient(ellipse 70% 60% at 50% 30%, ${N.color}25 0%, ${N.color}08 50%, transparent 75%)` }} />
      <div style={{ width: "100%", maxWidth: 400, position: "relative", zIndex: 1 }}>
        <button type="button" onClick={onBack} style={botaoVoltar}>← Voltar</button>
        <form onSubmit={entrar} style={cartaoAuth}>
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Entrar</div>
          <div style={{ fontSize: 13, color: B.muted, marginBottom: 24 }}>Acesse o painel da sua barbearia</div>
          {erro && <div style={{ marginBottom: 16 }}><Aviso texto={erro} /></div>}

          <CampoAuth label="E-MAIL" type="email" name="email" autoComplete="username"
            autoFocus required value={email} placeholder="seu@email.com"
            onChange={e => setEmail(e.target.value)} />
          <CampoSenha label="SENHA" name="senha" autoComplete="current-password"
            required value={senha} placeholder="••••••••"
            onChange={e => setSenha(e.target.value)} />

          <button type="submit" disabled={enviando} style={botaoPrimario(enviando)}>
            {enviando ? "Entrando..." : "Entrar →"}
          </button>

          <button type="button" disabled={enviando} onClick={entrarDemo}
            style={{
              width: "100%", marginTop: 10, padding: 11, borderRadius: 999,
              background: "rgba(255,85,0,0.15)", color: "#FF5500",
              border: "1px solid rgba(255,85,0,0.4)", fontSize: 13,
              fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}>
            ⚡ Acessar Painel Demo (1-Clique)
          </button>

          <div style={{ marginTop: 14, textAlign: "center", fontSize: 11, color: B.dim, lineHeight: 1.6 }}>
            Esqueceu a senha? A redefinição é feita manualmente
            {CONTATO_SUPORTE ? (
              <> — <a href={`mailto:${CONTATO_SUPORTE}`} style={{ color: N.color, fontWeight: 600 }}>fale com o suporte</a>.</>
            ) : (
              <> — fale com quem administra o sistema.</>
            )}
          </div>

          <div style={{ marginTop: 18, textAlign: "center", fontSize: 12, color: B.muted }}>
            Não tem conta? <span onClick={onRegister} style={{ color: N.color, cursor: "pointer", fontWeight: 600 }}>Cadastrar grátis</span>
          </div>
        </form>
      </div>
    </div>
  );
};

// Cadastro de barbeiros e salões de beleza (SaaS B2B): liberado após a escolha do plano e pagamento.
export const RegisterPage = ({ planoInfo, onSuccess, onLogin, onBack }) => {
  const [form, setForm] = useState({
    nome: "", barbearia: "", whatsapp: "", email: "", senha: "",
  });
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const cadastrar = async (e) => {
    e.preventDefault();
    setErro(""); setEnviando(true);
    try {
      onSuccess(await api.auth.cadastrar(form));
    } catch (erroApi) {
      setErro(erroApi.message);
      setEnviando(false);
    }
  };

  const campos = [
    { k: "nome", label: "NOME COMPLETO", type: "text", ph: "João Silva", auto: "name" },
    { k: "barbearia", label: "NOME DA BARBEARIA", type: "text", ph: "Barbearia do João", auto: "organization" },
    { k: "whatsapp", label: "WHATSAPP", type: "tel", ph: "(11) 99999-9999", auto: "tel" },
    { k: "email", label: "E-MAIL", type: "email", ph: "seu@email.com", auto: "username" },
    { k: "senha", label: "SENHA", type: "password", ph: "mínimo 6 caracteres", auto: "new-password", min: 6 },
  ];

  return (
    <div style={molduraAuth}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", background: `radial-gradient(ellipse 70% 60% at 50% 30%, ${N.color}20 0%, ${N.color}06 50%, transparent 75%)` }} />
      <div style={{ width: "100%", maxWidth: 440, position: "relative", zIndex: 1 }}>
        <button type="button" onClick={onBack} style={botaoVoltar}>← Voltar</button>
        <form onSubmit={cadastrar} style={cartaoAuth}>
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Criar conta</div>
          <div style={{ fontSize: 13, color: B.muted, marginBottom: 16 }}>
            Cadastre sua barbearia ou salão e acesse o painel
          </div>

          {planoInfo && (
            <div style={{
              background: `${N.color}15`, border: `1px solid ${N.color}40`, borderRadius: 10,
              padding: "10px 14px", marginBottom: 18, fontSize: 12, color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div>
                <strong style={{ color: N.color }}>Plano {planoInfo.plano} ({planoInfo.ciclo})</strong>
                <div style={{ fontSize: 11, color: B.muted, marginTop: 2 }}>✓ Assinatura confirmada</div>
              </div>
              <span style={{ fontSize: 10, background: "#22C55E", color: "#000", padding: "2px 8px", borderRadius: 999, fontWeight: 800 }}>PAGO</span>
            </div>
          )}
          {erro && <div style={{ marginBottom: 16 }}><Aviso texto={erro} /></div>}

          {campos.map(({ k, label, type, ph, auto, min }, i) => {
            const Campo = type === "password" ? CampoSenha : CampoAuth;
            return (
              <Campo key={k} label={label} type={type} name={k} autoComplete={auto}
                autoFocus={i === 0} required minLength={min} placeholder={ph}
                value={form[k]} onChange={set(k)} />
            );
          })}

          <button type="submit" disabled={enviando} style={{ ...botaoPrimario(enviando), marginTop: 10 }}>
            {enviando ? "Criando conta..." : "Criar conta →"}
          </button>

          <div style={{ marginTop: 20, textAlign: "center", fontSize: 12, color: B.muted }}>
            Já tem conta? <span onClick={onLogin} style={{ color: N.color, cursor: "pointer", fontWeight: 600 }}>Entrar</span>
          </div>
        </form>
      </div>
    </div>
  );
};

export const TelaInicial = () => (
  <div style={{ ...molduraAuth, gap: 12 }}>
    <Girando size={26} color={N.color} />
    <span style={{ fontSize: 13, color: B.muted }}>Carregando ControlCRM...</span>
  </div>
);
