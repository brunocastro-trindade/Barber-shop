import { useState } from "react";
import { CheckCircle, Phone, Trash2, X } from "lucide-react";

import { api } from "../lib/api.js";
import { dataCurta, emReais, emReaisCurto, paraNumero } from "../lib/formato.js";
import { opcoes, somente, TIPO_CLIENTE } from "../lib/dominio.js";
import { useRecurso } from "../lib/useRecurso.js";
import { B, N } from "../ui/tokens.js";
import { Avatar, Aviso, Badge, Btn, Card, Carregando, Col, Field, PH, Row, Stat, Vazio } from "../ui/base.jsx";

// ── Ficha do cliente ──────────────────────────────────────────────────────────
export const FichaCliente = () => {
  const clientes = useRecurso(() => api.clientes.listar());
  const servicos = useRecurso(() => api.servicos.listar());
  const equipe = useRecurso(() => api.equipe.listar());
  const [selecionadoId, setSelecionadoId] = useState(null);
  const [mostrarAdd, setMostrarAdd] = useState(false);
  const [erroAcao, setErroAcao] = useState("");
  const [salvando, setSalvando] = useState(false);

  const [fNome, setFNome] = useState("");
  const [fTel, setFTel] = useState("");
  const [fTipo, setFTipo] = useState("avulso");
  const [fPref, setFPref] = useState("");

  const lista = clientes.dados || [];
  const servicosAtivos = somente(servicos.dados);
  const equipeAtiva = somente(equipe.dados);
  const selecionado = lista.find(c => c.id === selecionadoId) || null;

  const acao = async (fn) => {
    setErroAcao("");
    setSalvando(true);
    try { await fn(); clientes.recarregar(); }
    catch (e) { setErroAcao(e.message); }
    finally { setSalvando(false); }
  };

  const criar = () => acao(async () => {
    await api.clientes.criar({ nome: fNome, telefone: fTel, tipo: fTipo, equipe_pref: fPref || null });
    setFNome(""); setFTel(""); setFTipo("avulso"); setFPref(""); setMostrarAdd(false);
  });

  if (selecionado) {
    return (
      <DetalheCliente
        cliente={selecionado}
        servicos={servicosAtivos}
        equipe={equipeAtiva}
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
        onAction={() => setMostrarAdd(v => !v)} />

      <Aviso texto={clientes.erro || servicos.erro || equipe.erro || erroAcao} onFechar={() => setErroAcao("")} />

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
            <Field label="BARBEIRO PREFERIDO" type="select" value={fPref} onChange={setFPref}
              placeholder="Sem preferência" options={opcoes(equipeAtiva)} />
          </Row>
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: B.muted, marginBottom: 8, letterSpacing: ".06em" }}>TIPO DE CLIENTE</div>
            <Row gap={8}>
              {Object.entries(TIPO_CLIENTE).map(([key, t]) => (
                <div key={key} onClick={() => setFTipo(key)} style={{ flex: 1, padding: "10px 14px", borderRadius: 999, border: `1px solid ${fTipo === key ? t.color + "70" : B.border}`, background: fTipo === key ? t.color + "15" : B.bg2, cursor: "pointer", textAlign: "center", transition: "all .15s" }}>
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
                <span style={{ fontSize: 11, color: B.muted }}><Phone size={11} strokeWidth={1.8} /> {c.telefone || "Não informado"}</span>
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

const DetalheCliente = ({ cliente, servicos, equipe, salvando, erro, onLimparErro, onVoltar, onAcao, onRemovido }) => {
  const visitas = useRecurso(() => api.clientes.visitas(cliente.id), [cliente.id]);
  const [obs, setObs] = useState(cliente.obs || "");
  const [pref, setPref] = useState(cliente.equipe_pref || "");
  const [regSvc, setRegSvc] = useState("");
  const [regBarb, setRegBarb] = useState("");
  // Vazio = cobra o preço de tabela. Quem digita aqui está cobrando diferente
  // hoje, e é esse número que fica congelado na visita.
  const [regValor, setRegValor] = useState("");

  const historico = visitas.dados || [];
  const servicoEscolhido = (servicos || []).find(s => s.id === regSvc) || null;

  const comRecarga = (fn) => onAcao(async () => { await fn(); visitas.recarregar(); });

  return (
    <Col gap={14}>
      <Row style={{ justifyContent: "space-between" }}>
        <Row gap={10}>
          <button onClick={onVoltar} style={{ background: "transparent", border: `0.5px solid ${B.border}`, color: B.muted, cursor: "pointer", fontSize: 12, padding: "6px 14px", borderRadius: 999, fontFamily: "inherit" }}>← Voltar</button>
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
            style={{ padding: "6px 14px", borderRadius: 999, border: `0.5px solid ${TIPO_CLIENTE[cliente.tipo].color}60`, background: TIPO_CLIENTE[cliente.tipo].color + "18", color: TIPO_CLIENTE[cliente.tipo].color, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
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
          <Field label="BARBEIRO PREFERIDO" type="select" value={pref} onChange={setPref}
            placeholder="Sem preferência" options={opcoes(equipe)} />
          <div style={{ marginTop: 12 }}>
            <Btn color={N.color} disabled={salvando}
              onClick={() => onAcao(() => api.clientes.atualizar(cliente.id, { obs, equipe_pref: pref || null }))}>
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
                  <span style={{ fontSize: 12, color: B.text }}>{h.servico_nome}</span>
                  <span style={{ fontSize: 10, color: B.muted }}>
                    {dataCurta(h.data)} · {h.equipe_nome || "Sem barbeiro"} · {emReais(h.valor)}
                  </span>
                </Col>
                <Row gap={8}>
                  {h.origem && <Badge text={h.origem} color={h.origem === "agenda" ? B.teal : h.origem === "fila" ? B.amber : B.muted} />}
                  <span onClick={() => comRecarga(() => api.clientes.removerVisita(cliente.id, h.id))}
                    style={{ cursor: "pointer", color: B.red, fontWeight: 700 }}><X size={14} strokeWidth={2.2} /></span>
                </Row>
              </div>
            ))}
            {(servicos || []).length === 0 ? (
              <div style={{ fontSize: 11, color: B.muted, marginTop: 12, lineHeight: 1.6 }}>
                Para lançar uma visita à mão é preciso ter serviços cadastrados em <strong>Serviços</strong>.
              </div>
            ) : (
              <Col gap={8} style={{ marginTop: 12 }}>
                <Row gap={8}>
                  <Field label="SERVIÇO" type="select" value={regSvc} onChange={setRegSvc}
                    placeholder="Selecione..." options={opcoes(servicos, s => `${s.nome} · ${emReais(s.preco)}`)} />
                  <Field label="BARBEIRO" type="select" value={regBarb} onChange={setRegBarb}
                    placeholder="Sem barbeiro" options={opcoes(equipe)} />
                  <Field label="VALOR" value={regValor} onChange={setRegValor}
                    placeholder={servicoEscolhido ? emReais(servicoEscolhido.preco) : "do serviço"} />
                </Row>
                <div>
                  <Btn color={N.color} disabled={salvando} onClick={() => comRecarga(async () => {
                    await api.clientes.registrarVisita(cliente.id, {
                      servico_id: regSvc,
                      equipe_id: regBarb || null,
                      // Em branco = herda o preço do catálogo, no servidor.
                      valor: regValor.trim() ? paraNumero(regValor) : undefined,
                    });
                    setRegValor("");
                  })}><CheckCircle size={12} strokeWidth={1.8} /> Registrar Visita</Btn>
                </div>
              </Col>
            )}
          </Card>
        </Col>
      </Row>
    </Col>
  );
};


export default FichaCliente;
