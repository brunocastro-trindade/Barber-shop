import { CheckCircle, CreditCard, FileText, Package, Scissors, Users, Wallet } from "lucide-react";

import { api } from "../lib/api.js";
import { dataCurta, emReais } from "../lib/formato.js";
import { TIPO_CLIENTE } from "../lib/dominio.js";
import { useRecurso } from "../lib/useRecurso.js";
import { makePDF } from "../lib/pdf.js";
import { B, N } from "../ui/tokens.js";
import { Aviso, Card, Col, Girando, PH, Row } from "../ui/base.jsx";

// ── Exportar dados ────────────────────────────────────────────────────────────
export const ExportarDados = ({ user }) => {
  const clientes = useRecurso(() => api.clientes.listar());
  const visitas = useRecurso(() => api.visitas.listar(500));
  const servicos = useRecurso(() => api.servicos.listar());
  const produtos = useRecurso(() => api.produtos.listar());
  const equipe = useRecurso(() => api.equipe.listar());
  const planos = useRecurso(() => api.planos.listar());
  const assinaturas = useRecurso(() => api.assinaturas.listar());
  const despesas = useRecurso(() => api.despesas.listar());

  const nomeNegocio = `${user.barbearia} — ${user.nome}`;
  const recursos = [clientes, visitas, servicos, produtos, equipe, planos, assinaturas, despesas];

  const secoes = {
    clientes: {
      title: "Clientes",
      columns: ["Nome", "Telefone", "Tipo", "Barbeiro preferido", "Visitas", "Última visita", "Total gasto"],
      rows: (clientes.dados || []).map(c => [c.nome, c.telefone || "—", TIPO_CLIENTE[c.tipo].label, c.equipe_pref_nome || "—", c.visitas + "", dataCurta(c.ultima_visita), emReais(c.total_gasto)]),
    },
    atendimentos: {
      title: "Atendimentos",
      columns: ["Data", "Cliente", "Serviço", "Barbeiro", "Valor", "Comissão", "Origem"],
      rows: (visitas.dados || []).map(v => [dataCurta(v.data), v.cliente_nome, v.servico_nome, v.equipe_nome || "—", emReais(v.valor), emReais(v.comissao_valor), v.origem]),
    },
    servicos: {
      title: "Serviços",
      columns: ["Nome", "Duração", "Preço", "Comissão", "Situação"],
      rows: (servicos.dados || []).map(s => [s.nome, `${s.duracao_min} min`, emReais(s.preco), `${s.comissao_pct}%`, s.ativo ? "Ativo" : "Inativo"]),
    },
    estoque: {
      title: "Estoque de Produtos",
      columns: ["Produto", "Preço unit.", "Qtd. atual", "Mínimo"],
      rows: (produtos.dados || []).map(p => [p.nome, emReais(p.preco), p.quantidade + "", p.minimo + ""]),
    },
    equipe: {
      title: "Equipe de Barbeiros",
      columns: ["Barbeiro", "Situação"],
      rows: (equipe.dados || []).map(p => [p.nome, p.ativo ? "Ativo" : "Inativo"]),
    },
    planos: {
      title: "Planos de Assinatura",
      columns: ["Plano", "Preço", "Assinantes", "Serviços incluídos", "Situação"],
      rows: (planos.dados || []).map(p => [p.nome, emReais(p.preco), (p.assinantes ?? 0) + "", (p.incluidos || []).join(", "), p.ativo ? "Ativo" : "Inativo"]),
    },
    assinaturas: {
      title: "Assinaturas",
      columns: ["Cliente", "Plano", "Início", "Vencimento", "Situação"],
      rows: (assinaturas.dados || []).map(a => [a.cliente_nome, a.plano_nome, dataCurta(a.inicio), dataCurta(a.vencimento), a.status === "ativa" ? (a.vencida ? "Vencida" : "Em dia") : "Cancelada"]),
    },
    despesas: {
      title: "Gastos",
      columns: ["Data", "Descrição", "Valor", "Status"],
      rows: (despesas.dados || []).map(d => [dataCurta(d.data), d.descricao, emReais(d.valor), d.status]),
    },
  };

  const lista = Object.entries(secoes).map(([key, s]) => ({ key, ...s }));
  const icones = {
    clientes: Users, atendimentos: CheckCircle, servicos: Scissors, estoque: Package,
    equipe: Users, planos: CreditCard, assinaturas: CreditCard, despesas: Wallet,
  };
  const carregando = recursos.some(r => r.carregando);
  const erro = recursos.map(r => r.erro).find(Boolean);

  return (
    <Col gap={16}>
      <PH title="Exportar Dados" sub="Gere PDFs para migração ou backup" />
      <Aviso texto={erro} />

      <Card>
        <Row gap={12}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: N.color + "20", border: `0.5px solid ${N.color}40`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <FileText size={20} color={N.color} strokeWidth={1.8} />
          </div>
          <Col gap={4} style={{ flex: 1 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: B.text }}>Exportação para migração de sistema</span>
            <span style={{ fontSize: 11, color: B.muted, lineHeight: 1.6 }}>
              Todos os cadastros de clientes, atendimentos, serviços, estoque e equipe são extraídos diretamente do banco de dados.
            </span>
          </Col>
        </Row>
      </Card>

      <Card style={{ border: `1px solid ${N.color}40`, background: N.color + "08" }}>
        <Row style={{ justifyContent: "space-between", alignItems: "center" }}>
          <Col gap={4}>
            <span style={{ fontSize: 14, fontWeight: 700, color: B.text }}>Exportação completa</span>
            <span style={{ fontSize: 11, color: B.muted }}>{lista.length} seções em um único PDF</span>
          </Col>
          <button disabled={carregando} onClick={() => makePDF(nomeNegocio, Object.values(secoes))}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 22px", borderRadius: 999, background: N.color, color: "#fff", border: "none", cursor: carregando ? "not-allowed" : "pointer", opacity: carregando ? 0.5 : 1, fontFamily: "inherit", fontSize: 13, fontWeight: 700, boxShadow: `0 4px 18px ${N.color}40` }}>
            {carregando ? <Girando color="#fff" /> : <FileText size={15} strokeWidth={2} />} Exportar tudo em PDF
          </button>
        </Row>
      </Card>

      <div style={{ fontSize: 10, fontWeight: 700, color: N.color, letterSpacing: ".08em" }}>EXPORTAR POR SEÇÃO</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
        {lista.map(s => {
          const Icone = icones[s.key] || FileText;
          return (
            <Card key={s.key} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px" }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: B.bg2, border: `0.5px solid ${B.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icone size={17} color={N.color} strokeWidth={1.8} />
              </div>
              <Col gap={2} style={{ flex: 1 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: B.text }}>{s.title}</span>
                <span style={{ fontSize: 10, color: B.muted }}>{s.rows.length} registros</span>
              </Col>
              <button onClick={() => makePDF(nomeNegocio, [s])}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 15px", borderRadius: 999, background: B.bg2, color: B.muted, border: `0.5px solid ${B.border}`, cursor: "pointer", fontFamily: "inherit", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>
                <FileText size={12} strokeWidth={1.8} /> PDF
              </button>
            </Card>
          );
        })}
      </div>
    </Col>
  );
};


export default ExportarDados;
