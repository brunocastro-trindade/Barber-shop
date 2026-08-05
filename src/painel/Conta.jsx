import { B } from "../ui/tokens.js";
import { Card, Col, Field, PH, Row } from "../ui/base.jsx";

// ── Taxas & Configurações ─────────────────────────────────────────────────────
export const Taxas = ({ user }) => (
  <Col gap={14}>
    <PH title="Taxas & Configurações" sub="Dados da conta, taxas de pagamento e módulos" />
    <Row gap={10} style={{ alignItems: "flex-start" }}>
      <Card title="Dados da conta" style={{ flex: 1 }}>
        {[["Responsável", user.nome], ["Barbearia", user.barbearia], ["E-mail", user.email], ["WhatsApp", user.whatsapp]].map(([k, v]) => (
          <Row key={k} style={{ justifyContent: "space-between", borderBottom: `0.5px solid ${B.border}`, padding: "9px 0" }}>
            <span style={{ fontSize: 12, color: B.muted, whiteSpace: "nowrap" }}>{k}</span>
            <span style={{ fontSize: 12, color: B.text, fontWeight: 500, textAlign: "right", overflow: "hidden", textOverflow: "ellipsis" }} title={v}>{v}</span>
          </Row>
        ))}
        <div style={{ fontSize: 10, color: B.dim, marginTop: 12, lineHeight: 1.6 }}>
          Estes dados estão salvos no banco, na tabela <strong>barbeiros</strong>. A senha é guardada apenas como hash bcrypt.
        </div>
      </Card>
      <Card title="Taxas de maquininha" style={{ flex: 1 }}>
        {[["Débito", "1,5%"], ["Crédito à vista", "2,5%"], ["Crédito 2×", "3,2%"], ["Crédito 3×–6×", "4,0%"], ["PIX", "0,99%"]].map((t, i) => (
          <Row key={i} style={{ justifyContent: "space-between", borderBottom: `0.5px solid ${B.border}`, padding: "9px 0" }}>
            <span style={{ fontSize: 12, color: B.text }}>{t[0]}</span>
            <div style={{ height: 30, width: 80, background: B.bg2, border: `0.5px solid ${B.border2}`, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: B.text }}>{t[1]}</div>
          </Row>
        ))}
      </Card>
      <Card title="Módulos ativos" style={{ flex: 1 }}>
        <Col gap={14}>
          {[
            { l: "Fila de espera", on: true },
            { l: "Assinaturas mensais", on: true },
            { l: "Notificações WhatsApp", on: false },
            { l: "Notificações por e-mail", on: false },
          ].map((m, i) => (
            <Row key={i} style={{ justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, color: B.text }}>{m.l}</span>
              <Field type={m.on ? "toggle" : "toggle-off"} placeholder="" />
            </Row>
          ))}
        </Col>
      </Card>
    </Row>
  </Col>
);


export default Taxas;
