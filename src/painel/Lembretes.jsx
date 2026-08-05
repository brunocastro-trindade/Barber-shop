import { useState } from "react";
import { MessageSquare, X } from "lucide-react";

import { api } from "../lib/api.js";
import { dataCurta, hojeISO, somarDias } from "../lib/formato.js";
import { somente } from "../lib/dominio.js";
import { useRecurso } from "../lib/useRecurso.js";
import { B, N } from "../ui/tokens.js";
import { Avatar, Aviso, Btn, Card, Carregando, Col, Field, PH, Row, Stat, Vazio } from "../ui/base.jsx";

// ── Lembretes ─────────────────────────────────────────────────────────────────
export const Lembretes = () => {
  const clientes = useRecurso(() => api.clientes.listar());
  const [lembretes, setLembretes] = useState([]);
  const [cliente, setCliente] = useState("");
  const servicos = useRecurso(() => api.servicos.listar());
  const [servico, setServico] = useState("");
  const [data, setData] = useState("");
  const [mensagem, setMensagem] = useState("");

  const lista = clientes.dados || [];
  // Data-corte calculada uma vez na montagem, não a cada render. Comparar
  // strings YYYY-MM-DD funciona: a ordem lexicográfica é a ordem cronológica.
  const [limiteInatividade] = useState(() => somarDias(hojeISO(), -30));
  const inativos = lista.filter(c => !c.ultima_visita || c.ultima_visita < limiteInatividade);

  const criar = () => {
    if (!cliente || !data) return;
    setLembretes(prev => [...prev, { cliente, servico, data, tipo: "Manual" }]);
    setData(""); setMensagem("");
  };

  return (
    <Col gap={14}>
      <PH title="Lembretes & Remarketing" sub="Quem sumiu, quem precisa voltar" />
      <Aviso texto={clientes.erro} />
      <Row gap={10}>
        <Stat label="Lembretes criados" value={lembretes.length + ""} color={N.color} />
        <Stat label="Clientes inativos" value={inativos.length + ""} sub="+30 dias sem visita" color={inativos.length ? B.red : B.teal} />
        <Stat label="Total de clientes" value={lista.length + ""} color={N.secondary} />
      </Row>
      <Row gap={10} style={{ alignItems: "flex-start" }}>
        <Col gap={10} style={{ flex: 2 }}>
          <Card title="Clientes sem visita há mais de 30 dias">
            {clientes.carregando && !clientes.dados && <Carregando />}
            {clientes.dados && inativos.length === 0 && <Vazio texto="Nenhum cliente inativo. Bom sinal." />}
            {inativos.map(c => (
              <div key={c.id} style={{ borderBottom: `0.5px solid ${B.border}`, padding: "11px 0", display: "flex", alignItems: "center", gap: 12 }}>
                <Avatar name={c.nome} color={B.amber} size={32} />
                <Col gap={2} style={{ flex: 1 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: B.text }}>{c.nome}</span>
                  <span style={{ fontSize: 11, color: B.muted }}>
                    {c.ultima_visita ? `Última visita em ${dataCurta(c.ultima_visita)}` : "Nunca veio"} · {c.telefone || "sem telefone"}
                  </span>
                </Col>
                <Btn sm color={N.color} onClick={() => { setCliente(c.nome); setMensagem(`Olá ${c.nome.split(" ")[0]}, faz um tempo que você não aparece! Bora marcar um horário?`); }}>
                  <MessageSquare size={12} strokeWidth={1.8} /> Preparar
                </Btn>
              </div>
            ))}
          </Card>
          <Card title="Lembretes Criados">
            {lembretes.length === 0 && <Vazio texto="Nenhum lembrete criado nesta sessão." />}
            {lembretes.map((r, i) => (
              <Row key={i} style={{ justifyContent: "space-between", padding: "10px 0", borderBottom: `0.5px solid ${B.border}` }}>
                <Col gap={2}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: B.text }}>{r.cliente}</span>
                  <span style={{ fontSize: 11, color: B.muted }}>{r.servico} · {r.data}</span>
                </Col>
                <span onClick={() => setLembretes(prev => prev.filter((_, idx) => idx !== i))} style={{ cursor: "pointer", color: B.red, fontWeight: 700 }}><X size={14} strokeWidth={2.2} /></span>
              </Row>
            ))}
          </Card>
        </Col>
        <Col gap={10} style={{ flex: 1 }}>
          <Card title="Criar Lembrete">
            <Field label="CLIENTE" type="select" value={cliente} onChange={setCliente} placeholder="Selecione..." options={lista.map(c => c.nome)} />
            <Field label="SERVIÇO" type="select" value={servico} onChange={setServico}
              placeholder="Selecione..." options={somente(servicos.dados).map(s => s.nome)} />
            <Field label="DATA" placeholder="Ex: 20/06" value={data} onChange={setData} />
            <Field label="MENSAGEM" type="textarea" value={mensagem} onChange={setMensagem} placeholder="Olá {nome}, bora marcar?" />
            <div style={{ marginTop: 10 }}><Btn color={N.color} onClick={criar}>Criar Lembrete</Btn></div>
          </Card>
          <Card title="Remarketing Automático">
            <Col gap={12}>
              {[["Clientes inativos (+30 dias)", true], ["Lembrete de retorno", true], ["Aniversariantes", false], ["Assinatura vencendo", false]].map(([label, on], i) => (
                <Row key={i} style={{ justifyContent: "space-between" }}>
                  <span style={{ fontSize: 12, color: B.text }}>{label}</span>
                  <Field type={on ? "toggle" : "toggle-off"} placeholder="" />
                </Row>
              ))}
            </Col>
            <div style={{ fontSize: 10, color: B.dim, marginTop: 12, lineHeight: 1.6 }}>
              Os disparos automáticos ainda não estão implementados — a lista acima é a configuração pretendida.
            </div>
          </Card>
        </Col>
      </Row>
    </Col>
  );
};


export default Lembretes;
