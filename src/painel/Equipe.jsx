import { useState } from "react";
import { X } from "lucide-react";

import { api } from "../lib/api.js";
import { emReais } from "../lib/formato.js";
import { somente } from "../lib/dominio.js";
import { useRecurso } from "../lib/useRecurso.js";
import { makePDF } from "../lib/pdf.js";
import { B, N } from "../ui/tokens.js";
import { Avatar, Aviso, Badge, Btn, Card, Carregando, Col, Divider, Field, PH, Row, Stat, Vazio } from "../ui/base.jsx";

// ── Equipe ────────────────────────────────────────────────────────────────────
// Barbeiros não têm login: quem acessa o sistema é o dono. Aqui é o cadastro de
// quem atende — e o espelho da comissão que cada um gerou no mês.
export const Equipe = () => {
  const equipe = useRecurso(() => api.equipe.listar());
  const resumo = useRecurso(() => api.visitas.resumo());
  const [nomePro, setNomePro] = useState("");
  const [mostrarAdd, setMostrarAdd] = useState(false);
  const [erroAcao, setErroAcao] = useState("");
  const [salvando, setSalvando] = useState(false);

  const lista = equipe.dados || [];
  const ativos = somente(lista);
  // O servidor já agrupa por equipe_id usando o percentual congelado de cada
  // atendimento — refazer essa conta aqui seria reescrever o passado.
  const porBarbeiro = resumo.dados?.porBarbeiro || [];
  const desempenhoDe = (id) => porBarbeiro.find(d => d.equipe_id === id)
    || { atendimentos: 0, faturado: 0, comissao: 0 };
  const semBarbeiro = porBarbeiro.find(d => !d.equipe_id);

  const acao = async (fn) => {
    setErroAcao("");
    setSalvando(true);
    try { await fn(); equipe.recarregar(); resumo.recarregar(); }
    catch (e) { setErroAcao(e.message); }
    finally { setSalvando(false); }
  };

  const salvar = () => acao(async () => {
    await api.equipe.criar({ nome: nomePro.trim(), ativo: true });
    setNomePro(""); setMostrarAdd(false);
  });

  return (
    <Col gap={14}>
      <PH title="Equipe de Barbeiros" sub="Comissão do mês, com o percentual congelado em cada atendimento"
        action={mostrarAdd ? "Fechar" : "+ Adicionar Barbeiro"} onAction={() => setMostrarAdd(v => !v)}
        onExport={() => makePDF(N.name, [{ title: "Equipe de Barbeiros — mês corrente", columns: ["Barbeiro", "Situação", "Atendimentos", "Faturado", "Comissão"], rows: lista.map(p => { const d = desempenhoDe(p.id); return [p.nome, p.ativo ? "Ativo" : "Inativo", d.atendimentos + "", emReais(d.faturado), emReais(d.comissao)]; }) }])} />

      <Aviso texto={equipe.erro || resumo.erro || erroAcao} onFechar={() => setErroAcao("")} />

      <Row gap={10}>
        <Stat label="Barbeiros ativos" value={ativos.length + ""} sub={lista.length - ativos.length ? `${lista.length - ativos.length} inativos` : undefined} />
        <Stat label="Atendimentos no mês" value={(resumo.dados?.atendimentosMes ?? 0) + ""} color={N.secondary} />
        <Stat label="Comissões a pagar" value={emReais(resumo.dados?.comissoesMes ?? 0)} sub="mês corrente" color={N.color} />
      </Row>

      {mostrarAdd && (
        <Card title="Cadastrar Barbeiro">
          <Row gap={10}><Field label="NOME DO BARBEIRO" placeholder="Ex: Lucas Silva" value={nomePro} onChange={setNomePro} /></Row>
          <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <Btn onClick={() => setMostrarAdd(false)}>Cancelar</Btn>
            <Btn color={N.color} onClick={salvar} disabled={salvando}>{salvando ? "Salvando..." : "Salvar"}</Btn>
          </div>
        </Card>
      )}

      {equipe.carregando && !equipe.dados && <Carregando />}
      {equipe.dados && lista.length === 0 && (
        <Card><Vazio texto="Nenhum barbeiro cadastrado. Sem equipe não há agenda: é o barbeiro que ocupa o horário." /></Card>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
        {lista.map(p => {
          const d = desempenhoDe(p.id);
          return (
            <Card key={p.id}>
              <Row style={{ justifyContent: "space-between", marginBottom: 10 }}>
                <Row gap={10}>
                  <Avatar name={p.nome} color={p.ativo ? N.color : B.muted} size={36} />
                  <Col gap={2}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: B.text }}>{p.nome}</span>
                    <span style={{ fontSize: 11, color: B.muted }}>Barbeiro</span>
                  </Col>
                </Row>
                <Row gap={6}>
                  <span onClick={() => acao(() => api.equipe.atualizar(p.id, { ativo: !p.ativo }))} style={{ cursor: "pointer" }} title="Ativar / desativar">
                    <Badge text={p.ativo ? "Ativo" : "Inativo"} color={p.ativo ? B.teal : B.muted} />
                  </span>
                  <span onClick={() => acao(() => api.equipe.remover(p.id))} style={{ cursor: "pointer", color: B.red, fontWeight: 700, padding: "0 4px" }} title="Remover"><X size={14} strokeWidth={2.2} /></span>
                </Row>
              </Row>
              <Divider />
              <Row style={{ justifyContent: "space-between", marginBottom: 6 }}><span style={{ fontSize: 11, color: B.muted }}>Atendimentos</span><span style={{ fontSize: 11, color: B.text, fontWeight: 600 }}>{d.atendimentos}</span></Row>
              <Row style={{ justifyContent: "space-between", marginBottom: 6 }}><span style={{ fontSize: 11, color: B.muted }}>Faturado</span><span style={{ fontSize: 11, color: B.text, fontWeight: 600 }}>{emReais(d.faturado)}</span></Row>
              <Row style={{ justifyContent: "space-between" }}><span style={{ fontSize: 11, color: B.muted }}>Comissão</span><span style={{ fontSize: 12, color: N.color, fontWeight: 700 }}>{emReais(d.comissao)}</span></Row>
            </Card>
          );
        })}
      </div>

      {semBarbeiro && semBarbeiro.atendimentos > 0 && (
        <span style={{ fontSize: 10, color: B.dim, lineHeight: 1.6 }}>
          {semBarbeiro.atendimentos} atendimento(s) do mês ({emReais(semBarbeiro.faturado)}) não têm barbeiro
          vinculado — foram lançados sem escolher quem atendeu, ou o barbeiro foi removido depois.
        </span>
      )}

      <span style={{ fontSize: 10, color: B.dim, lineHeight: 1.6 }}>
        Desativar tira o barbeiro das listas de agenda e fila sem apagar nada. Remover apaga o cadastro,
        mas as visitas antigas continuam de pé com o nome de quem atendeu.
      </span>
    </Col>
  );
};

export default Equipe;
