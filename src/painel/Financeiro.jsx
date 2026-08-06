import { useState } from "react";
import { X } from "lucide-react";

import { api } from "../lib/api.js";
import { dataCurta, emReais, emReaisCurto, hojeISO, paraNumero } from "../lib/formato.js";
import { useRecurso } from "../lib/useRecurso.js";
import { B, N } from "../ui/tokens.js";
import { Aviso, Badge, Btn, Card, Carregando, ChartLine, Col, Field, ImgBox, PH, Row, Stat, Table, Vazio } from "../ui/base.jsx";

// ── Financeiro ────────────────────────────────────────────────────────────────
export const Financeiro = () => {
  const visitas = useRecurso(() => api.visitas.listar(30));
  const resumo = useRecurso(() => api.visitas.resumo());

  const despesas = useRecurso(() => api.despesas.listar());

  const [descricao, setDescricao] = useState("");
  const [valorGasto, setValorGasto] = useState("");
  const [dataGasto, setDataGasto] = useState(() => hojeISO());
  const [statusGasto, setStatusGasto] = useState("Pago");
  const [mostrarAdd, setMostrarAdd] = useState(false);
  const [erroAcao, setErroAcao] = useState("");
  const [salvando, setSalvando] = useState(false);

  const pagamentos = visitas.dados || [];
  const receita = resumo.dados?.receitaMes ?? 0;
  const comissoes = resumo.dados?.comissoesMes ?? 0;
  const meses = resumo.dados?.meses || [];

  // Gasto do mês é o que tem data neste mês. Comparar o prefixo YYYY-MM basta,
  // porque a data vem do banco como texto local, não como timestamp UTC.
  const mesAtual = hojeISO().slice(0, 7);
  const listaDespesas = despesas.dados || [];
  const despesasDoMes = listaDespesas.filter(d => (d.data || "").startsWith(mesAtual));
  const totalDespesas = despesasDoMes.reduce((s, d) => s + (Number(d.valor) || 0), 0);
  const resultado = receita - totalDespesas - comissoes;

  const acao = async (fn) => {
    setErroAcao("");
    setSalvando(true);
    try { await fn(); despesas.recarregar(); }
    catch (e) { setErroAcao(e.message); }
    finally { setSalvando(false); }
  };

  const addGasto = () => acao(async () => {
    await api.despesas.criar({
      descricao: descricao.trim(),
      valor: paraNumero(valorGasto),
      data: dataGasto,
      status: statusGasto,
    });
    setDescricao(""); setValorGasto(""); setMostrarAdd(false);
  });

  const rotuloMes = (ym) => {
    const [ano, mes] = ym.split("-").map(Number);
    return new Date(ano, mes - 1, 1).toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
  };

  return (
    <Col gap={14}>
      <PH
        title="Financeiro"
        sub="Receita real vinda dos atendimentos registrados"
        action={mostrarAdd ? "Fechar" : "+ Novo Gasto"}
        onAction={() => setMostrarAdd(v => !v)}
      />

      <Aviso texto={visitas.erro || resumo.erro || despesas.erro || erroAcao} onFechar={() => setErroAcao("")} />

      <Row gap={10}>
        <Stat label="Faturamento do mês" value={emReais(receita)} sub={`${resumo.dados?.atendimentosMes ?? 0} atendimentos`} color={N.secondary} />
        <Stat label="Comissões do mês" value={emReais(comissoes)} sub="a pagar à equipe" color={B.teal} />
        <Stat label="Gastos do mês" value={emReais(totalDespesas)} sub={`${despesasDoMes.length} lançamentos`} color={B.red} />
        <Stat label="Resultado do mês" value={emReais(resultado)} sub="receita − comissões − gastos" color={resultado >= 0 ? N.color : B.amber} />
      </Row>

      {mostrarAdd && (
        <Card title="Adicionar Despesa">
          <Row gap={10}>
            <Field label="DESCRIÇÃO DO GASTO" placeholder="Ex: Conta de Luz" value={descricao} onChange={setDescricao} />
            <Field label="VALOR" placeholder="0,00" value={valorGasto} onChange={setValorGasto} />
            <Field label="DATA" type="date" value={dataGasto} onChange={setDataGasto} />
            <Field label="STATUS" type="select" value={statusGasto} onChange={setStatusGasto} options={["Pago", "Pendente"]} />
          </Row>
          <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <Btn onClick={() => setMostrarAdd(false)}>Cancelar</Btn>
            <Btn color={N.color} onClick={addGasto} disabled={salvando}>{salvando ? "Salvando..." : "Adicionar"}</Btn>
          </div>
        </Card>
      )}

      <Row gap={10} style={{ alignItems: "flex-start" }}>
        <Card title="Faturamento — últimos 6 meses" style={{ flex: 2 }}>
          {resumo.carregando && !resumo.dados ? <Carregando /> : (
            <>
              <ChartLine h={130} color={N.color} valores={meses.map(m => m.total)} />
              <Row gap={4} style={{ marginTop: 8, flexWrap: "wrap" }}>
                {meses.map((m, i) => (
                  <Badge key={m.mes} text={`${rotuloMes(m.mes)} ${emReaisCurto(m.total)}`} color={i === meses.length - 1 ? N.secondary : B.muted} />
                ))}
              </Row>
            </>
          )}
        </Card>
        <Card title="Por serviço (mês)" style={{ flex: 1 }}>
          {(resumo.dados?.porServico || []).length === 0 ? <ImgBox h={130} label="[ sem dados no mês ]" /> : (
            <Col gap={7}>
              {resumo.dados.porServico.map((s, i) => {
                const pct = receita ? Math.round((s.total / receita) * 100) : 0;
                return (
                  <Col key={s.servico_nome} gap={4}>
                    <Row style={{ justifyContent: "space-between" }}>
                      <Row gap={6}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: [N.color, N.secondary, B.amber, B.teal, B.muted][i % 5] }} />
                        <span style={{ fontSize: 11, color: B.muted }}>{s.servico_nome} · {s.qtd}×</span>
                      </Row>
                      <span style={{ fontSize: 11, color: B.text, fontWeight: 600 }}>{pct}%</span>
                    </Row>
                    <div style={{ height: 4, background: B.border2, borderRadius: 2 }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: [N.color, N.secondary, B.amber, B.teal, B.muted][i % 5], borderRadius: 2 }} />
                    </div>
                  </Col>
                );
              })}
            </Col>
          )}
        </Card>
      </Row>

      <Row gap={10} style={{ alignItems: "flex-start" }}>
        <Card title="Atendimentos recentes" style={{ flex: 2 }}>
          {visitas.carregando && !visitas.dados && <Carregando />}
          {visitas.dados && pagamentos.length === 0 && <Vazio texto="Nenhum atendimento registrado. Dê baixa em um agendamento ou atenda alguém na fila." />}
          {pagamentos.length > 0 && (
            <Table
              cols={["DATA", "CLIENTE", "SERVIÇO", "BARBEIRO", "ORIGEM", "VALOR", "COMISSÃO"]}
              rows={pagamentos.map(p => [
                dataCurta(p.data), p.cliente_nome, p.servico_nome, p.equipe_nome || "Sem barbeiro",
                <Badge text={p.origem} color={p.origem === "agenda" ? B.teal : p.origem === "fila" ? B.amber : B.muted} />,
                emReais(p.valor),
                emReais(p.comissao_valor),
              ])}
            />
          )}
        </Card>
        <Card title="Gastos lançados" style={{ flex: 1 }}>
          {despesas.carregando && !despesas.dados && <Carregando />}
          {despesas.dados && listaDespesas.length === 0 && <Vazio texto="Nenhum gasto lançado." />}
          {listaDespesas.map(e => (
            <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `0.5px solid ${B.border}`, padding: "8px 0", fontSize: 11 }}>
              <Col gap={2}>
                <span style={{ color: B.text }}>{e.descricao}</span>
                <span style={{ color: B.dim, fontSize: 10 }}>{dataCurta(e.data)}</span>
              </Col>
              <Row gap={8}>
                <span style={{ color: B.text, fontWeight: 600 }}>{emReais(e.valor)}</span>
                {/* Clicar no status alterna Pago/Pendente — é o gesto mais frequente aqui. */}
                <span onClick={() => acao(() => api.despesas.atualizar(e.id, { status: e.status === "Pago" ? "Pendente" : "Pago" }))}
                  style={{ cursor: "pointer" }} title="Alternar status">
                  <Badge text={e.status} color={e.status === "Pendente" ? B.amber : B.teal} />
                </span>
                <span onClick={() => acao(() => api.despesas.remover(e.id))} style={{ cursor: "pointer", color: B.red, fontWeight: 700, userSelect: "none" }}><X size={14} strokeWidth={2.2} /></span>
              </Row>
            </div>
          ))}
        </Card>
      </Row>
    </Col>
  );
};


export default Financeiro;
