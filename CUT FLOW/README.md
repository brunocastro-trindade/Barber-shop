# CUT FLOW — material de origem da identidade

Esta pasta guarda o **material editável** da marca: o arquivo do Illustrator, o
PDF da identidade visual e os pesos da família Coolvetica que não são usados na
aplicação. Nada aqui é servido ao navegador.

## O que a aplicação usa fica em `public/`

O Vite serve `public/` na raiz do site, então é de lá que os arquivos são
carregados em produção:

| Arquivo servido | Usado em |
| --- | --- |
| `public/logos/logo-roxa.png` | `index.html`, `src/App.jsx`, `src/auth/Telas.jsx`, `src/cliente/AreaCliente.jsx` |
| `public/logos/logo-horizontal-roxo.png` | `src/landing/LandingPage.jsx` |
| `public/logos/logo-branca.png` | variante da marca, ainda sem uso |
| `public/logos/logo-laranja.png` | variante da marca, ainda sem uso |
| `public/logos/logo-horizontal-laranja.png` | variante da marca, ainda sem uso |
| `public/fonts/coolvetica-regular.otf` | `@font-face` em `src/index.css` e preload no `index.html` |

## Por que não há cópias aqui

Os cinco logos e a Coolvetica Regular existiam nesta pasta **e** em `public/`,
byte a byte iguais. Duplicata de binário em Git é permanente: cada nova versão
guarda o arquivo inteiro de novo, nos dois lugares, e o histórico nunca
encolhe. As cópias foram removidas — `public/` é a única fonte do que a
aplicação carrega.

Ao exportar um logo novo do Illustrator, salve **direto em `public/logos/`**.
Não traga a cópia para cá.

## Nomes de arquivo

Os arquivos em `public/` usam minúsculas com hífen (`logo-horizontal-roxo.png`).
Não é preciosismo: o Windows trata `LOGO ROXA.png` e `logo roxa.png` como o
mesmo arquivo, o Linux não — e o servidor de produção é Linux. Nome com espaço
e maiúscula quebra em produção sem quebrar na sua máquina.

## Temporários do Illustrator

Arquivos `~ai-*.tmp` são autosave do Illustrator e estão no `.gitignore`. Um
deles (630 KB) chegou a ser commitado por engano e foi removido.
