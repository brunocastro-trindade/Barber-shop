import { useState } from "react";
import { Building2, Plus, X } from "lucide-react";

import { api } from "../lib/api.js";
import { emReais } from "../lib/formato.js";
import { somente } from "../lib/dominio.js";
import { useRecurso } from "../lib/useRecurso.js";
import { B, N } from "../ui/tokens.js";
import { Avatar, Aviso, Badge, Btn, Card, Carregando, Col, Divider, Field, PH, Row, Stat, Vazio } from "../ui/base.jsx";

// ── Equipe ────────────────────────────────────────────────────────────────────
// Barbeiros não têm login: quem acessa o sistema é o dono. Aqui é o cadastro de
// quem atende — e o espelho da comissão que cada um gerou no mês.
//
// A equipe é organizada por UNIDADE (filial), e cada unidade tem teto de
// funcionários ativos. O teto vem do servidor (`limitePorUnidade`), nunca de um
// número escrito aqui: repetir o limite no front garantiria que um dia a tela
// prometesse uma vaga que o banco recusa.
export const Equipe = () => {
  const equipe = useRecurso(() => api.equipe.listar());
  const unidades = useRecurso(() => api.unidades.listar());
  const resumo = useRecurso(() => api.visitas.resumo());

  const [nomePro, setNomePro] = useState("");
  const [unidadeAlvo, setUnidadeAlvo] = useState("");
  const [nomeUnidade, setNomeUnidade] = useState("");
  const [mostrarAddUnidade, setMostrarAddUnidade] = useState(false);
  const [erroAcao, setErroAcao] = useState("");
  const [salvando, setSalvando] = useState(false);

  const lista = equipe.dados || [];
  const ativos = somente(lista);
  const limite = unidades.dados?.limitePorUnidade ?? null;
  const listaUnidades = unidades.dados?.unidades || [];

  const porBarbeiro = resumo.dados?.porBarbeiro || [];
  const desempenhoDe = (id) => porBarbeiro.find(d => d.equipe_id === id)
    || { atendimentos: 0, faturado: 0, comissao: 0 };
  const semBarbeiro = porBarbeiro.find(d => !d.equipe_id);

  const acao = async (fn) => {
    setErroAcao("");
    setSalvando(true);
    try { await fn(); equipe.recarregar(); unidades.recarregar(); resumo.recarregar(); }
    catch (e) { setErroAcao(e.message); }
    finally { setSalvando(false); }
  };

  const salvarFuncionario = (unidadeId) => acao(async () => {
    await api.equipe.criar({ nome: nomePro.trim(), ativo: true, unidade_id: unidadeId });
    setNomePro(""); setUnidadeAlvo("");
  });

  const salvarUnidade = () => acao(async () => {
    await api.unidades.criar({ nome: nomeUnidade.trim() });
    setNomeUnidade(""); setMostrarAddUnidade(false);
  });

  return (
    <Col gap={14}>
      <PH title="Equipe por Unidade"
        sub={limite ? `Até ${limite} funcionários ativos por unidade nesta fase de validação` : "Comissão do mês, com o percentual congelado em cada atendimento"}
        action={mostrarAddUnidade ? "Fechar" : "+ Nova Unidade"} onAction={() => setMostrarAddUnidade(v => !v)} />

      <Aviso texto={equipe.erro || unidades.erro || resumo.erro || erroAcao} onFechar={() => setErroAcao("")} />

      <Row gap={10}>
        <Stat label="Unidades" value={listaUnidades.length + ""} color={N.secondary} />
        <Stat label="Funcionários ativos" value={ativos.length + ""} sub={lista.length - ativos.length ? `${lista.length - ativos.length} inativos` : undefined} />
        <Stat label="Atendimentos no mês" value={(resumo.dados?.atendimentosMes ?? 0) + ""} color={N.secondary} />
        <Stat label="Comissões a pagar" value={emReais(resumo.dados?.comissoesMes ?? 0)} sub="mês corrente" color={N.color} />
      </Row>

      {mostrarAddUnidade && (
        <Card title="Nova Unidade">
          <Row gap={10}><Field label="NOME DA UNIDADE" placeholder="Ex: Unidade Centro" value={nomeUnidade} onChange={setNomeUnidade} /></Row>
          <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <Btn onClick={() => setMostrarAddUnidade(false)}>Cancelar</Btn>
            <Btn color={N.color} onClick={salvarUnidade} disabled={salvando || !nomeUnidade.trim()}>
              {salvando ? "Salvando..." : "Criar unidade"}
            </Btn>
          </div>
        </Card>
      )}

      {(equipe.carregando || unidades.carregando) && !unidades.dados && <Carregando />}

      {listaUnidades.map(u => {
        const daUnidade = lista.filter(p => p.unidade_id === u.id);
        const lotada = limite !== null && u.funcionarios >= limite;
        const abrindo = unidadeAlvo === u.id;

        return (
          <Card key={u.id}>
            <Row style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <Row gap={10}>
                <Building2 size={16} strokeWidth={1.9} color={N.color} />
                <Col gap={2}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: B.text }}>{u.nome}</span>
                  <span style={{ fontSize: 11, color: lotada ? B.amber : B.muted }}>
                    {u.funcionarios} de {limite ?? "?"} funcionários ativos
                    {lotada ? " · unidade lotada" : ` · ${u.vagas} ${u.vagas === 1 ? "vaga" : "vagas"}`}
                  </span>
                </Col>
              </Row>
              <Row gap={8}>
                <Btn sm color={N.color} disabled={lotada || salvando}
                  onClick={() => setUnidadeAlvo(abrindo ? "" : u.id)}>
                  <Plus size={12} strokeWidth={2} /> {lotada ? "Sem vagas" : "Funcionário"}
                </Btn>
                {daUnidade.length === 0 && listaUnidades.length > 1 && (
                  <span onClick={() => acao(() => api.unidades.remover(u.id))}
                    style={{ cursor: "pointer", color: B.red, fontWeight: 700, padding: "0 4px" }} title="Apagar unidade vazia">
                    <X size={14} strokeWidth={2.2} />
                  </span>
                )}
              </Row>
            </Row>

            {abrindo && !lotada && (
              <div style={{ marginBottom: 12 }}>
                <Row gap={10}><Field label="NOME DO FUNCIONÁRIO" placeholder="Ex: Lucas Silva" value={nomePro} onChange={setNomePro} /></Row>
                <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end", gap: 10 }}>
                  <Btn onClick={() => { setUnidadeAlvo(""); setNomePro(""); }}>Cancelar</Btn>
                  <Btn color={N.color} onClick={() => salvarFuncionario(u.id)} disabled={salvando || !nomePro.trim()}>
                    {salvando ? "Salvando..." : "Salvar"}
                  </Btn>
                </div>
              </div>
            )}

            {daUnidade.length === 0 && <Vazio texto="Nenhum funcionário nesta unidade ainda." />}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
              {daUnidade.map(p => {
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
          </Card>
        );
      })}

      {semBarbeiro && semBarbeiro.atendimentos > 0 && (
        <span style={{ fontSize: 10, color: B.dim, lineHeight: 1.6 }}>
          {semBarbeiro.atendimentos} atendimento(s) do mês ({emReais(semBarbeiro.faturado)}) não têm barbeiro
          vinculado — foram lançados sem escolher quem atendeu, ou o barbeiro foi removido depois.
        </span>
      )}

      <span style={{ fontSize: 10, color: B.dim, lineHeight: 1.6 }}>
        O limite de {limite ?? "?"} é por unidade, e conta só quem está <strong>ativo</strong>: desativar quem
        saiu libera a vaga na hora. Precisando de mais gente, crie outra unidade. Desativar tira o barbeiro
        das listas de agenda e fila sem apagar nada; remover apaga o cadastro, mas as visitas antigas
        continuam de pé com o nome de quem atendeu.
      </span>
    </Col>
  );
};

export default Equipe;
