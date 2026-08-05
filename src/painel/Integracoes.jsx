import { Calendar, MessageSquare } from "lucide-react";

import { B, N } from "../ui/tokens.js";
import { Btn, Card, Col, Divider, Field, PH, Row } from "../ui/base.jsx";

// ── Integrações ───────────────────────────────────────────────────────────────
export const WhatsAppEmail = ({ user }) => (
  <Col gap={14}>
    <PH title="Integrações" sub="WhatsApp, e-mail e notificações automáticas" />
    <Row gap={10} style={{ alignItems: "flex-start" }}>
      <Card title="WhatsApp" style={{ flex: 1 }}>
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <div style={{ width: 70, height: 70, background: B.muted + "20", border: `2px solid ${B.muted}`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}><MessageSquare size={28} color={B.muted} strokeWidth={2} /></div>
          <div style={{ fontSize: 14, fontWeight: 700, color: B.muted }}>Não conectado</div>
          <div style={{ fontSize: 11, color: B.dim, marginTop: 4 }}>{user.whatsapp}</div>
          <Row gap={8} style={{ justifyContent: "center", marginTop: 12 }}><Btn color={N.color}>Conectar WhatsApp</Btn></Row>
        </div>
        <Divider />
        <Col gap={10}>
          {["Confirmação de agendamento", "Lembrete 24h antes", "Aviso de vez na fila", "Remarketing automático"].map((m, i) => (
            <Row key={i} style={{ justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, color: B.text }}>{m}</span>
              <Field type={i < 3 ? "toggle" : "toggle-off"} placeholder="" />
            </Row>
          ))}
        </Col>
      </Card>
      <Card title="E-mail" style={{ flex: 1 }}>
        <Field label="E-MAIL DA CONTA" value={user.email} />
        <Field label="NOME DO REMETENTE" value={user.barbearia} />
        <Divider />
        <Col gap={10}>
          {["Confirmação de agendamento", "Resumo diário", "Alerta de estoque baixo", "Relatório semanal"].map((m, i) => (
            <Row key={i} style={{ justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, color: B.text }}>{m}</span>
              <Field type={i < 3 ? "toggle" : "toggle-off"} placeholder="" />
            </Row>
          ))}
        </Col>
      </Card>
      <Card title="Preview do e-mail" style={{ flex: 1 }}>
        <div style={{ border: `0.5px solid ${B.border}`, borderRadius: 14, overflow: "hidden" }}>
          <div style={{ padding: "10px 14px", background: N.color, color: "#fff", fontSize: 12, fontWeight: 600 }}>{user.barbearia}</div>
          <div style={{ padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: B.text, marginBottom: 8 }}>Seu horário está confirmado!</div>
            <div style={{ fontSize: 11, color: B.muted, lineHeight: 1.8 }}>
              Olá <strong>João</strong>,<br />
              Corte + Barba com Lucas confirmado para:<br />
              <Calendar size={12} strokeWidth={1.8} style={{ verticalAlign: "middle", marginRight: 4 }} /> Terça-feira às 09:00
            </div>
            <div style={{ marginTop: 12, padding: 10, background: N.color + "20", borderRadius: 6, border: `0.5px solid ${N.color}`, textAlign: "center" }}>
              <div style={{ fontSize: 12, color: N.color, fontWeight: 600 }}>Confirmar presença</div>
            </div>
          </div>
        </div>
        <div style={{ fontSize: 10, color: B.dim, marginTop: 10, lineHeight: 1.6 }}>
          Nenhuma integração está ativa: esta tela mostra como as mensagens ficariam.
        </div>
      </Card>
    </Row>
  </Col>
);


export default WhatsAppEmail;
