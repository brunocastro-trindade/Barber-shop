import { useState } from "react";
import { X } from "lucide-react";

import { api } from "../lib/api.js";
import { emReais, paraNumero } from "../lib/formato.js";
import { useRecurso } from "../lib/useRecurso.js";
import { B, N } from "../ui/tokens.js";
import { Aviso, Badge, Btn, Card, Carregando, Col, Field, PH, Row, Stat, Table, Vazio } from "../ui/base.jsx";

// ── Estoque ───────────────────────────────────────────────────────────────────
export const Estoque = () => {
  const produtos = useRecurso(() => api.produtos.listar());
  const [nome, setNome] = useState("");
  const [preco, setPreco] = useState("");
  const [minimo, setMinimo] = useState("");
  const [inicial, setInicial] = useState("");
  const [filtro, setFiltro] = useState("");
  const [erroAcao, setErroAcao] = useState("");
  const [salvando, setSalvando] = useState(false);

  const lista = produtos.dados || [];

  const acao = async (fn) => {
    setErroAcao("");
    setSalvando(true);
    try { await fn(); produtos.recarregar(); }
    catch (e) { setErroAcao(e.message); }
    finally { setSalvando(false); }
  };

  const salvar = () => acao(async () => {
    await api.produtos.criar({
      nome: nome.trim(),
      preco: paraNumero(preco),
      quantidade: Math.round(paraNumero(inicial)),
      minimo: Math.round(paraNumero(minimo)),
    });
    setNome(""); setPreco(""); setMinimo(""); setInicial("");
  });

  // Baixa e reposição do dia a dia: um clique por unidade, direto na lista.
  const mover = (p, delta) => acao(() =>
    api.produtos.atualizar(p.id, { quantidade: Math.max(0, p.quantidade + delta) }));

  const visiveis = lista.filter(p => p.nome.toLowerCase().includes(filtro.toLowerCase()));
  const valorTotal = lista.reduce((acc, p) => acc + p.preco * p.quantidade, 0);
  const alertas = lista.filter(p => p.quantidade < p.minimo).length;

  const BotaoQtd = ({ children, onClick }) => (
    <span onClick={salvando ? undefined : onClick}
      style={{ cursor: salvando ? "not-allowed" : "pointer", userSelect: "none", width: 20, height: 20, display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 6, border: `1px solid ${B.border2}`, color: B.muted, fontSize: 12, fontWeight: 700 }}>
      {children}
    </span>
  );

  return (
    <Col gap={14}>
      <PH title="Estoque de Produtos" sub="Controle dos produtos usados e revendidos na barbearia" />

      <Aviso texto={produtos.erro || erroAcao} onFechar={() => setErroAcao("")} />

      <Row gap={10}>
        <Stat label="Total de produtos" value={lista.length + " itens"} />
        <Stat label="Valor em estoque" value={emReais(valorTotal)} color={N.secondary} />
        <Stat label="Alertas de reposição" value={alertas + ""} sub="abaixo do mínimo" color={alertas > 0 ? B.amber : B.teal} />
      </Row>

      <Row gap={10} style={{ alignItems: "flex-start" }}>
        <Card title="Lista de Produtos" style={{ flex: 2 }} accentColor={N.color}>
          <Row gap={8} style={{ marginBottom: 12 }}>
            <input placeholder="Buscar produto..." value={filtro} onChange={e => setFiltro(e.target.value)}
              style={{ flex: 1, height: 32, background: B.bg2, border: `0.5px solid ${B.border2}`, borderRadius: 11, padding: "0 12px", fontSize: 11, color: B.text, outline: "none" }} />
          </Row>
          {produtos.carregando && !produtos.dados && <Carregando />}
          {produtos.dados && lista.length === 0 && <Vazio texto="Nenhum produto cadastrado ainda." />}
          {visiveis.length > 0 && (
            <Table
              cols={["PRODUTO", "PREÇO UNIT.", "QTD. ATUAL", "MÍNIMO", "STATUS", "REMOVER"]}
              rows={visiveis.map(p => [
                p.nome, emReais(p.preco),
                <Row gap={6}>
                  <BotaoQtd onClick={() => mover(p, -1)}>−</BotaoQtd>
                  <span style={{ minWidth: 34, textAlign: "center" }}>{p.quantidade} un</span>
                  <BotaoQtd onClick={() => mover(p, +1)}>+</BotaoQtd>
                </Row>,
                p.minimo + " un",
                <Badge text={p.quantidade < p.minimo ? "Baixo" : "OK"} color={p.quantidade < p.minimo ? B.amber : B.teal} />,
                <span onClick={() => acao(() => api.produtos.remover(p.id))} style={{ cursor: "pointer", color: B.red, fontWeight: 700, userSelect: "none" }} title="Remover"><X size={14} strokeWidth={2.2} /></span>
              ])}
            />
          )}
        </Card>

        <Card title="Cadastrar Produto" style={{ flex: 1 }}>
          <Field label="NOME" placeholder="Ex: Pomada modeladora" value={nome} onChange={setNome} />
          <Field label="PREÇO UNITÁRIO" placeholder="0,00" value={preco} onChange={setPreco} />
          <Row gap={8}>
            <Field label="EST. MÍNIMO" placeholder="0" value={minimo} onChange={setMinimo} />
            <Field label="EST. INICIAL" placeholder="0" value={inicial} onChange={setInicial} />
          </Row>
          <div style={{ marginTop: 10 }}>
            <Btn color={N.color} onClick={salvar} disabled={salvando}>{salvando ? "Salvando..." : "Salvar"}</Btn>
          </div>
          <div style={{ fontSize: 10, color: B.dim, marginTop: 12, lineHeight: 1.6 }}>
            Produtos abaixo do mínimo viram alerta na Visão Geral.
          </div>
        </Card>
      </Row>
    </Col>
  );
};


export default Estoque;
