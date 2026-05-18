# FinanceEasy — Gestão Financeira Manual

Sistema para gerenciamento manual de finanças pessoais.

## Funcionalidades

### Receitas e despesas
- Cadastro manual de entradas e saídas.
- Controle por categoria.
- Status de pagamento/recebimento.
- Observações e vencimentos.

### Cartões de crédito
- Cadastro manual de cartões.
- Controle de limite, fechamento e vencimento.
- Faturas manuais por mês/ano.
- Despesas vinculadas a cartão e fatura.

### Dashboard e relatórios
- Visão mensal de receitas, despesas e saldo.
- Histórico anual.
- Gráficos por categoria.
- Exportação e importação CSV.

### Metas, categorias e lembretes
- Metas por categoria.
- Categorias personalizadas.
- Lembretes financeiros.

## Escopo desta versão

Esta versão é **manual-only**. Não possui Open Finance, Pluggy, conectores bancários, webhooks bancários ou sincronização automática.

A decisão de produto é manter o FinanceEasy como controle financeiro manual. Caso Open Finance seja retomado no futuro, deverá ser criado como produto/módulo separado, sem misturar lançamentos automáticos com lançamentos manuais.

## Tecnologias

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Recharts
- PWA

### Backend
- Node.js
- Express
- PostgreSQL
- JWT
- bcrypt

## Segurança

- JWT para autenticação.
- Hash de senha com bcrypt.
- Rate limit.
- Helmet.
- CORS controlado por variável de ambiente.
- Validação de dados no backend.

## Deploy

Configure as variáveis essenciais:

```env
DATABASE_URL=...
JWT_SECRET=...
FRONTEND_URL=https://seu-dominio.com
NODE_ENV=production
```

Build:

```bash
npm install
npm run build
```

Servidor local:

```bash
npm run server
```
