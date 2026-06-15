# ControlCRM

Sistema de CRM multi-nicho para pequenos negócios — Clínica Estética, Barbearia e Mecânica.

## Funcionalidades

- **Multi-nicho**: Clínica Estética, Barbearia e Mecânica em um só sistema
- **Fichas de clientes** com histórico de serviços e preferências
- **Agenda** com calendário semanal e marcação de pagamentos
- **Fila de espera** em tempo real (Barbearia)
- **Ordens de Serviço** completas com peças e mão de obra (Mecânica)
- **Assinaturas mensais** com gestão de planos e assinantes (Barbearia)
- **Financeiro** com receitas, despesas e lucro líquido
- **Exportação PDF** para migração de dados
- **Multiprofissional** com controle de comissões
- **Lembretes & Remarketing** para retenção de clientes
- Troca de nicho sem logout (admin)

## Stack

- Vite + React 19 (JSX, sem TypeScript)
- Lucide React (ícones)
- jsPDF + jspdf-autotable (exportação PDF)
- localStorage (persistência de dados)
- Inline styles (sem CSS framework)

## Rodar localmente

```bash
npm install
npm run dev
```

Acesse `http://localhost:5173`
