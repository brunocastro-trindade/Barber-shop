// ── Área do cliente da barbearia ──────────────────────────────────────────────
// Quem usa esta tela é o cliente que vai cortar o cabelo, não o dono do
// sistema. Ele não pertence a uma barbearia só: busca, favorita e marca
// horário em qualquer uma que use o Cut Flow.
//
// Estrutura em 4 abas (Início, Buscar, Agendamentos, Menu), layout de celular
// — é de lá que quase todo agendamento sai.

import { useState, useEffect, useCallback } from "react";
import {
  Scissors, Calendar, Clock, Check, MapPin, Phone, Home, Search,
  User, Heart, LogOut, FileText, Bell, ChevronRight, Sparkles, Star,
} from "lucide-react";

import { api } from "../lib/api.js";
import { LP, FONT_MARCA, lpBtnPrimario, lpBtnFantasma, CSS_VITRINE } from "../lib/tema.js";
import { emReais } from "../lib/formato.js";
import Estabelecimento from "./Estabelecimento.jsx";
import {
  Cartao, Rotulo, Titulo, Erro, Carregando, Vazio, Estrelas, LogoLoja, Inicial,
  Chip, Busca, Campo, LinhaLoja,
} from "./ui.jsx";
import { diaSemana, diaMes, porExtenso, dataLonga, mascaraTelefone } from "./formatos.js";

// A sessão do cliente é só o id da ficha: não há dado sensível, e guardar
// evita pedir o telefone a cada visita.
const CHAVE_SESSAO = "cc_cliente_sessao";

const ABAS = [
  ["inicio", "Início", Home],
  ["buscar", "Buscar", Search],
  ["agenda", "Agendamentos", Calendar],
  ["menu", "Menu", User],
];

// Banners da tela inicial — no lugar das promoções que a barbearia cadastraria.
const DESTAQUES = [
  { titulo: "Marque seu horário sem ligar para a barbearia", cor: "#7C3AED" },
  { titulo: "Acompanhe seus pontos e troque por cortes grátis", cor: "#fc570a" },
  { titulo: "Salve suas barbearias favoritas e agende em 2 toques", cor: "#7C3AED" },
];

// ── Identificação ─────────────────────────────────────────────────────────────

function Entrada({ onEntrou, onVoltarSite }) {
  const [telefone, setTelefone] = useState("");
  const [nome, setNome] = useState("");
  const [pedirNome, setPedirNome] = useState(false);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  const continuar = async () => {
    setErro(""); setEnviando(true);
    try {
      onEntrou(await api.publico.identificar({ telefone, nome: pedirNome ? nome : "" }));
    } catch (e) {
      // O erro com precisaNome não é falha: é o cadastro pedindo o nome.
      if (e.precisaNome) { setPedirNome(true); setErro(""); }
      else setErro(e.message);
      setEnviando(false);
    }
  };

  const podeEnviar = telefone.replace(/\D/g, "").length >= 10 && (!pedirNome || nome.trim());

  return (
    <div style={{ padding: "48px 20px 60px", maxWidth: 440, margin: "0 auto" }}>
      <div className="lp-anim" style={{ textAlign: "center", marginBottom: 34 }}>
        <img src="/logos/logo-roxa.png" alt="Cut Flow" style={{ height: 52, width: "auto", margin: "0 auto 22px", display: "block" }} />

        <h1 style={{ fontSize: 29, fontWeight: 400, color: "#fff", margin: "0 0 10px", letterSpacing: "-0.01em", lineHeight: 1.15, fontFamily: FONT_MARCA }}>
          Seu corte, na hora que der
        </h1>
        <p style={{ fontSize: 15, color: LP.dim, margin: 0, lineHeight: 1.65 }}>
          Agende nas barbearias da sua cidade em menos de um minuto.
        </p>
      </div>

      <Cartao className="lp-anim">
        <Erro texto={erro} onFechar={() => setErro("")} />

        <Campo
          rotulo="Seu WhatsApp"
          type="tel"
          inputMode="numeric"
          placeholder="(11) 99999-9999"
          value={telefone}
          onChange={e => setTelefone(mascaraTelefone(e.target.value))}
          onKeyDown={e => e.key === "Enter" && podeEnviar && continuar()}
        />

        {pedirNome && (
          <>
            <div style={{
              fontSize: 13, color: LP.roxoClaro, lineHeight: 1.6, marginBottom: 14,
              padding: "11px 14px", borderRadius: 12,
              background: `${LP.roxo}14`, border: `1px solid ${LP.roxo}38`,
            }}>
              Primeira vez aqui! Como podemos te chamar?
            </div>
            <Campo
              rotulo="Seu nome"
              placeholder="Ex: Lucas Almeida"
              value={nome}
              onChange={e => setNome(e.target.value)}
              onKeyDown={e => e.key === "Enter" && podeEnviar && continuar()}
            />
          </>
        )}

        <button onClick={continuar} disabled={enviando || !podeEnviar}
          className="lp-btn lp-btn-primario"
          style={{ ...lpBtnPrimario, width: "100%", marginTop: 6, padding: "15px 28px", fontSize: 15 }}>
          {enviando ? "Aguarde..." : pedirNome ? "Criar meu cadastro →" : "Continuar →"}
        </button>

        <p style={{ fontSize: 12, color: LP.dimmer, textAlign: "center", margin: "16px 0 0", lineHeight: 1.6 }}>
          Sem senha e sem cadastro chato.<br />Se você já é cliente, a gente reconhece seu número.
        </p>
      </Cartao>

      {onVoltarSite && (
        <button onClick={onVoltarSite} className="lp-btn lp-btn-fantasma"
          style={{ ...lpBtnFantasma, width: "100%", marginTop: 18, fontSize: 13 }}>
          Sou dono de barbearia
        </button>
      )}
    </div>
  );
}

// ── Aba Início ────────────────────────────────────────────────────────────────

function AbaInicio({ cliente, onAbrirLoja, onBuscar }) {
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState("");
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    let ativo = true;
    api.publico.inicio(cliente.id)
      .then(d => { if (ativo) setDados(d); })
      .catch(e => { if (ativo) setErro(e.message); });
    return () => { ativo = false; };
  }, [cliente.id]);

  // Carrossel de destaques: o setState mora no callback do timer.
  useEffect(() => {
    const t = setInterval(() => setSlide(s => (s + 1) % DESTAQUES.length), 4500);
    return () => clearInterval(t);
  }, []);

  const destaque = DESTAQUES[slide];

  return (
    <div style={{ padding: "20px 20px 24px", maxWidth: 560, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 25, fontWeight: 800, color: "#fff", letterSpacing: "-0.03em" }}>
            Olá, <span style={{ color: LP.roxoClaro }}>{cliente.nome.split(" ")[0]}</span>
          </div>
          <div style={{ fontSize: 13, color: LP.dim, marginTop: 3 }}>{dataLonga()}</div>
        </div>
        <div style={{
          width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
          border: `1px solid ${LP.border}`, background: "rgba(255,255,255,0.03)",
          display: "flex", alignItems: "center", justifyContent: "center", color: LP.dim,
        }}><Bell size={17} strokeWidth={1.9} /></div>
      </div>

      <div style={{ marginBottom: 26 }}>
        <Busca valor="" placeholder="Encontre um estabelecimento" onClick={onBuscar} />
      </div>

      <Erro texto={erro} onFechar={() => setErro("")} />
      {!dados && <Carregando />}

      {dados && (
        <>
          {dados.proximo && (
            <div style={{ marginBottom: 26 }}>
              <Rotulo>Próximo agendamento</Rotulo>
              <Cartao destaque onClick={() => onAbrirLoja(dados.proximo.barbearia.id)} style={{ padding: 18 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{
                    textAlign: "center", flexShrink: 0, padding: "8px 12px", borderRadius: 14,
                    background: `${LP.roxo}26`, border: `1px solid ${LP.roxo}45`,
                  }}>
                    <div style={{ fontSize: 10, color: LP.roxoClaro, fontWeight: 700 }}>{diaSemana(dados.proximo.data)}</div>
                    <div style={{ fontSize: 21, fontWeight: 800, color: "#fff", lineHeight: 1.1 }}>{diaMes(dados.proximo.data)}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 17, fontWeight: 800, color: "#fff", marginBottom: 3 }}>{dados.proximo.hora}</div>
                    <div style={{ fontSize: 13, color: LP.text }}>{dados.proximo.servico}</div>
                    <div style={{ fontSize: 12, color: LP.dim, marginTop: 2 }}>
                      {dados.proximo.barbearia.nome} · {dados.proximo.profissional}
                    </div>
                  </div>
                  <ChevronRight size={19} color={LP.dim} strokeWidth={2} style={{ flexShrink: 0 }} />
                </div>
              </Cartao>
            </div>
          )}

          {/* Banner rotativo */}
          <div style={{
            position: "relative", borderRadius: 20, overflow: "hidden", marginBottom: 12,
            padding: "28px 24px", minHeight: 130, display: "flex", alignItems: "flex-end",
            background: `linear-gradient(140deg, ${destaque.cor}66, ${destaque.cor}14)`,
            border: `1px solid ${destaque.cor}45`, transition: "background .6s",
          }}>
            <div style={{
              position: "absolute", right: -30, top: -30, width: 150, height: 150,
              borderRadius: "50%", background: "rgba(255,255,255,0.07)",
            }} />
            <div style={{ position: "relative", fontSize: 17, fontWeight: 800, color: "#fff", lineHeight: 1.35, letterSpacing: "-0.02em" }}>
              {destaque.titulo}
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 28 }}>
            {DESTAQUES.map((_, i) => (
              <div key={i} onClick={() => setSlide(i)} style={{
                width: i === slide ? 20 : 7, height: 7, borderRadius: 999, cursor: "pointer",
                background: i === slide ? LP.roxo : "rgba(255,255,255,0.16)", transition: "all .3s",
              }} />
            ))}
          </div>

          {dados.favoritos.length > 0 && (
            <div style={{ marginBottom: 26 }}>
              <Rotulo>Suas favoritas</Rotulo>
              <div style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 6 }}>
                {dados.favoritos.map(l => (
                  <div key={l.id} onClick={() => onAbrirLoja(l.id)} style={{ width: 78, textAlign: "center", cursor: "pointer", flexShrink: 0 }}>
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: 9 }}>
                      <LogoLoja loja={l} size={62} comNota />
                    </div>
                    <div style={{ fontSize: 11.5, color: LP.text, lineHeight: 1.35 }}>{l.nome}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {dados.recentes.length > 0 && (
            <div>
              <Rotulo>Últimos acessos</Rotulo>
              {dados.recentes.map(l => (
                <LinhaLoja key={l.id} loja={l} onClick={() => onAbrirLoja(l.id)}
                  direita={<ChevronRight size={18} color={LP.dim} strokeWidth={2} />} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Aba Buscar ────────────────────────────────────────────────────────────────

function AbaBuscar({ cliente, onAbrirLoja }) {
  const [termo, setTermo] = useState("");
  const [modo, setModo] = useState("nome");
  const [lista, setLista] = useState(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;
    api.publico.barbearias({ termo, modo })
      .then(l => { if (ativo) setLista(l); })
      .catch(e => { if (ativo) setErro(e.message); });
    return () => { ativo = false; };
  }, [termo, modo]);

  const placeholders = {
    nome: "Pesquise pelo nome",
    cidade: "Pesquise pela cidade",
    proximas: "Barbearias mais perto de você",
  };

  return (
    <div style={{ padding: "20px 20px 24px", maxWidth: 560, margin: "0 auto" }}>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 25, fontWeight: 800, color: "#fff", letterSpacing: "-0.03em" }}>
          Olá, <span style={{ color: LP.roxoClaro }}>{cliente.nome.split(" ")[0]}</span>
        </div>
        <div style={{ fontSize: 13, color: LP.dim, marginTop: 3 }}>{dataLonga()}</div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <Busca valor={termo} onChange={setTermo}
          placeholder={placeholders[modo]}
          autoFocus={modo !== "proximas"} />
      </div>

      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 6, marginBottom: 10 }}>
        <Chip ativo={modo === "nome"} onClick={() => setModo("nome")}>
          <Scissors size={14} strokeWidth={1.9} /> Nome
        </Chip>
        <Chip ativo={modo === "cidade"} onClick={() => setModo("cidade")}>
          <MapPin size={14} strokeWidth={1.9} /> Cidade
        </Chip>
        <Chip ativo={modo === "proximas"} onClick={() => { setModo("proximas"); setTermo(""); }}>
          <Star size={14} strokeWidth={1.9} /> Próximas
        </Chip>
      </div>

      <Erro texto={erro} onFechar={() => setErro("")} />
      {!lista && <Carregando texto="Procurando barbearias..." />}

      {lista && lista.length === 0 && (
        <Vazio
          icone={<Search size={30} strokeWidth={1.7} />}
          titulo="Nenhum estabelecimento"
          texto="Tente outro nome ou mude o filtro para cidade."
        />
      )}

      {lista?.map(l => (
        <LinhaLoja key={l.id} loja={l} onClick={() => onAbrirLoja(l.id)}
          direita={l.favorito ? <Heart size={16} color="#EF4444" fill="#EF4444" strokeWidth={0} /> : null} />
      ))}
    </div>
  );
}

// ── Aba Agendamentos ──────────────────────────────────────────────────────────

function AbaAgenda({ cliente, onAbrirLoja }) {
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState("");
  const [filtro, setFiltro] = useState("");
  const [ver, setVer] = useState("proximos");
  const [cancelandoId, setCancelandoId] = useState(null);
  const [lojas, setLojas] = useState([]);

  const carregar = useCallback(() => {
    api.publico.meusHorarios(cliente.id, { barbeariaId: filtro || undefined })
      .then(setDados)
      .catch(e => setErro(e.message));
  }, [cliente.id, filtro]);

  useEffect(carregar, [carregar]);

  useEffect(() => {
    let ativo = true;
    api.publico.barbearias()
      .then(l => { if (ativo) setLojas(l); })
      .catch(() => { /* o filtro é opcional */ });
    return () => { ativo = false; };
  }, []);

  const cancelar = async (id) => {
    setErro(""); setCancelandoId(id);
    try { await api.publico.cancelar(cliente.id, id); carregar(); }
    catch (e) { setErro(e.message); }
    finally { setCancelandoId(null); }
  };

  const lista = dados && (ver === "proximos" ? dados.proximos : dados.passados);

  return (
    <div style={{ padding: "20px 20px 24px", maxWidth: 560, margin: "0 auto" }}>
      <Titulo style={{ marginBottom: 16 }}>Agendamentos</Titulo>

      <select
        value={filtro}
        onChange={e => setFiltro(e.target.value)}
        style={{
          width: "100%", padding: "14px 16px", marginBottom: 14,
          background: "rgba(255,255,255,0.04)", border: `1px solid ${LP.border}`,
          borderRadius: 14, color: filtro ? LP.text : LP.dimmer, fontSize: 14.5,
          fontFamily: "inherit", outline: "none", cursor: "pointer",
        }}
      >
        <option value="">Filtrar por estabelecimento</option>
        {lojas.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
      </select>

      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        <Chip ativo={ver === "proximos"} onClick={() => setVer("proximos")}>Próximos</Chip>
        <Chip ativo={ver === "passados"} onClick={() => setVer("passados")}>Anteriores</Chip>
      </div>

      <Erro texto={erro} onFechar={() => setErro("")} />
      {!dados && <Carregando />}

      {lista && lista.length === 0 && (
        <Vazio
          icone={<Calendar size={30} strokeWidth={1.7} />}
          titulo={ver === "proximos" ? "Nenhum agendamento" : "Nada por aqui ainda"}
          texto={ver === "proximos"
            ? "Você não possui horários marcados."
            : "Seus horários passados aparecem aqui."}
        />
      )}

      {lista?.map(a => (
        <Cartao key={a.id} style={{ marginBottom: 10, padding: 18 }}
          destaque={ver === "proximos"}>
          <div style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: 14 }}>
            <LogoLoja loja={a.barbearia} size={42} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div onClick={() => onAbrirLoja(a.barbearia.id)} style={{ fontSize: 14.5, fontWeight: 700, color: "#fff", cursor: "pointer" }}>
                {a.barbearia.nome}
              </div>
              <div style={{ fontSize: 12, color: LP.dim, marginTop: 2 }}>{a.barbearia.cidade}</div>
            </div>
            <span style={{
              fontSize: 10.5, fontWeight: 700, padding: "4px 11px", borderRadius: 999, flexShrink: 0,
              color: a.status === "Cancelado" ? "#FCA5A5" : a.status === "Pago" ? "#22C55E" : LP.roxoClaro,
              background: a.status === "Cancelado" ? "rgba(239,68,68,0.12)" : a.status === "Pago" ? "rgba(34,197,94,0.12)" : `${LP.roxo}22`,
              border: `1px solid ${a.status === "Cancelado" ? "rgba(239,68,68,0.35)" : a.status === "Pago" ? "rgba(34,197,94,0.35)" : LP.roxo + "45"}`,
            }}>{a.status}</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              textAlign: "center", flexShrink: 0, padding: "8px 12px", borderRadius: 14,
              background: "rgba(255,255,255,0.04)", border: `1px solid ${LP.border}`,
            }}>
              <div style={{ fontSize: 10, color: LP.dim, fontWeight: 700 }}>{diaSemana(a.data)}</div>
              <div style={{ fontSize: 19, fontWeight: 800, color: "#fff", lineHeight: 1.15 }}>{diaMes(a.data)}</div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", marginBottom: 2 }}>{a.hora}</div>
              <div style={{ fontSize: 13, color: LP.text }}>{a.servico}</div>
              <div style={{ fontSize: 12, color: LP.dim, marginTop: 2 }}>com {a.profissional}</div>
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: LP.roxoClaro, flexShrink: 0 }}>{emReais(a.valor)}</span>
          </div>

          {ver === "proximos" && (
            <button onClick={() => cancelar(a.id)} disabled={cancelandoId === a.id} className="lp-btn"
              style={{
                marginTop: 14, width: "100%", padding: "10px 18px", borderRadius: 999,
                border: "1px solid rgba(239,68,68,0.35)", background: "rgba(239,68,68,0.1)",
                color: "#FCA5A5", fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              }}>
              {cancelandoId === a.id ? "Cancelando..." : "Cancelar horário"}
            </button>
          )}
        </Cartao>
      ))}
    </div>
  );
}

// ── Aba Menu ──────────────────────────────────────────────────────────────────

function AbaMenu({ cliente, onAbrirLoja, onSair, onVoltarSite }) {
  const [dados, setDados] = useState(null);
  const [favoritos, setFavoritos] = useState([]);

  useEffect(() => {
    let ativo = true;
    api.publico.meusHorarios(cliente.id)
      .then(d => { if (ativo) setDados(d); })
      .catch(() => { /* o resumo é opcional */ });
    api.publico.inicio(cliente.id)
      .then(d => { if (ativo) setFavoritos(d.favoritos); })
      .catch(() => { /* idem */ });
    return () => { ativo = false; };
  }, [cliente.id]);

  const r = dados?.resumo;

  return (
    <div style={{ padding: "20px 20px 24px", maxWidth: 560, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 15, marginBottom: 24 }}>
        <Inicial nome={cliente.nome} size={58} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 19, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>{cliente.nome}</div>
          <div style={{ fontSize: 13, color: LP.dim, marginTop: 3, display: "flex", alignItems: "center", gap: 6 }}>
            <Phone size={12} strokeWidth={1.9} /> {cliente.telefone || "Não informado"}
          </div>
        </div>
      </div>

      {r && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
          <Cartao style={{ padding: 16 }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#fff", letterSpacing: "-0.03em" }}>{r.visitas}</div>
            <div style={{ fontSize: 11.5, color: LP.dim, marginTop: 3 }}>cortes feitos</div>
          </Cartao>
          <Cartao style={{ padding: 16 }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: LP.roxoClaro, letterSpacing: "-0.03em" }}>{emReais(r.totalGasto)}</div>
            <div style={{ fontSize: 11.5, color: LP.dim, marginTop: 3 }}>investidos no visual</div>
          </Cartao>
        </div>
      )}

      {r?.favorito && (
        <Cartao style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 13, padding: 16 }}>
          <Inicial nome={r.favorito} size={42} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: LP.dimmer, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase" }}>Seu barbeiro</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginTop: 2 }}>{r.favorito}</div>
          </div>
          <Star size={17} color={LP.roxo} fill={LP.roxo} strokeWidth={0} />
        </Cartao>
      )}

      {r?.tipo === "assinante" && (
        <Cartao destaque style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 12, padding: 16 }}>
          <Sparkles size={19} color={LP.roxoClaro} strokeWidth={1.9} style={{ flexShrink: 0 }} />
          <div style={{ fontSize: 13, color: LP.text, lineHeight: 1.55 }}>
            Você é <strong style={{ color: "#fff" }}>assinante</strong> — seus cortes do plano já estão inclusos.
          </div>
        </Cartao>
      )}

      {favoritos.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <Rotulo>Meus favoritos</Rotulo>
          <Cartao style={{ padding: "4px 18px" }}>
            {favoritos.map((l, i) => (
              <div key={l.id} onClick={() => onAbrirLoja(l.id)} style={{
                display: "flex", alignItems: "center", gap: 13, padding: "13px 0", cursor: "pointer",
                borderBottom: i < favoritos.length - 1 ? `1px solid ${LP.border}` : "none",
              }}>
                <LogoLoja loja={l} size={38} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{l.nome}</div>
                  <div style={{ fontSize: 11.5, color: LP.dim, marginTop: 1 }}>{l.cidade}</div>
                </div>
                <Estrelas nota={l.nota} size={11} />
              </div>
            ))}
          </Cartao>
        </div>
      )}

      <Rotulo>Conta</Rotulo>
      <Cartao style={{ padding: "4px 18px", marginBottom: 20 }}>
        {[
          [Heart, "Meus favoritos", `${favoritos.length} barbearia${favoritos.length === 1 ? "" : "s"}`],
          [Clock, "Histórico", `${dados?.historico?.length || 0} atendimentos`],
          [FileText, "Termos de uso", "Como seus dados são tratados"],
        ].map(([Icone, titulo, sub], i) => (
          <div key={titulo} style={{
            display: "flex", alignItems: "center", gap: 14, padding: "15px 0",
            borderBottom: i < 2 ? `1px solid ${LP.border}` : "none",
          }}>
            <Icone size={19} color={LP.dim} strokeWidth={1.8} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14.5, color: "#fff", fontWeight: 600 }}>{titulo}</div>
              <div style={{ fontSize: 12, color: LP.dim, marginTop: 2 }}>{sub}</div>
            </div>
            <ChevronRight size={17} color={LP.dimmer} strokeWidth={2} style={{ flexShrink: 0 }} />
          </div>
        ))}
      </Cartao>

      <button onClick={onSair} className="lp-btn"
        style={{
          width: "100%", padding: "13px 24px", borderRadius: 999,
          border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)",
          color: "#FCA5A5", fontSize: 13.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}>
        <LogOut size={15} strokeWidth={1.9} /> Sair
      </button>

      {onVoltarSite && (
        <button onClick={onVoltarSite} className="lp-btn lp-btn-fantasma"
          style={{ ...lpBtnFantasma, width: "100%", marginTop: 10, fontSize: 13 }}>
          Sou dono de barbearia
        </button>
      )}

      <div style={{ textAlign: "center", fontSize: 11.5, color: LP.dimmer, marginTop: 24, lineHeight: 1.7 }}>
        Cut Flow Cliente<br />Versão 1.0.0
      </div>
    </div>
  );
}

// ── Confirmação de agendamento ────────────────────────────────────────────────

function Sucesso({ agendamento, onVerAgenda }) {
  return (
    <div style={{ padding: "50px 20px 60px", maxWidth: 440, margin: "0 auto", textAlign: "center" }}>
      <div className="lp-anim" style={{
        width: 76, height: 76, borderRadius: "50%", margin: "0 auto 26px",
        background: `linear-gradient(135deg, ${LP.roxo}, #6D28D9)`,
        display: "flex", alignItems: "center", justifyContent: "center", color: "#fff",
        boxShadow: `0 12px 50px ${LP.roxo}70, inset 0 1px 0 rgba(255,255,255,0.3)`,
      }}><Check size={38} strokeWidth={2.6} /></div>

      <h1 className="lp-anim" style={{ fontSize: 28, fontWeight: 400, color: "#fff", margin: "0 0 12px", letterSpacing: "-0.01em", animationDelay: ".06s", fontFamily: FONT_MARCA }}>
        Horário confirmado!
      </h1>
      <p className="lp-anim" style={{ fontSize: 15, color: LP.dim, margin: "0 0 30px", lineHeight: 1.65, animationDelay: ".12s" }}>
        Te esperamos <strong style={{ color: LP.roxoClaro }}>{porExtenso(agendamento.data)} às {agendamento.hora}</strong>.
      </p>

      <Cartao className="lp-anim" destaque style={{ textAlign: "left", animationDelay: ".18s" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 13, paddingBottom: 14, borderBottom: `1px solid ${LP.border}` }}>
          <LogoLoja loja={agendamento.barbearia} size={44} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{agendamento.barbearia.nome}</div>
            <div style={{ fontSize: 12, color: LP.dim, marginTop: 2 }}>{agendamento.barbearia.endereco}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 13, paddingTop: 14 }}>
          <Inicial nome={agendamento.profissional} size={42} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{agendamento.servico}</div>
            <div style={{ fontSize: 12.5, color: LP.dim, marginTop: 3 }}>
              com {agendamento.profissional} · {emReais(agendamento.valor)}
            </div>
          </div>
        </div>
      </Cartao>

      <button onClick={onVerAgenda} className="lp-btn lp-btn-primario"
        style={{ ...lpBtnPrimario, width: "100%", marginTop: 26, padding: "15px 28px", fontSize: 15 }}>
        Ver meus agendamentos
      </button>
    </div>
  );
}

// ── Raiz ──────────────────────────────────────────────────────────────────────

// Sessão anterior do cliente, se houver — lida uma vez, na montagem.
function sessaoSalva() {
  try { return JSON.parse(localStorage.getItem(CHAVE_SESSAO) || "null"); } catch { return null; }
}

export default function AreaCliente({ onVoltarSite }) {
  // Estado inicial preguiçoso: quem já entrou uma vez cai direto no início.
  const [cliente, setCliente] = useState(sessaoSalva);
  const [aba, setAba] = useState("inicio");
  const [lojaAberta, setLojaAberta] = useState(null);
  const [ultimo, setUltimo] = useState(null);

  const entrar = (c) => {
    setCliente(c);
    try {
      localStorage.setItem(CHAVE_SESSAO, JSON.stringify({ id: c.id, nome: c.nome, telefone: c.telefone }));
    } catch { /* sem storage */ }
    setAba("inicio");
  };

  const sair = () => {
    try { localStorage.removeItem(CHAVE_SESSAO); } catch { /* sem storage */ }
    setCliente(null);
    setLojaAberta(null);
    setUltimo(null);
  };

  const moldura = {
    minHeight: "100vh", background: LP.bg, color: LP.text,
    fontFamily: '"Coolvetica", system-ui, sans-serif', position: "relative", overflowX: "hidden",
  };

  const brilho = (
    <div style={{
      position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)",
      width: 900, height: 620, pointerEvents: "none", zIndex: 0,
      background: `radial-gradient(ellipse 50% 45% at 50% 0%, ${LP.roxo}32 0%, ${LP.roxo}0F 45%, transparent 72%)`,
    }} />
  );

  // Sem sessão: só a identificação.
  if (!cliente) {
    return (
      <div style={moldura}>
        <style>{CSS_VITRINE}</style>
        {brilho}
        <div style={{ position: "relative", zIndex: 1 }}>
          <Entrada onEntrou={entrar} onVoltarSite={onVoltarSite} />
        </div>
      </div>
    );
  }

  // Página de uma barbearia ocupa a tela inteira (tem a própria navegação).
  if (lojaAberta) {
    return (
      <div style={moldura}>
        <style>{CSS_VITRINE}</style>
        <Estabelecimento
          cliente={cliente}
          lojaId={lojaAberta}
          onVoltar={() => setLojaAberta(null)}
          onAgendado={(a) => { setLojaAberta(null); setUltimo(a); }}
        />
      </div>
    );
  }

  if (ultimo) {
    return (
      <div style={moldura}>
        <style>{CSS_VITRINE}</style>
        {brilho}
        <div style={{ position: "relative", zIndex: 1 }}>
          <Sucesso agendamento={ultimo} onVerAgenda={() => { setUltimo(null); setAba("agenda"); }} />
        </div>
      </div>
    );
  }

  const abrirLoja = (id) => setLojaAberta(id);

  return (
    <div style={moldura}>
      <style>{CSS_VITRINE}</style>
      {brilho}

      {/* paddingBottom abre espaço para a barra fixa de abas */}
      <div style={{ position: "relative", zIndex: 1, paddingBottom: 86 }}>
        {aba === "inicio" && <AbaInicio cliente={cliente} onAbrirLoja={abrirLoja} onBuscar={() => setAba("buscar")} />}
        {aba === "buscar" && <AbaBuscar cliente={cliente} onAbrirLoja={abrirLoja} />}
        {aba === "agenda" && <AbaAgenda cliente={cliente} onAbrirLoja={abrirLoja} />}
        {aba === "menu" && <AbaMenu cliente={cliente} onAbrirLoja={abrirLoja} onSair={sair} onVoltarSite={onVoltarSite} />}
      </div>

      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 30,
        display: "flex", padding: "10px 8px calc(10px + env(safe-area-inset-bottom))",
        background: "rgba(5,3,9,0.92)", backdropFilter: "blur(24px) saturate(150%)",
        borderTop: `1px solid ${LP.border}`,
      }}>
        {ABAS.map(([id, rotulo, Icone]) => {
          const ativo = aba === id;
          return (
            <button key={id} onClick={() => setAba(id)} style={{
              flex: 1, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 5, padding: "6px 2px",
              color: ativo ? LP.roxoClaro : LP.dimmer, transition: "color .18s",
            }}>
              <Icone size={21} strokeWidth={ativo ? 2.2 : 1.8} />
              <span style={{ fontSize: 10.5, fontWeight: ativo ? 700 : 500 }}>{rotulo}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
