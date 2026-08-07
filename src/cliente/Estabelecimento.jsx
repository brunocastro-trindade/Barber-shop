// Página de uma barbearia, do ponto de vista do cliente.
// Abas: Serviços, Detalhes, Profissionais, Fidelidade e Avaliações — e o
// assistente de agendamento, que abre por cima ao tocar em "Agendar".

import { useState, useEffect, useCallback } from "react";
import {
  ChevronLeft, Heart, Clock, MapPin, Phone, Check, Star, Calendar,
  Wifi, Car, Accessibility, Coffee, CreditCard, Tv, Gift, Scissors,
} from "lucide-react";

import { api } from "../lib/api.js";
import { LP, lpBtnPrimario, lpBtnFantasma } from "../lib/tema.js";
import { emReais, hojeISO, somarDias, doISO } from "../lib/formato.js";
import {
  Cartao, Rotulo, Erro, Carregando, Vazio, Estrelas, LogoLoja, Inicial,
  Opcao, Busca,
} from "./ui.jsx";
import { campoEstilo, diaSemana, diaMes, porExtenso, distanciaCurta } from "./formatos.js";

const ABAS = [
  ["servicos", "Serviços"],
  ["detalhes", "Detalhes"],
  ["profissionais", "Profissionais"],
  ["fidelidade", "Fidelidade"],
  ["avaliacoes", "Avaliações"],
];

const ICONE_COMODIDADE = {
  wifi: Wifi,
  estacionamento: Car,
  acessibilidade: Accessibility,
  cafe: Coffee,
  cartao: CreditCard,
  tv: Tv,
};

const NOME_COMODIDADE = {
  wifi: "Wi-Fi grátis",
  estacionamento: "Estacionamento",
  acessibilidade: "Acessível",
  cafe: "Café cortesia",
  cartao: "Cartão e PIX",
  tv: "TV",
};

// ── Assistente de agendamento (3 passos) ──────────────────────────────────────
// O serviço já veio escolhido da lista, então sobra: barbeiro, dia/hora e
// confirmação.

// `cliente` não é mais parâmetro: a identidade vem do cookie de sessão, e
// passar o objeto adiante só convidava alguém a mandá-lo para o servidor.
function Agendar({ loja, servico, onVoltar, onPronto }) {
  const [passo, setPasso] = useState(1);
  const [barbeiro, setBarbeiro] = useState("Qualquer");
  const [dia, setDia] = useState(null);
  const [hora, setHora] = useState(null);
  const [slots, setSlots] = useState(null);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  // Próximos dias úteis da barbearia — domingo fica de fora.
  const dias = [];
  for (let i = 0; dias.length < 12; i++) {
    const d = somarDias(hojeISO(), i);
    if (doISO(d).getDay() !== 0) dias.push(d);
  }

  useEffect(() => {
    if (passo !== 2 || !dia) return;
    let ativo = true;
    api.publico.horariosDoDia(loja.id, dia, barbeiro)
      .then(h => { if (ativo) setSlots(h); })
      .catch(e => { if (ativo) setErro(e.message); });
    return () => { ativo = false; };
  }, [passo, dia, barbeiro, loja.id]);

  // Quem muda dia ou barbeiro limpa a escolha anterior — o efeito só busca.
  const escolherDia = (d) => { setDia(d); setHora(null); setSlots(null); };
  const escolherBarbeiro = (p) => { setBarbeiro(p); setHora(null); setSlots(null); setPasso(2); };

  const confirmar = async () => {
    setErro(""); setEnviando(true);
    try {
      // `cliente_id` saiu do corpo: o servidor usa o do cookie de sessão.
      onPronto(await api.publico.agendar({
        barbearia_id: loja.id,
        servico: servico.nome,
        profissional: barbeiro,
        data: dia,
        hora,
      }));
    } catch (e) {
      setErro(e.message);
      setEnviando(false);
      if (/preenchido/i.test(e.message)) setPasso(2);
    }
  };

  const titulos = { 1: "Com quem?", 2: "Quando fica bom?", 3: "Confere se está tudo certo" };

  return (
    <div style={{ minHeight: "100vh", background: LP.bg }}>
      <div style={{
        position: "sticky", top: 0, zIndex: 20, display: "flex", alignItems: "center", gap: 12,
        padding: "14px 20px", background: "rgba(5,3,9,0.85)", backdropFilter: "blur(20px)",
        borderBottom: `1px solid ${LP.border}`,
      }}>
        <button onClick={() => (passo === 1 ? onVoltar() : setPasso(p => p - 1))} aria-label="Voltar"
          style={{
            width: 36, height: 36, borderRadius: "50%", flexShrink: 0, border: `1px solid ${LP.border}`,
            background: "rgba(255,255,255,0.04)", color: LP.text, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit",
          }}><ChevronLeft size={18} strokeWidth={2} /></button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {servico.nome}
          </div>
          <div style={{ fontSize: 11.5, color: LP.dim }}>{loja.nome}</div>
        </div>
        <span style={{ fontSize: 15, fontWeight: 800, color: LP.roxoClaro }}>{emReais(servico.preco)}</span>
      </div>

      <div style={{ padding: "20px 20px 60px", maxWidth: 460, margin: "0 auto" }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 22 }}>
          {[1, 2, 3].map(n => (
            <div key={n} style={{
              flex: 1, height: 4, borderRadius: 999,
              background: n <= passo ? LP.roxo : "rgba(255,255,255,0.09)",
              boxShadow: n <= passo ? `0 0 12px ${LP.roxo}70` : "none",
              transition: "background .3s, box-shadow .3s",
            }} />
          ))}
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11.5, color: LP.dimmer, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 7 }}>
            Passo {passo} de 3
          </div>
          <h2 style={{ fontSize: 23, fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "-0.03em" }}>
            {titulos[passo]}
          </h2>
        </div>

        <Erro texto={erro} onFechar={() => setErro("")} />

        {passo === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Opcao ativo={barbeiro === "Qualquer"} onClick={() => escolherBarbeiro("Qualquer")}>
              <div style={{
                width: 42, height: 42, borderRadius: "50%", flexShrink: 0,
                background: `${LP.roxo}1E`, border: `1px solid ${LP.roxo}3A`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}><Scissors size={18} color={LP.roxoClaro} strokeWidth={1.9} /></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>Tanto faz</div>
                <div style={{ fontSize: 12, color: LP.dim, marginTop: 2 }}>Mais horários disponíveis</div>
              </div>
            </Opcao>

            {loja.barbeiros.map(p => (
              <Opcao key={p.nome} ativo={barbeiro === p.nome} onClick={() => escolherBarbeiro(p.nome)}>
                <Inicial nome={p.nome} size={42} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{p.nome}</div>
                  <div style={{ fontSize: 12, color: LP.dim, marginTop: 2 }}>{p.cargo}</div>
                </div>
                <Estrelas nota={p.nota} size={11} />
              </Opcao>
            ))}
          </div>
        )}

        {passo === 2 && (
          <>
            <Rotulo>Escolha o dia</Rotulo>
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8, marginBottom: 22 }}>
              {dias.map(d => {
                const ativo = dia === d;
                return (
                  <div key={d} onClick={() => escolherDia(d)} style={{
                    flexShrink: 0, width: 60, padding: "12px 0", borderRadius: 16,
                    textAlign: "center", cursor: "pointer",
                    border: `1px solid ${ativo ? LP.roxo : LP.border}`,
                    background: ativo ? `${LP.roxo}26` : "rgba(255,255,255,0.02)",
                    transition: "border-color .18s, background .18s",
                  }}>
                    <div style={{ fontSize: 10.5, color: ativo ? LP.roxoClaro : LP.dim, fontWeight: 700 }}>
                      {d === hojeISO() ? "Hoje" : diaSemana(d)}
                    </div>
                    <div style={{ fontSize: 19, fontWeight: 800, color: ativo ? "#fff" : LP.text, lineHeight: 1.3 }}>
                      {diaMes(d)}
                    </div>
                  </div>
                );
              })}
            </div>

            {dia && (
              <>
                <Rotulo>Escolha o horário</Rotulo>
                {!slots && <Carregando texto="Vendo o que está livre..." />}
                {slots && (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: 9 }}>
                      {slots.map(s => (
                        <div key={s.hora} onClick={() => s.livre && setHora(s.hora)}
                          title={s.livre ? "" : "Horário ocupado"}
                          style={{
                            padding: "13px 0", borderRadius: 14, textAlign: "center",
                            fontSize: 14, fontWeight: 700,
                            cursor: s.livre ? "pointer" : "not-allowed",
                            border: `1px solid ${hora === s.hora ? LP.roxo : LP.border}`,
                            background: hora === s.hora ? `${LP.roxo}30` : s.livre ? "rgba(255,255,255,0.02)" : "transparent",
                            color: hora === s.hora ? "#fff" : s.livre ? LP.text : LP.dimmer,
                            textDecoration: s.livre ? "none" : "line-through",
                            opacity: s.livre ? 1 : 0.45,
                            transition: "border-color .18s, background .18s",
                          }}>{s.hora}</div>
                      ))}
                    </div>
                    {slots.every(s => !s.livre) && (
                      <p style={{ fontSize: 13, color: LP.dim, marginTop: 16, textAlign: "center" }}>
                        Nenhum horário livre neste dia. Tente outro.
                      </p>
                    )}
                  </>
                )}
              </>
            )}

            {hora && (
              <button onClick={() => setPasso(3)} className="lp-btn lp-btn-primario"
                style={{ ...lpBtnPrimario, width: "100%", marginTop: 24, padding: "15px 28px", fontSize: 15 }}>
                Continuar →
              </button>
            )}
          </>
        )}

        {passo === 3 && (
          <>
            <Cartao destaque>
              <div style={{ display: "flex", alignItems: "center", gap: 13, paddingBottom: 14, borderBottom: `1px solid ${LP.border}` }}>
                <LogoLoja loja={loja} size={44} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{loja.nome}</div>
                  <div style={{ fontSize: 12, color: LP.dim, marginTop: 2 }}>{loja.endereco}</div>
                </div>
              </div>
              {[
                ["Serviço", servico.nome, <Scissors key="s" size={15} strokeWidth={1.9} />],
                ["Barbeiro", barbeiro === "Qualquer" ? "O primeiro disponível" : barbeiro, <Star key="b" size={15} strokeWidth={1.9} />],
                ["Dia", porExtenso(dia), <Calendar key="d" size={15} strokeWidth={1.9} />],
                ["Horário", hora, <Clock key="h" size={15} strokeWidth={1.9} />],
              ].map(([k, v, icone], i) => (
                <div key={k} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "13px 0",
                  borderBottom: i < 3 ? `1px solid ${LP.border}` : "none",
                }}>
                  <span style={{ color: LP.roxoClaro, display: "flex", flexShrink: 0 }}>{icone}</span>
                  <span style={{ fontSize: 13, color: LP.dim, flex: 1 }}>{k}</span>
                  <span style={{ fontSize: 14, color: "#fff", fontWeight: 700, textAlign: "right" }}>{v}</span>
                </div>
              ))}
            </Cartao>

            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              marginTop: 16, padding: "16px 20px", borderRadius: 18,
              border: `1px solid ${LP.border}`, background: "rgba(255,255,255,0.02)",
            }}>
              <span style={{ fontSize: 13.5, color: LP.dim }}>Total a pagar no local</span>
              <span style={{ fontSize: 22, fontWeight: 800, color: LP.roxoClaro }}>{emReais(servico.preco)}</span>
            </div>

            <button onClick={confirmar} disabled={enviando} className="lp-btn lp-btn-primario"
              style={{ ...lpBtnPrimario, width: "100%", marginTop: 22, padding: "16px 28px", fontSize: 15 }}>
              {enviando ? "Confirmando..." : "Confirmar agendamento"}
            </button>
            <p style={{ fontSize: 12, color: LP.dimmer, textAlign: "center", margin: "14px 0 0" }}>
              Precisou mudar? Dá para cancelar pelo app a qualquer momento.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// ── Abas de conteúdo ──────────────────────────────────────────────────────────

const AbaServicos = ({ loja, onAgendar }) => {
  const [busca, setBusca] = useState("");
  const lista = loja.servicos.filter(s => s.nome.toLowerCase().includes(busca.trim().toLowerCase()));

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <Busca valor={busca} onChange={setBusca} placeholder="Pesquisar serviço..." />
      </div>
      {lista.length === 0 && <Vazio titulo="Nada encontrado" texto="Tente outro nome de serviço." />}
      {lista.map(s => (
        <div key={s.nome} style={{
          display: "flex", alignItems: "center", gap: 13, padding: "15px 4px",
          borderBottom: `1px solid ${LP.border}`,
        }}>
          <div style={{
            width: 42, height: 42, borderRadius: 14, flexShrink: 0,
            background: `${LP.roxo}1E`, border: `1px solid ${LP.roxo}3A`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}><Scissors size={18} color={LP.roxoClaro} strokeWidth={1.9} /></div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{s.nome}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12.5 }}>
              <span style={{ color: "#22C55E", fontWeight: 700 }}>{emReais(s.preco)}</span>
              <span style={{ color: LP.dim, display: "inline-flex", alignItems: "center", gap: 4 }}>
                <Clock size={12} strokeWidth={1.8} /> {s.duracao} min
              </span>
            </div>
          </div>

          <button onClick={() => onAgendar(s)} className="lp-btn lp-btn-primario"
            style={{ ...lpBtnPrimario, padding: "9px 18px", fontSize: 12.5, flexShrink: 0 }}>
            Agendar
          </button>
        </div>
      ))}
    </>
  );
};

const AbaDetalhes = ({ loja }) => {
  const hoje = new Date().getDay();
  // expediente vem de segunda a domingo; getDay() começa no domingo.
  const indiceHoje = hoje === 0 ? 6 : hoje - 1;

  return (
    <>
      <Rotulo>Sobre</Rotulo>
      <p style={{ fontSize: 14, color: LP.text, lineHeight: 1.7, margin: "0 0 26px" }}>{loja.sobre}</p>

      <Rotulo>Comodidades</Rotulo>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 9, marginBottom: 26 }}>
        {loja.comodidades.map(c => {
          const Icone = ICONE_COMODIDADE[c] || Check;
          return (
            <div key={c} style={{
              display: "flex", alignItems: "center", gap: 8, padding: "10px 15px",
              borderRadius: 999, border: `1px solid ${LP.border}`, background: "rgba(255,255,255,0.03)",
              fontSize: 12.5, color: LP.text,
            }}>
              <Icone size={15} color={LP.roxoClaro} strokeWidth={1.9} /> {NOME_COMODIDADE[c] || c}
            </div>
          );
        })}
      </div>

      <Rotulo>Horário de atendimento</Rotulo>
      <Cartao style={{ padding: "6px 18px", marginBottom: 26 }}>
        {loja.expediente.map(([dia, faixa], i) => {
          const ehHoje = i === indiceHoje;
          return (
            <div key={dia} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "13px 0", borderBottom: i < loja.expediente.length - 1 ? `1px solid ${LP.border}` : "none",
            }}>
              <span style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13.5, color: ehHoje ? "#fff" : LP.text, fontWeight: ehHoje ? 700 : 400 }}>
                {dia}
                {ehHoje && (
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 999,
                    background: LP.roxo, color: "#fff",
                  }}>Hoje</span>
                )}
              </span>
              <span style={{ fontSize: 13, color: faixa === "Fechado" ? LP.dimmer : LP.text, fontWeight: ehHoje ? 700 : 400 }}>
                {faixa}
              </span>
            </div>
          );
        })}
      </Cartao>

      <Rotulo>Contato</Rotulo>
      <Cartao style={{ fontSize: 13.5, color: LP.dim, lineHeight: 2.1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <MapPin size={15} strokeWidth={1.8} style={{ flexShrink: 0 }} /> {loja.endereco} — {loja.cidade}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Phone size={15} strokeWidth={1.8} style={{ flexShrink: 0 }} /> {loja.telefone}
        </div>
      </Cartao>
    </>
  );
};

const AbaProfissionais = ({ loja }) => (
  <>
    {loja.barbeiros.map(p => (
      <div key={p.nome} style={{
        display: "flex", alignItems: "center", gap: 14, padding: "15px 4px",
        borderBottom: `1px solid ${LP.border}`,
      }}>
        <Inicial nome={p.nome} size={48} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 3 }}>{p.nome}</div>
          <div style={{ fontSize: 12.5, color: LP.dim }}>{p.cargo}</div>
        </div>
        <Estrelas nota={p.nota} size={12} />
      </div>
    ))}
  </>
);

const AbaFidelidade = ({ cliente, loja }) => {
  const [dados, setDados] = useState(null);

  useEffect(() => {
    let ativo = true;
    api.publico.fidelidade(loja.id)
      .then(d => { if (ativo) setDados(d); })
      .catch(() => { /* fidelidade é opcional */ });
    return () => { ativo = false; };
  }, [cliente.id, loja.id]);

  if (!dados) return <Carregando texto="Somando seus pontos..." />;

  const proximo = dados.premios.find(p => !p.liberado);
  const progresso = proximo ? Math.min((dados.pontos / proximo.custo) * 100, 100) : 100;

  return (
    <>
      <Cartao destaque style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: proximo ? 18 : 0 }}>
          <div style={{
            width: 52, height: 52, borderRadius: "50%", flexShrink: 0,
            background: `${LP.roxo}2E`, border: `1px solid ${LP.roxo}55`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}><Gift size={24} color={LP.roxoClaro} strokeWidth={1.9} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: LP.dimmer, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase" }}>
              Meus pontos
            </div>
            <div style={{ fontSize: 30, fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1.2 }}>
              {dados.pontos}
            </div>
          </div>
          <div style={{ textAlign: "right", fontSize: 12, color: LP.dim }}>
            {dados.visitas} visita{dados.visitas === 1 ? "" : "s"}
          </div>
        </div>

        {proximo && (
          <>
            <div style={{ height: 7, borderRadius: 999, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
              <div style={{
                height: "100%", width: `${progresso}%`, borderRadius: 999,
                background: `linear-gradient(90deg, ${LP.roxo}, #A78BFA)`,
                boxShadow: `0 0 14px ${LP.roxo}80`, transition: "width .5s",
              }} />
            </div>
            <div style={{ fontSize: 12.5, color: LP.dim, marginTop: 10, lineHeight: 1.5 }}>
              Faltam <strong style={{ color: LP.roxoClaro }}>{Math.max(proximo.custo - dados.pontos, 0)} pontos</strong> para {proximo.nome.toLowerCase()}.
            </div>
          </>
        )}
      </Cartao>

      <Rotulo>Prêmios</Rotulo>
      {dados.premios.map(p => (
        <div key={p.nome} style={{
          display: "flex", alignItems: "center", gap: 13, padding: "15px 4px",
          borderBottom: `1px solid ${LP.border}`, opacity: p.liberado ? 1 : 0.6,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 14, flexShrink: 0,
            background: p.liberado ? `${LP.roxo}26` : "rgba(255,255,255,0.03)",
            border: `1px solid ${p.liberado ? LP.roxo + "55" : LP.border}`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}><Gift size={17} color={p.liberado ? LP.roxoClaro : LP.dimmer} strokeWidth={1.9} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{p.nome}</div>
            <div style={{ fontSize: 12, color: LP.dim, marginTop: 2 }}>{p.custo} pontos</div>
          </div>
          {p.liberado
            ? <span style={{ fontSize: 11, fontWeight: 700, color: "#22C55E", background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.35)", padding: "5px 12px", borderRadius: 999 }}>Liberado</span>
            : <span style={{ fontSize: 11.5, color: LP.dimmer }}>bloqueado</span>}
        </div>
      ))}
      <p style={{ fontSize: 12, color: LP.dimmer, marginTop: 16, lineHeight: 1.6 }}>
        Você ganha 1 ponto por real gasto nesta barbearia. Resgate no balcão.
      </p>
    </>
  );
};

const AbaAvaliacoes = ({ cliente, loja, onAvaliou }) => {
  const [nota, setNota] = useState(0);
  const [texto, setTexto] = useState("");
  const [aberto, setAberto] = useState(false);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  const enviar = async () => {
    setErro(""); setEnviando(true);
    try {
      await api.publico.avaliar(loja.id, { nota, texto });
      setAberto(false); setNota(0); setTexto("");
      onAvaliou();
    } catch (e) { setErro(e.message); }
    finally { setEnviando(false); }
  };

  return (
    <>
      <Erro texto={erro} onFechar={() => setErro("")} />

      {!aberto ? (
        <Opcao onClick={() => setAberto(true)} style={{ marginBottom: 20 }}>
          <Inicial nome={cliente.nome} size={40} />
          <span style={{ flex: 1, fontSize: 14, color: LP.dim }}>Avaliar estabelecimento</span>
          <Star size={17} color="#F59E0B" fill="#F59E0B" strokeWidth={0} />
        </Opcao>
      ) : (
        <Cartao style={{ marginBottom: 20 }}>
          <Rotulo>Sua nota</Rotulo>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {[1, 2, 3, 4, 5].map(i => (
              <Star key={i} size={32} style={{ cursor: "pointer" }}
                color={i <= nota ? "#F59E0B" : LP.dimmer}
                fill={i <= nota ? "#F59E0B" : "transparent"}
                strokeWidth={i <= nota ? 0 : 1.6}
                onClick={() => setNota(i)} />
            ))}
          </div>
          <textarea
            value={texto}
            onChange={e => setTexto(e.target.value)}
            placeholder="Conte como foi o atendimento (opcional)"
            style={{ ...campoEstilo, minHeight: 88, resize: "none", fontSize: 14, marginBottom: 14 }}
          />
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setAberto(false)} className="lp-btn lp-btn-fantasma"
              style={{ ...lpBtnFantasma, flex: 1, padding: "12px 20px", fontSize: 13.5 }}>Cancelar</button>
            <button onClick={enviar} disabled={enviando || !nota} className="lp-btn lp-btn-primario"
              style={{ ...lpBtnPrimario, flex: 1, padding: "12px 20px", fontSize: 13.5 }}>
              {enviando ? "Enviando..." : "Enviar"}
            </button>
          </div>
        </Cartao>
      )}

      {loja.avaliacoes.length === 0 && <Vazio titulo="Ainda sem avaliações" texto="Seja o primeiro a avaliar." />}
      {loja.avaliacoes.map((a, i) => (
        <div key={i} style={{ display: "flex", gap: 13, padding: "15px 4px", borderBottom: `1px solid ${LP.border}` }}>
          <Inicial nome={a.nome} size={40} cor={a.minha ? LP.roxo : "#64748B"} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 9, flexWrap: "wrap", marginBottom: 4 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{a.nome}</span>
              <span style={{ fontSize: 11.5, color: LP.dimmer }}>{porExtenso(a.data)}</span>
              {a.minha && (
                <span style={{ fontSize: 10, fontWeight: 700, color: LP.roxoClaro, background: `${LP.roxo}22`, border: `1px solid ${LP.roxo}45`, padding: "2px 8px", borderRadius: 999 }}>
                  sua
                </span>
              )}
            </div>
            <Estrelas nota={a.nota} size={12} mostrarNumero={false} />
            {a.texto && <p style={{ fontSize: 13, color: LP.dim, margin: "7px 0 0", lineHeight: 1.6 }}>{a.texto}</p>}
          </div>
        </div>
      ))}
    </>
  );
};

// ── Página ────────────────────────────────────────────────────────────────────

export default function Estabelecimento({ cliente, lojaId, onVoltar, onAgendado }) {
  const [loja, setLoja] = useState(null);
  const [aba, setAba] = useState("servicos");
  const [erro, setErro] = useState("");
  const [agendando, setAgendando] = useState(null);
  const [versao, setVersao] = useState(0);

  const recarregar = useCallback(() => setVersao(v => v + 1), []);

  useEffect(() => {
    let ativo = true;
    api.publico.barbearia(lojaId, { registrarAcesso: true })
      .then(l => { if (ativo) setLoja(l); })
      .catch(e => { if (ativo) setErro(e.message); });
    return () => { ativo = false; };
  }, [lojaId, versao]);

  const favoritar = async () => {
    try {
      const { favorito } = await api.publico.favoritar(lojaId);
      setLoja(l => ({ ...l, favorito }));
    } catch (e) { setErro(e.message); }
  };

  if (agendando && loja) {
    return (
      <Agendar
        loja={loja}
        servico={agendando}
        onVoltar={() => setAgendando(null)}
        onPronto={(a) => { setAgendando(null); onAgendado(a); }}
      />
    );
  }

  if (!loja) {
    return (
      <div style={{ minHeight: "100vh", background: LP.bg, padding: 20 }}>
        <Erro texto={erro} />
        {!erro && <Carregando texto="Abrindo a barbearia..." />}
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: LP.bg, paddingBottom: 40 }}>
      {/* Capa com a inicial gigante ao fundo, como a logo d'água do app */}
      <div style={{ position: "relative", overflow: "hidden", background: `linear-gradient(165deg, ${loja.cor}38, ${LP.bg} 72%)` }}>
        <div style={{
          position: "absolute", right: -20, top: -30, fontSize: 210, fontWeight: 900,
          color: "rgba(255,255,255,0.05)", lineHeight: 1, pointerEvents: "none", userSelect: "none",
        }}>{loja.sigla}</div>

        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 12, padding: "14px 20px" }}>
          <button onClick={onVoltar} aria-label="Voltar" style={{
            width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
            border: `1px solid ${LP.border}`, background: "rgba(5,3,9,0.5)", backdropFilter: "blur(10px)",
            color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          }}><ChevronLeft size={18} strokeWidth={2} /></button>
          <div style={{ flex: 1 }} />
          <button onClick={favoritar} aria-label="Favoritar" style={{
            width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
            border: `1px solid ${loja.favorito ? "#EF444470" : LP.border}`,
            background: loja.favorito ? "rgba(239,68,68,0.16)" : "rgba(5,3,9,0.5)",
            backdropFilter: "blur(10px)", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Heart size={17} strokeWidth={2}
              color={loja.favorito ? "#EF4444" : "#fff"}
              fill={loja.favorito ? "#EF4444" : "transparent"} />
          </button>
        </div>

        <div style={{ position: "relative", padding: "14px 20px 20px", maxWidth: 560, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
            <LogoLoja loja={loja} size={58} />
            <div style={{ minWidth: 0 }}>
              <Estrelas nota={loja.nota} size={14} />
              <h1 style={{ fontSize: 22, fontWeight: 800, color: "#fff", margin: "5px 0 0", letterSpacing: "-0.03em" }}>
                {loja.nome}
              </h1>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, color: LP.dim, lineHeight: 1.55 }}>
            <MapPin size={14} strokeWidth={1.8} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>{loja.endereco} — {loja.cidade} · {distanciaCurta(loja.distancia)}</span>
          </div>
        </div>
      </div>

      {/* Abas roláveis, como no app de referência */}
      <div style={{
        position: "sticky", top: 0, zIndex: 15, display: "flex", gap: 4,
        overflowX: "auto", padding: "0 16px", background: "rgba(5,3,9,0.92)",
        backdropFilter: "blur(20px)", borderBottom: `1px solid ${LP.border}`,
      }}>
        {ABAS.map(([id, rotulo]) => {
          const ativo = aba === id;
          return (
            <button key={id} onClick={() => setAba(id)} style={{
              flexShrink: 0, padding: "16px 14px", background: "none", border: "none",
              borderBottom: `2px solid ${ativo ? LP.roxo : "transparent"}`,
              color: ativo ? "#fff" : LP.dim, fontSize: 13.5,
              fontWeight: ativo ? 700 : 500, cursor: "pointer", fontFamily: "inherit",
              whiteSpace: "nowrap", transition: "color .18s, border-color .18s",
            }}>{rotulo}</button>
          );
        })}
      </div>

      <div style={{ padding: "22px 20px 0", maxWidth: 560, margin: "0 auto" }}>
        <Erro texto={erro} onFechar={() => setErro("")} />
        {aba === "servicos" && <AbaServicos loja={loja} onAgendar={setAgendando} />}
        {aba === "detalhes" && <AbaDetalhes loja={loja} />}
        {aba === "profissionais" && <AbaProfissionais loja={loja} />}
        {aba === "fidelidade" && <AbaFidelidade cliente={cliente} loja={loja} />}
        {aba === "avaliacoes" && <AbaAvaliacoes cliente={cliente} loja={loja} onAvaliou={recarregar} />}
      </div>
    </div>
  );
}
