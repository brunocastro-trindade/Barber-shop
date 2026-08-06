import { useState } from "react";
import { X } from "lucide-react";

import { api } from "../lib/api.js";
import { emReais, paraNumero } from "../lib/formato.js";
import { somente } from "../lib/dominio.js";
import { useRecurso } from "../lib/useRecurso.js";
import { B, N } from "../ui/tokens.js";
import { Aviso, Badge, Btn, Card, Carregando, Col, Field, PH, Row, Stat, Table, Vazio } from "../ui/base.jsx";

// ── Serviços ──────────────────────────────────────────────────────────────────
// O catálogo é a fonte de preço, duração e comissão de todo atendimento. Mudar
// um valor aqui vale do próximo agendamento em diante: o que já aconteceu ficou
// congelado na visita e não se mexe mais.
export const Servicos = () => {
  const servicos = useRecurso(() => api.servicos.listar());
  const [nome, setNome] = useState("");
  const [duracao, setDuracao] = useState("30");
  const [preco, setPreco] = useState("");
  const [comissao, setComissao] = useState("40");
  const [erroAcao, setErroAcao] = useState("");
  const [salvando, setSalvando] = useState(false);

  const lista = servicos.dados || [];
  const ativos = somente(lista);

  const acao = async (fn) => {
    setErroAcao("");
    setSalvando(true);
    try { await fn(); servicos.recarregar(); }
    catch (e) { setErroAcao(e.message); }
    finally { setSalvando(false); }
  };

  const salvar = () => acao(async () => {
    await api.servicos.criar({
      nome: nome.trim(),
      duracao_min: Math.round(paraNumero(duracao)),
      preco: paraNumero(preco),
      comissao_pct: paraNumero(comissao),
      ativo: true,
    });
    setNome(""); setDuracao("30"); setPreco(""); setComissao("40");
  });

  const maisCaro = ativos.reduce((a, s) => (!a || s.preco > a.preco ? s : a), null);

  return (
    <Col gap={14}>
      <PH title="Serviços" sub="Catálogo de cortes, barba e tratamentos" />

      <Aviso texto={servicos.erro || erroAcao} onFechar={() => setErroAcao("")} />

      <Row gap={10}>
        <Stat label="Serviços ativos" value={ativos.length + ""} sub={lista.length - ativos.length ? `${lista.length - ativos.length} inativos` : undefined} />
        <Stat label="Mais caro" value={maisCaro?.nome || "Nenhum"} sub={maisCaro ? emReais(maisCaro.preco) : undefined} color={N.color} />
        <Stat label="Preço médio" value={emReais(ativos.reduce((s, x) => s + x.preco, 0) / (ativos.length || 1))} color={N.secondary} />
      </Row>

      <Card title="Serviços Cadastrados">
        {servicos.carregando && !servicos.dados && <Carregando />}
        {servicos.dados && lista.length === 0 && <Vazio texto="Nenhum serviço cadastrado. A conta começa vazia — cadastre os seus abaixo." />}
        {lista.length > 0 && (
          <Table
            cols={["NOME", "DURAÇÃO", "PREÇO", "COMISSÃO", "SITUAÇÃO", "REMOVER"]}
            rows={lista.map(s => [
              s.nome, `${s.duracao_min} min`, emReais(s.preco), `${s.comissao_pct}%`,
              // Desativar preserva o histórico; remover é para engano de cadastro.
              <span onClick={() => acao(() => api.servicos.atualizar(s.id, { ativo: !s.ativo }))} style={{ cursor: "pointer" }} title="Ativar / desativar">
                <Badge text={s.ativo ? "Ativo" : "Inativo"} color={s.ativo ? B.teal : B.muted} />
              </span>,
              <span onClick={() => acao(() => api.servicos.remover(s.id))} style={{ cursor: "pointer", color: B.red, fontWeight: 700, userSelect: "none" }} title="Remover"><X size={14} strokeWidth={2.2} /></span>
            ])}
          />
        )}
      </Card>

      <Card title="Cadastrar Serviço">
        <Row gap={10}>
          <Field label="NOME" placeholder="Ex: Corte navalhado" value={nome} onChange={setNome} />
          <Field label="DURAÇÃO (MIN)" placeholder="30" value={duracao} onChange={setDuracao} />
          <Field label="PREÇO" placeholder="0,00" value={preco} onChange={setPreco} />
          <Field label="COMISSÃO DO BARBEIRO (%)" placeholder="40" value={comissao} onChange={setComissao} />
        </Row>
        <Row gap={8} style={{ marginTop: 14, justifyContent: "flex-end" }}>
          <Btn onClick={() => { setNome(""); setDuracao("30"); setPreco(""); setComissao("40"); }}>Limpar</Btn>
          <Btn color={N.color} onClick={salvar} disabled={salvando}>{salvando ? "Salvando..." : "Salvar Serviço"}</Btn>
        </Row>
      </Card>

      <span style={{ fontSize: 10, color: B.dim, lineHeight: 1.6 }}>
        Reajustar um preço aqui não altera atendimentos já registrados: valor, comissão e duração ficam
        congelados na visita no momento em que ela acontece.
      </span>
    </Col>
  );
};


export default Servicos;
