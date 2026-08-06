import { useState } from "react";
import { Check, X } from "lucide-react";

import { api } from "../lib/api.js";
import { dataCurta, emReais, paraNumero } from "../lib/formato.js";
import { opcoes, somente } from "../lib/dominio.js";
import { useRecurso } from "../lib/useRecurso.js";
import { B, N } from "../ui/tokens.js";
import { Avatar, Aviso, Badge, Btn, Card, Carregando, Col, Field, PH, Row, Stat, Vazio } from "../ui/base.jsx";

// ── Assinaturas ───────────────────────────────────────────────────────────────
// O sistema registra quem vence quando; a cobrança acontece fora dele. "Vencida"
// não é status gravado: é vencimento < hoje, calculado pelo servidor a cada
// consulta — por isso o número está certo sem depender de rotina diária.
export const Assinaturas = () => {
  const assinaturas = useRecurso(() => api.assinaturas.listar());
  const planos = useRecurso(() => api.planos.listar());
  const clientes = useRecurso(() => api.clientes.listar());
  const PLAN_COLORS = [B.teal, N.color, B.amber];

  const [mostrarNovo, setMostrarNovo] = useState(false);
  const [nNome, setNNome] = useState("");
  const [nPreco, setNPreco] = useState("");
  const [nSvcs, setNSvcs] = useState("");
  const [aCliente, setACliente] = useState("");
  const [aPlano, setAPlano] = useState("");
  const [erroAcao, setErroAcao] = useState("");
  const [salvando, setSalvando] = useState(false);

  const listaAssinaturas = assinaturas.dados || [];
  const listaPlanos = planos.dados || [];
  const planosAtivos = somente(listaPlanos);
  const ativas = listaAssinaturas.filter(a => a.status === "ativa");
  const vencidas = ativas.filter(a => a.vencida);
  const mrr = ativas.reduce((s, a) => s + a.preco, 0);
  // Um cliente não pode ter duas assinaturas ativas — o banco recusa, e a tela
  // nem oferece.
  const semAssinatura = (clientes.dados || []).filter(c => !ativas.some(a => a.cliente_id === c.id));

  const acao = async (fn) => {
    setErroAcao("");
    setSalvando(true);
    try {
      await fn();
      assinaturas.recarregar();
      planos.recarregar();
      clientes.recarregar();
    } catch (e) {
      setErroAcao(e.message);
    } finally {
      setSalvando(false);
    }
  };

  const criarPlano = () => acao(async () => {
    await api.planos.criar({
      nome: nNome.trim(),
      preco: paraNumero(nPreco),
      incluidos: nSvcs.split("\n").map(s => s.trim()).filter(Boolean),
      ativo: true,
    });
    setNNome(""); setNPreco(""); setNSvcs(""); setMostrarNovo(false);
  });

  const assinar = () => acao(async () => {
    await api.assinaturas.criar({ cliente_id: aCliente, plano_id: aPlano });
    setACliente(""); setAPlano("");
  });

  return (
    <Col gap={14}>
      <PH title="Assinaturas Mensais" sub="Clube do cliente — planos e receita recorrente"
        action={mostrarNovo ? "Fechar" : "+ Novo Plano"} onAction={() => setMostrarNovo(v => !v)} />

      <Aviso texto={assinaturas.erro || planos.erro || clientes.erro || erroAcao} onFechar={() => setErroAcao("")} />

      <Row gap={10}>
        <Stat label="Assinaturas ativas" value={ativas.length + ""} color={B.teal} />
        <Stat label="Vencidas" value={vencidas.length + ""} sub="cobrança em atraso" color={vencidas.length ? B.red : B.muted} />
        <Stat label="Receita recorrente" value={`${emReais(mrr)}/mês`} sub="MRR" color={N.secondary} />
        <Stat label="Planos ativos" value={planosAtivos.length + ""} color={N.color} />
      </Row>

      {mostrarNovo && (
        <Card title="Criar Novo Plano">
          <Row gap={10}>
            <Field label="NOME DO PLANO" placeholder="Ex: Plano Plus" value={nNome} onChange={setNNome} />
            <Field label="PREÇO MENSAL" placeholder="0,00" value={nPreco} onChange={setNPreco} />
          </Row>
          <Field label="SERVIÇOS INCLUÍDOS (um por linha)" type="textarea" placeholder={"Corte ilimitado\nBarba 2× por mês"} value={nSvcs} onChange={setNSvcs} />
          <Row gap={8} style={{ marginTop: 12, justifyContent: "flex-end" }}>
            <Btn onClick={() => setMostrarNovo(false)}>Cancelar</Btn>
            <Btn color={N.color} onClick={criarPlano} disabled={salvando}>{salvando ? "Salvando..." : "Criar Plano"}</Btn>
          </Row>
        </Card>
      )}

      <Row gap={10} style={{ alignItems: "flex-start" }}>
        <Card title="Assinaturas" style={{ flex: 2 }}>
          {assinaturas.carregando && !assinaturas.dados && <Carregando />}
          {assinaturas.dados && listaAssinaturas.length === 0 && (
            <Vazio texto="Nenhuma assinatura registrada. Crie um plano e assine um cliente ao lado." />
          )}
          {listaAssinaturas.map(a => (
            <div key={a.id} style={{ borderBottom: `0.5px solid ${B.border}`, padding: "12px 0", display: "flex", alignItems: "center", gap: 12 }}>
              <Avatar name={a.cliente_nome} color={a.vencida ? B.red : B.teal} size={34} />
              <Col gap={3} style={{ flex: 1 }}>
                <Row gap={8}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: B.text }}>{a.cliente_nome}</span>
                  <Badge text={a.plano_nome} color={N.color} />
                  {a.status !== "ativa" && <Badge text="Cancelada" color={B.muted} />}
                  {a.vencida && <Badge text="Vencida" color={B.red} />}
                </Row>
                <span style={{ fontSize: 11, color: B.muted }}>
                  {emReais(a.preco)}/mês · desde {dataCurta(a.inicio)} · vence em {dataCurta(a.vencimento)}
                </span>
              </Col>
              {a.status === "ativa" && (
                <Row gap={6}>
                  <Btn sm color={N.secondary} disabled={salvando} onClick={() => acao(() => api.assinaturas.pagar(a.id))}>
                    <Check size={12} strokeWidth={2} /> Registrar pagamento
                  </Btn>
                  <Btn sm danger disabled={salvando} onClick={() => acao(() => api.assinaturas.cancelar(a.id))}>Cancelar</Btn>
                </Row>
              )}
            </div>
          ))}
          <div style={{ fontSize: 10, color: B.dim, marginTop: 12, lineHeight: 1.6 }}>
            Registrar pagamento empurra o vencimento um mês a partir do vencimento anterior — quem paga
            atrasado não ganha dias. A cobrança em si acontece fora do sistema.
          </div>
        </Card>

        <Col gap={10} style={{ flex: 1 }}>
          <Card title="Assinar um cliente">
            {planosAtivos.length === 0 ? (
              <Vazio texto="Crie um plano antes de assinar alguém." />
            ) : (
              <>
                <Field label="CLIENTE" type="select" value={aCliente} onChange={setACliente}
                  placeholder="Selecione..." options={opcoes(semAssinatura)} />
                <Field label="PLANO" type="select" value={aPlano} onChange={setAPlano}
                  placeholder="Selecione..." options={opcoes(planosAtivos, p => `${p.nome} · ${emReais(p.preco)}`)} />
                <div style={{ marginTop: 12 }}>
                  <Btn color={N.color} onClick={assinar} disabled={salvando}>+ Criar assinatura</Btn>
                </div>
                <div style={{ fontSize: 10, color: B.dim, marginTop: 10, lineHeight: 1.6 }}>
                  Assinar marca o cliente como <strong>Assinante</strong> na ficha; cancelar o devolve para Avulso.
                </div>
              </>
            )}
          </Card>

          <Card title="Planos">
            {planos.carregando && !planos.dados && <Carregando />}
            {planos.dados && listaPlanos.length === 0 && <Vazio texto="Nenhum plano cadastrado." />}
            {listaPlanos.map((p, i) => {
              const cor = PLAN_COLORS[i % PLAN_COLORS.length];
              return (
                <div key={p.id} style={{ borderBottom: `0.5px solid ${B.border}`, padding: "12px 0" }}>
                  <Row style={{ justifyContent: "space-between", marginBottom: 6 }}>
                    <Row gap={8}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.ativo ? cor : B.dim }} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: B.text }}>{p.nome}</span>
                    </Row>
                    <Row gap={8}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: cor }}>{emReais(p.preco)}</span>
                      <span onClick={() => acao(() => api.planos.remover(p.id))} style={{ cursor: "pointer", color: B.red, fontWeight: 700 }} title="Remover plano"><X size={14} strokeWidth={2.2} /></span>
                    </Row>
                  </Row>
                  {(p.incluidos || []).map((s, j) => (
                    <div key={j} style={{ fontSize: 11, color: B.muted, marginBottom: 3 }}><Check size={11} strokeWidth={2} /> {s}</div>
                  ))}
                  <Row style={{ justifyContent: "space-between", marginTop: 8 }}>
                    <span style={{ fontSize: 11, color: B.muted }}>{p.assinantes ?? 0} assinante(s)</span>
                    <span onClick={() => acao(() => api.planos.atualizar(p.id, { ativo: !p.ativo }))} style={{ cursor: "pointer" }} title="Ativar / desativar">
                      <Badge text={p.ativo ? "Ativo" : "Inativo"} color={p.ativo ? B.teal : B.muted} />
                    </span>
                  </Row>
                </div>
              );
            })}
            <div style={{ fontSize: 10, color: B.dim, marginTop: 10, lineHeight: 1.6 }}>
              Remover um plano apaga junto as assinaturas ligadas a ele. Para parar de vender sem perder
              o histórico, desative.
            </div>
          </Card>
        </Col>
      </Row>
    </Col>
  );
};


export default Assinaturas;
