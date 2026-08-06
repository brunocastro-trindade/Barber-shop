import { CalendarDays, CheckCircle, ListOrdered, TrendingUp, User, Wallet } from "lucide-react";

import { api } from "../lib/api.js";
import { dataCurta, emReais, emReaisCurto, rotuloDia } from "../lib/formato.js";
import { useRecurso } from "../lib/useRecurso.js";
import { B, N } from "../ui/tokens.js";
import { Aviso, Badge, Btn, Card, Carregando, ChartBar, Col, Row, Stat, Vazio } from "../ui/base.jsx";

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const Dashboard = ({ user, onNavigate }) => {
  const { dados, erro, carregando } = useRecurso(() => api.dashboard.carregar());
  const hoje = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

  const quickLinks = [
    { id: "agenda",        icon: CalendarDays, label: "Ver Agenda" },
    { id: "fila",          icon: ListOrdered,  label: "Fila de Espera" },
    { id: "ficharegistro", icon: User,         label: "Clientes" },
    { id: "financeiro",    icon: Wallet,       label: "Financeiro" },
  ];

  const iconeOrigem = { agenda: CalendarDays, fila: ListOrdered, manual: CheckCircle };

  return (
    <Col gap={16}>
      <Row style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        <Col gap={3}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: B.text, margin: 0 }}>Olá, {user.nome.split(" ")[0]}</h2>
          <p style={{ fontSize: 12, color: B.muted, margin: 0, textTransform: "capitalize" }}>{hoje}</p>
        </Col>
        <Badge text={user.barbearia} color={N.color} />
      </Row>

      <Aviso texto={erro} />
      {carregando && !dados && <Carregando texto="Carregando indicadores..." />}

      {dados && (
        <>
          <Row gap={10}>
            <Stat label="Receita do mês" value={emReaisCurto(dados.receitaMes)} sub={`${dados.atendimentosMes} atendimentos`} color={N.secondary} />
            <Stat label="Ticket médio" value={emReais(dados.ticketMedio)} color={N.color} />
            <Stat label="Clientes" value={dados.clientes + ""} sub={`${dados.assinantes} assinantes`} color={B.teal} />
            <Stat label="Na fila agora" value={dados.naFila + ""} sub="aguardando" color={dados.naFila > 0 ? B.amber : B.muted} />
          </Row>

          <Row gap={10}>
            <Stat label="Comissões do mês" value={emReais(dados.comissoesMes)} sub="a pagar à equipe" color={N.color} />
            <Stat label="Receita recorrente" value={`${emReais(dados.mrr)}/mês`} sub={`${dados.assinaturasAtivas} assinaturas ativas`} color={B.teal} />
            <Stat label="Assinaturas vencidas" value={dados.assinaturasVencidas + ""} sub="cobrança em atraso"
              color={dados.assinaturasVencidas > 0 ? B.red : B.muted} />
            <Stat label="Estoque baixo" value={dados.estoqueBaixo + ""} sub="abaixo do mínimo"
              color={dados.estoqueBaixo > 0 ? B.amber : B.muted} />
          </Row>

          <Row gap={10} style={{ alignItems: "flex-start" }}>
            <Col gap={10} style={{ flex: 2 }}>
              <Card title="Acesso Rápido">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
                  {quickLinks.map(q => (
                    <div key={q.id} onClick={() => onNavigate(q.id)} style={{ padding: "14px 8px", textAlign: "center", background: B.bg2, borderRadius: 14, border: `0.5px solid ${B.border}`, cursor: "pointer", transition: "all .15s" }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = N.color + "80"; e.currentTarget.style.background = N.color + "10"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = B.border; e.currentTarget.style.background = B.bg2; }}>
                      <div style={{ marginBottom: 6, display: "flex", justifyContent: "center" }}><q.icon size={22} color={N.color} strokeWidth={1.6} /></div>
                      <div style={{ fontSize: 10, color: B.muted, fontWeight: 600 }}>{q.label}</div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card title="Faturamento — últimos 7 dias">
                <ChartBar
                  h={110}
                  color={N.color}
                  valores={dados.semana.map(d => d.total)}
                  rotulos={dados.semana.map(d => rotuloDia(d.data).split(" ")[0])}
                />
                <div style={{ fontSize: 10, color: B.muted, marginTop: 10, display: "flex", alignItems: "center", gap: 5 }}>
                  <TrendingUp size={11} strokeWidth={1.8} />
                  Total na semana: {emReais(dados.semana.reduce((s, d) => s + d.total, 0))}
                </div>
              </Card>
            </Col>

            <Col gap={10} style={{ flex: 1 }}>
              <Card title="Próximos agendamentos">
                {dados.proximos.length === 0 && <Vazio texto="Nenhum horário marcado." />}
                {dados.proximos.map((a, i) => (
                  <Row key={a.id} gap={10} style={{ padding: "8px 0", borderBottom: i < dados.proximos.length - 1 ? `0.5px solid ${B.border}` : "none" }}>
                    <Col gap={1} style={{ minWidth: 44 }}>
                      <span style={{ fontSize: 11, color: N.color, fontWeight: 700 }}>{a.hora_inicio}</span>
                      <span style={{ fontSize: 9, color: B.dim }}>{dataCurta(a.data)}</span>
                    </Col>
                    <Col gap={2} style={{ flex: 1 }}>
                      <span style={{ fontSize: 12, color: B.text, fontWeight: 600 }}>{a.cliente_nome}</span>
                      <span style={{ fontSize: 10, color: B.muted }}>{a.servico_nome} · {a.equipe_nome || "sem barbeiro"}</span>
                    </Col>
                    <Badge text={emReais(a.valor)} color={B.teal} />
                  </Row>
                ))}
                <div style={{ marginTop: 10 }}><Btn sm color={N.color} onClick={() => onNavigate("agenda")}>Ver agenda completa</Btn></div>
              </Card>

              <Card title="Atendimentos recentes">
                {dados.atividade.length === 0 && <Vazio texto="Nenhum atendimento registrado." />}
                {dados.atividade.map((a, i) => {
                  const Icone = iconeOrigem[a.origem] || CheckCircle;
                  return (
                    <Row key={i} gap={8} style={{ padding: "7px 0", borderBottom: i < dados.atividade.length - 1 ? `0.5px solid ${B.border}` : "none" }}>
                      <Icone size={14} color={N.secondary} strokeWidth={1.8} style={{ flexShrink: 0 }} />
                      <Col gap={1} style={{ flex: 1 }}>
                        <span style={{ fontSize: 11, color: B.text }}>{a.cliente_nome}, {a.servico_nome}</span>
                        <span style={{ fontSize: 10, color: B.muted }}>{dataCurta(a.data)} · {emReais(a.valor)} · {a.equipe_nome || "Sem barbeiro"}</span>
                      </Col>
                    </Row>
                  );
                })}
              </Card>
            </Col>
          </Row>
        </>
      )}
    </Col>
  );
};


export default Dashboard;
