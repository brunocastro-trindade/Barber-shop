import { useState } from "react";
import { Check, ChevronLeft, ChevronRight, Trash2, X } from "lucide-react";

import { api } from "../lib/api.js";
import { dataCurta, emReais, hojeISO, periodoDaSemana, rotuloDia, segundaDaSemana, somarDias } from "../lib/formato.js";
import { emMinutos, HORARIOS, opcoes, somente } from "../lib/dominio.js";
import { useRecurso } from "../lib/useRecurso.js";
import { makePDF } from "../lib/pdf.js";
import { B, N } from "../ui/tokens.js";
import { Avatar, Aviso, Badge, Btn, Card, Carregando, Col, Divider, Field, PH, Row, Stat, Vazio } from "../ui/base.jsx";

// ── Agenda ────────────────────────────────────────────────────────────────────
export const Agenda = () => {
  const [inicio, setInicio] = useState(() => segundaDaSemana(hojeISO()));
  const dias = Array.from({ length: 6 }, (_, i) => somarDias(inicio, i)); // seg → sáb
  const fim = dias[dias.length - 1];

  const agenda = useRecurso(() => api.agenda.listar(inicio, fim), [inicio]);
  const clientes = useRecurso(() => api.clientes.listar());
  const servicos = useRecurso(() => api.servicos.listar());
  const equipe = useRecurso(() => api.equipe.listar());

  const [selecionadoId, setSelecionadoId] = useState(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [erroAcao, setErroAcao] = useState("");
  const [salvando, setSalvando] = useState(false);

  const [fDia, setFDia] = useState(dias[0]);
  const [fHora, setFHora] = useState(HORARIOS[1]);
  const [fCliente, setFCliente] = useState("");
  const [fServicoId, setFServicoId] = useState("");
  const [fEquipeId, setFEquipeId] = useState("");

  const lista = agenda.dados || [];
  const servicosAtivos = somente(servicos.dados);
  const equipeAtiva = somente(equipe.dados);
  const servicoEscolhido = servicosAtivos.find(s => s.id === fServicoId) || null;

  // Um atendimento ocupa um intervalo, não uma célula: 45 min a partir das 09:00
  // pinta 09:00 e 10:00 na grade. O cartão sai no primeiro slot coberto.
  const porSlot = {};
  lista.filter(a => a.status !== "Cancelado").forEach(a => {
    const ini = emMinutos(a.hora_inicio);
    const termino = ini + (a.duracao_min || 30);
    HORARIOS.filter(h => emMinutos(h) >= ini && emMinutos(h) < termino)
      .forEach((h, i) => { porSlot[`${a.data}-${h}`] = { ag: a, comeca: i === 0 }; });
  });

  const selecionado = lista.find(a => a.id === selecionadoId) || null;
  const hoje = hojeISO();

  const acao = async (fn) => {
    setErroAcao("");
    setSalvando(true);
    try {
      await fn();
      agenda.recarregar();
    } catch (e) {
      setErroAcao(e.message);
    } finally {
      setSalvando(false);
    }
  };

  const criar = () => acao(async () => {
    const cliente = (clientes.dados || []).find(c => c.id === fCliente);
    if (!cliente) throw new Error("Selecione um cliente.");
    // Mandamos ids, não nomes nem valor: preço, comissão e duração saem do
    // catálogo e são congelados pelo servidor no momento do agendamento.
    await api.agenda.criar({
      cliente_id: cliente.id,
      cliente_nome: cliente.nome,
      data: fDia,
      hora_inicio: fHora,
      servico_id: fServicoId,
      equipe_id: fEquipeId,
    });
    setMostrarForm(false);
  });

  const irParaSemana = (delta) => {
    setSelecionadoId(null);
    setInicio(somarDias(inicio, delta * 7));
  };

  return (
    <Col gap={14}>
      <PH
        title="Agenda"
        sub={periodoDaSemana(inicio, fim)}
        action={mostrarForm ? "Fechar Formulário" : "+ Novo Agendamento"}
        onAction={() => setMostrarForm(v => !v)}
        onExport={() => makePDF(N.name, [{
          title: `Agendamentos — ${periodoDaSemana(inicio, fim)}`,
          columns: ["Cliente", "Serviço", "Data", "Hora", "Barbeiro", "Status", "Valor"],
          rows: lista.map(a => [a.cliente_nome, a.servico_nome, dataCurta(a.data), a.hora_inicio, a.equipe_nome || "—", a.status, emReais(a.valor)]),
        }])}
      />

      <Aviso texto={agenda.erro || servicos.erro || equipe.erro || erroAcao} onFechar={() => setErroAcao("")} />

      <Row gap={10}>
        <Row gap={6}>
          <Btn sm onClick={() => irParaSemana(-1)}><ChevronLeft size={13} strokeWidth={2} /> Anterior</Btn>
          <Btn sm onClick={() => setInicio(segundaDaSemana(hojeISO()))}>Hoje</Btn>
          <Btn sm onClick={() => irParaSemana(1)}>Próxima <ChevronRight size={13} strokeWidth={2} /></Btn>
        </Row>
        <Stat label="Na semana" value={lista.filter(a => a.status !== "Cancelado").length + ""} />
        <Stat label="Pagos" value={lista.filter(a => a.status === "Pago").length + ""} color={N.secondary} />
        <Stat label="A receber" value={emReais(lista.filter(a => a.status === "Confirmado").reduce((s, a) => s + a.valor, 0))} color={B.amber} />
      </Row>

      {mostrarForm && (
        <Card title="Novo Agendamento">
          {clientes.dados?.length === 0 && (
            <Aviso texto="Cadastre um cliente antes de agendar — a ficha do cliente fica em Ficha do Cliente." />
          )}
          {servicos.dados && servicosAtivos.length === 0 && (
            <Aviso texto="Nenhum serviço ativo no catálogo. Cadastre em Serviços: é de lá que saem preço, duração e comissão." />
          )}
          {equipe.dados && equipeAtiva.length === 0 && (
            <Aviso texto="Nenhum barbeiro ativo. Cadastre em Equipe — é ele que ocupa o horário." />
          )}
          <Row gap={10}>
            <Field label="DIA" type="select" value={fDia} onChange={setFDia}
              options={dias.map(d => ({ valor: d, rotulo: rotuloDia(d) }))} />
            <Field label="HORA" type="select" value={fHora} onChange={setFHora} options={HORARIOS} />
            <Field label="CLIENTE" type="select" value={fCliente} onChange={setFCliente}
              placeholder="Selecione..."
              options={(clientes.dados || []).map(c => ({ valor: c.id, rotulo: c.nome }))} />
            <Field label="SERVIÇO" type="select" value={fServicoId} onChange={setFServicoId}
              placeholder="Selecione..."
              options={opcoes(servicosAtivos, s => `${s.nome} · ${emReais(s.preco)} · ${s.duracao_min}min`)} />
            <Field label="BARBEIRO" type="select" value={fEquipeId} onChange={setFEquipeId}
              placeholder="Selecione..." options={opcoes(equipeAtiva)} />
          </Row>
          <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end", gap: 10, alignItems: "center" }}>
            <span style={{ fontSize: 11, color: B.muted }}>
              {servicoEscolhido
                ? `${emReais(servicoEscolhido.preco)} · ${servicoEscolhido.duracao_min} min · comissão ${servicoEscolhido.comissao_pct}%`
                : "Escolha o serviço para ver valor e duração"}
            </span>
            <Btn onClick={() => setMostrarForm(false)}>Cancelar</Btn>
            <Btn color={N.color} onClick={criar} disabled={salvando}>{salvando ? "Salvando..." : "Agendar"}</Btn>
          </div>
        </Card>
      )}

      <Row gap={10} style={{ alignItems: "flex-start" }}>
        <Card style={{ flex: 3, overflowX: "auto" }}>
          {agenda.carregando && !agenda.dados ? <Carregando texto="Carregando agenda..." /> : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "48px repeat(6,1fr)", marginBottom: 4 }}>
                <div />
                {dias.map(d => (
                  <div key={d} style={{ textAlign: "center", fontSize: 11, color: d === hoje ? N.color : B.muted, fontWeight: d === hoje ? 700 : 400, paddingBottom: 8, borderBottom: `2px solid ${d === hoje ? N.color : B.border}` }}>{rotuloDia(d)}</div>
                ))}
              </div>
              {HORARIOS.map(h => (
                <div key={h} style={{ display: "grid", gridTemplateColumns: "48px repeat(6,1fr)", borderBottom: `0.5px solid ${B.border}`, minHeight: 40 }}>
                  <div style={{ fontSize: 10, color: B.dim, paddingTop: 4, paddingRight: 8, textAlign: "right" }}>{h}</div>
                  {dias.map(d => {
                    const celula = porSlot[`${d}-${h}`];
                    const a = celula?.ag;
                    const ativo = a && a.id === selecionadoId;
                    const c = a ? (a.status === "Pago" ? N.secondary : (ativo ? N.color : B.teal)) : "transparent";
                    return (
                      <div key={d} style={{ borderLeft: `0.5px solid ${B.border}`, padding: "3px 4px", background: d === hoje ? N.color + "08" : "transparent" }}>
                        {a && celula.comeca && (
                          <div onClick={() => setSelecionadoId(a.id)}
                            style={{ background: c + "25", border: `0.5px solid ${c}`, borderRadius: 5, padding: "3px 6px", fontSize: 10, color: c, lineHeight: 1.3, cursor: "pointer", fontWeight: ativo ? 700 : 400 }}>
                            {a.cliente_nome} — {a.servico_nome}
                          </div>
                        )}
                        {a && !celula.comeca && (
                          // Continuação do atendimento anterior: ocupado, sem repetir o texto.
                          <div onClick={() => setSelecionadoId(a.id)}
                            style={{ height: "100%", minHeight: 18, background: c + "12", borderLeft: `2px solid ${c}55`, borderRadius: 3, cursor: "pointer" }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </>
          )}
        </Card>

        <Col gap={10} style={{ flex: 1 }}>
          <Card title="Detalhes">
            {!selecionado && <Vazio texto="Clique em um horário para ver os detalhes." />}
            {selecionado && (
              <>
                <Row gap={8} style={{ marginBottom: 10 }}>
                  <Avatar name={selecionado.cliente_nome} color={N.color} size={36} />
                  <Col gap={2}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: B.text }}>{selecionado.cliente_nome}</span>
                    <span style={{ fontSize: 11, color: B.muted }}>{selecionado.servico_nome}</span>
                  </Col>
                </Row>
                <Divider />
                <Col gap={8}>
                  <Row style={{ justifyContent: "space-between" }}><span style={{ fontSize: 11, color: B.muted }}>Data</span><span style={{ fontSize: 11, color: B.text }}>{rotuloDia(selecionado.data)} — {selecionado.hora_inicio}</span></Row>
                  <Row style={{ justifyContent: "space-between" }}><span style={{ fontSize: 11, color: B.muted }}>Duração</span><span style={{ fontSize: 11, color: B.text }}>{selecionado.duracao_min} min</span></Row>
                  <Row style={{ justifyContent: "space-between" }}><span style={{ fontSize: 11, color: B.muted }}>Valor</span><span style={{ fontSize: 11, color: B.text }}>{emReais(selecionado.valor)}</span></Row>
                  <Row style={{ justifyContent: "space-between" }}><span style={{ fontSize: 11, color: B.muted }}>Comissão</span><span style={{ fontSize: 11, color: B.text }}>{selecionado.comissao_pct}% · {emReais(selecionado.valor * selecionado.comissao_pct / 100)}</span></Row>
                  <Row style={{ justifyContent: "space-between" }}><span style={{ fontSize: 11, color: B.muted }}>Barbeiro</span><span style={{ fontSize: 11, color: B.text }}>{selecionado.equipe_nome || "—"}</span></Row>
                  <Row style={{ justifyContent: "space-between" }}>
                    <span style={{ fontSize: 11, color: B.muted }}>Status</span>
                    <Badge text={selecionado.status} color={selecionado.status === "Pago" ? N.secondary : selecionado.status === "Cancelado" ? B.red : B.teal} />
                  </Row>
                </Col>
                <Divider />
                <Col gap={6}>
                  {selecionado.status === "Confirmado" && (
                    <Btn color={N.color} disabled={salvando} onClick={() => acao(() => api.agenda.pagar(selecionado.id))}>
                      <Check size={12} strokeWidth={2} /> Marcar como pago
                    </Btn>
                  )}
                  <Row gap={6}>
                    {selecionado.status === "Confirmado" && (
                      <Btn sm danger disabled={salvando} onClick={() => acao(() => api.agenda.cancelar(selecionado.id))}>Cancelar</Btn>
                    )}
                    <Btn sm danger disabled={salvando} onClick={() => acao(async () => {
                      await api.agenda.remover(selecionado.id);
                      setSelecionadoId(null);
                    })}><Trash2 size={12} strokeWidth={1.8} /> Remover</Btn>
                  </Row>
                  {selecionado.status === "Pago" && (
                    <span style={{ fontSize: 10, color: B.muted, lineHeight: 1.5 }}>
                      O pagamento já gerou uma visita na ficha do cliente e entrou no faturamento.
                    </span>
                  )}
                </Col>
              </>
            )}
          </Card>

          <Card title="Cancelados na semana">
            {lista.filter(a => a.status === "Cancelado").length === 0 && <Vazio texto="Nenhum cancelamento." />}
            {lista.filter(a => a.status === "Cancelado").map(a => (
              <Row key={a.id} style={{ justifyContent: "space-between", padding: "7px 0", borderBottom: `0.5px solid ${B.border}` }}>
                <Col gap={1}>
                  <span style={{ fontSize: 11, color: B.muted, textDecoration: "line-through" }}>{a.cliente_nome}</span>
                  <span style={{ fontSize: 10, color: B.dim }}>{dataCurta(a.data)} · {a.hora_inicio}</span>
                </Col>
                <span onClick={() => acao(() => api.agenda.remover(a.id))} style={{ cursor: "pointer", color: B.red, fontWeight: 700 }}><X size={13} strokeWidth={2.2} /></span>
              </Row>
            ))}
          </Card>
        </Col>
      </Row>
    </Col>
  );
};


export default Agenda;
