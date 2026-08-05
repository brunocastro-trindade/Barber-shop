import { useState } from "react";
import { Check, User, X } from "lucide-react";

import { api } from "../lib/api.js";
import { emReais } from "../lib/formato.js";
import { opcoes, somente, TIPO_CLIENTE } from "../lib/dominio.js";
import { useRecurso } from "../lib/useRecurso.js";
import { B, N } from "../ui/tokens.js";
import { Avatar, Aviso, Badge, Btn, Card, Carregando, Col, Field, PH, Row, Stat, Vazio } from "../ui/base.jsx";

// ── Fila de espera ────────────────────────────────────────────────────────────
export const FilaEspera = () => {
  const fila = useRecurso(() => api.fila.listar());
  const clientes = useRecurso(() => api.clientes.listar());
  const servicos = useRecurso(() => api.servicos.listar());
  const equipe = useRecurso(() => api.equipe.listar());

  const [fClienteId, setFClienteId] = useState("");
  const [fNome, setFNome] = useState("");
  const [fServicoId, setFServicoId] = useState("");
  const [fEquipeId, setFEquipeId] = useState("");
  const [fTipo, setFTipo] = useState("avulso");
  // Quem entrou como "qualquer barbeiro" só define quem atendeu na hora da baixa.
  const [quemAtendeu, setQuemAtendeu] = useState({});
  const [erroAcao, setErroAcao] = useState("");
  const [salvando, setSalvando] = useState(false);

  const lista = fila.dados || [];
  const servicosAtivos = somente(servicos.dados);
  const equipeAtiva = somente(equipe.dados);

  const acao = async (fn) => {
    setErroAcao("");
    setSalvando(true);
    try { await fn(); fila.recarregar(); }
    catch (e) { setErroAcao(e.message); }
    finally { setSalvando(false); }
  };

  const entrar = () => acao(async () => {
    await api.fila.entrar({
      cliente_id: fClienteId || null,
      nome: fClienteId ? null : fNome.trim(),
      servico_id: fServicoId,
      equipe_id: fEquipeId || null,
      tipo: fTipo,
    });
    setFNome(""); setFClienteId(""); setFTipo("avulso");
  });

  const atender = (item) => acao(async () => {
    const equipeId = item.equipe_id || quemAtendeu[item.id];
    if (!equipeId) throw new Error("Escolha quem atendeu antes de dar baixa.");
    await api.fila.atender(item.id, { equipe_id: equipeId });
    setQuemAtendeu(q => { const novo = { ...q }; delete novo[item.id]; return novo; });
  });

  return (
    <Col gap={14}>
      <PH title="Fila de Espera" sub="Clientes walk-in — atender registra o atendimento no caixa e na ficha" />
      <Aviso texto={fila.erro || servicos.erro || equipe.erro || erroAcao} onFechar={() => setErroAcao("")} />

      <Row gap={10}>
        <Stat label="Na fila agora" value={lista.length + ""} sub="aguardando" color={N.color} />
        <Stat label="Barbeiros ativos" value={equipeAtiva.length + ""} color={B.teal} />
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
                  <span style={{ fontSize: 11, color: B.muted }}>{c.servico_nome}{c.preco != null ? ` · ${emReais(c.preco)}` : ""}</span>
                  <span style={{ fontSize: 11, color: B.muted, display: "flex", alignItems: "center", gap: 4 }}>
                    <User size={11} strokeWidth={1.8} /> {c.equipe_nome || "Qualquer barbeiro"}
                  </span>
                </Row>
              </Col>
              <Row gap={6}>
                {!c.equipe_id && (
                  <div style={{ width: 150 }}>
                    <Field type="select" placeholder="Quem atendeu?"
                      value={quemAtendeu[c.id] || ""}
                      onChange={v => setQuemAtendeu(q => ({ ...q, [c.id]: v }))}
                      options={opcoes(equipeAtiva)} />
                  </div>
                )}
                <Btn sm color={N.color} disabled={salvando} onClick={() => atender(c)}><Check size={12} strokeWidth={2} /> Atender</Btn>
                <span onClick={() => acao(() => api.fila.remover(c.id))} style={{ cursor: "pointer", color: B.red, fontWeight: 700, padding: "4px 6px" }}><X size={14} strokeWidth={2.2} /></span>
              </Row>
            </div>
          ))}
        </Card>

        <Col gap={10} style={{ flex: 1 }}>
          <Card title="Adicionar à fila">
            <Field label="CLIENTE COM FICHA" type="select" value={fClienteId} onChange={setFClienteId}
              placeholder="Sem ficha (avulso)..." options={opcoes(clientes.dados)} />
            {!fClienteId && (
              <Field label="NOME DO CLIENTE" placeholder="Quem chegou agora" value={fNome} onChange={setFNome} />
            )}
            <Field label="SERVIÇO" type="select" value={fServicoId} onChange={setFServicoId}
              placeholder="Selecione..."
              options={opcoes(servicosAtivos, s => `${s.nome} · ${emReais(s.preco)}`)} />
            <Field label="BARBEIRO" type="select" value={fEquipeId} onChange={setFEquipeId}
              placeholder="Qualquer um que liberar" options={opcoes(equipeAtiva)} />
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: B.muted, marginBottom: 8, letterSpacing: ".06em" }}>TIPO DE CLIENTE</div>
              <Row gap={8}>
                {Object.entries(TIPO_CLIENTE).map(([key, t]) => (
                  <div key={key} onClick={() => setFTipo(key)} style={{ flex: 1, padding: "8px 10px", borderRadius: 999, border: `1px solid ${fTipo === key ? t.color + "70" : B.border}`, background: fTipo === key ? t.color + "15" : B.bg2, cursor: "pointer", textAlign: "center", transition: "all .15s" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: fTipo === key ? t.color : B.muted }}>{t.label}</span>
                  </div>
                ))}
              </Row>
            </div>
            <div style={{ marginTop: 12 }}><Btn color={N.color} onClick={entrar} disabled={salvando}>+ Entrar na fila</Btn></div>
          </Card>

          <Card title="Status dos Barbeiros">
            {equipe.carregando && !equipe.dados && <Carregando />}
            {equipe.dados && equipeAtiva.length === 0 && <Vazio texto="Nenhum barbeiro ativo." />}
            {equipeAtiva.map(p => {
              const esperando = lista.filter(c => c.equipe_id === p.id).length;
              return (
                <Row key={p.id} style={{ justifyContent: "space-between", borderBottom: `0.5px solid ${B.border}`, padding: "10px 0" }}>
                  <Row gap={8}><Avatar name={p.nome} color={N.color} size={28} /><span style={{ fontSize: 12, color: B.text }}>{p.nome}</span></Row>
                  <Badge text={esperando ? `${esperando} na fila` : "Disponível"} color={esperando ? B.amber : B.teal} />
                </Row>
              );
            })}
            {lista.some(c => !c.equipe_id) && (
              <div style={{ fontSize: 10, color: B.dim, marginTop: 10, lineHeight: 1.6 }}>
                {lista.filter(c => !c.equipe_id).length} cliente(s) esperando qualquer barbeiro — escolha quem atendeu na hora da baixa.
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </Col>
  );
};


export default FilaEspera;
