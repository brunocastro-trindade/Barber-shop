import { useState, useEffect } from "react";

// Carrega um recurso da API e expõe {dados, erro, carregando, recarregar}.
// O setState mora nos callbacks da promise, nunca no corpo do efeito.
export function useRecurso(carregar, deps = []) {
  const [estado, setEstado] = useState({ dados: null, erro: "", carregando: true });
  const [versao, setVersao] = useState(0);

  useEffect(() => {
    let ativo = true;
    carregar()
      .then(d => { if (ativo) setEstado({ dados: d, erro: "", carregando: false }); })
      .catch(e => { if (ativo) setEstado({ dados: null, erro: e.message, carregando: false }); });
    return () => { ativo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [versao, ...deps]);

  const recarregar = () => {
    setEstado(e => ({ ...e, carregando: true }));
    setVersao(v => v + 1);
  };

  return { ...estado, recarregar };
}
