# Sistema de Gestão Financeira Pessoal

Um sistema completo para gerenciamento de finanças pessoais com integração Open Finance via Pluggy.

## 🚀 Funcionalidades

### 💳 Gestão de Cartões
- Cadastro e gerenciamento de cartões de crédito
- Controle de faturas e limites
- Acompanhamento de gastos por cartão

### 💰 Receitas e Despesas
- Registro manual de transações
- Categorização automática
- Controle de status (pendente, paga, vencida)
- Sistema de parcelas para cartão de crédito

### 📊 Relatórios e Dashboard
- Dashboard interativo com gráficos
- Relatórios mensais e anuais
- Análise por categorias
- Exportação em PDF

### 🎯 Metas de Gastos
- Definição de metas por categoria
- Acompanhamento em tempo real
- Alertas de limite

### 🏦 Open Finance (Pluggy)
- Conexão real com +300 bancos brasileiros
- Sincronização automática de transações
- Importação de cartões de crédito
- Dados de investimentos

### 📱 PWA (Progressive Web App)
- Funciona offline
- Instalável no celular
- Notificações push

## 🛠️ Tecnologias

### Frontend
- **React 18** com TypeScript
- **Tailwind CSS** para estilização
- **React Router** para navegação
- **Recharts** para gráficos
- **Framer Motion** para animações
- **Vite** como bundler
- **PWA** com service worker

### Backend
- **Node.js** com Express
- **PostgreSQL** como banco de dados
- **JWT** para autenticação
- **bcrypt** para hash de senhas

### Integrações
- **Pluggy API** para Open Finance
- **Papa Parse** para importação CSV
- **html2canvas + jsPDF** para relatórios

## 🔧 Configuração

### 1. Variáveis de Ambiente

Crie um arquivo `.env` baseado no `.env.example`:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/finance_db

# JWT
JWT_SECRET=your_jwt_secret_here

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Pluggy API (Open Finance)
PLUGGY_CLIENT_ID=your_pluggy_client_id
PLUGGY_CLIENT_SECRET=your_pluggy_client_secret
PLUGGY_WEBHOOK_SECRET=your_shared_webhook_secret

# Environment
NODE_ENV=development
PORT=3000
```

### 2. Configuração do Pluggy

1. Acesse [Pluggy Dashboard](https://dashboard.pluggy.ai)
2. Crie uma conta e um novo projeto
3. Obtenha suas credenciais (Client ID e Client Secret)
4. Configure o webhook URL: `https://seu-dominio.com/api/webhooks/openfinance`
5. Adicione as credenciais no arquivo `.env`

### 3. Instalação

```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# Executar servidor backend
npm run server
```

### 4. Banco de Dados

O banco de dados PostgreSQL será inicializado automaticamente na primeira execução.

## 📋 Estrutura do Projeto

```
src/
├── components/          # Componentes React
│   ├── ui/             # Componentes de interface
│   └── Layout.tsx      # Layout principal
├── contexts/           # Contextos React
├── hooks/              # Hooks customizados
├── pages/              # Páginas da aplicação
├── services/           # Serviços e APIs
└── utils/              # Utilitários

server/
├── db/                 # Configuração do banco
├── middleware/         # Middlewares Express
├── routes/             # Rotas da API
└── index.js           # Servidor principal
```

## 🔐 Segurança

- Autenticação JWT
- Senhas criptografadas com bcrypt
- Validação de dados no frontend e backend
- Conexões HTTPS obrigatórias em produção
- Integração segura com Pluggy (certificado pelo Banco Central)

## 🏦 Open Finance com Pluggy

### Bancos Suportados
- Nubank, Itaú, Bradesco, Santander
- Banco do Brasil, Caixa Econômica
- Inter, C6 Bank, BTG Pactual
- +300 outras instituições

### Dados Sincronizados
- Contas correntes e poupança
- Cartões de crédito (faturas e transações)
- Investimentos (CDB, Tesouro, Ações, etc.)
- Histórico de transações (últimos 12 meses)

### Categorização Automática
- IA para categorizar transações
- Regras personalizáveis
- Aprendizado baseado no histórico

## 📱 PWA Features

- Instalação no dispositivo
- Funcionamento offline
- Cache inteligente
- Notificações push
- Ícones e splash screen personalizados

## 🚀 Deploy

### Vercel (Recomendado)
```bash
npm run build
vercel --prod
```

### Outras Plataformas
- Netlify
- Railway
- Heroku
- DigitalOcean App Platform

## 📄 Licença

MIT License - veja o arquivo LICENSE para detalhes.

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📞 Suporte

Para dúvidas sobre integração com Pluggy:
- [Documentação Pluggy](https://docs.pluggy.ai)
- [Discord Pluggy](https://discord.gg/pluggy)

Para dúvidas sobre o projeto:
- Abra uma issue no GitHub
- Entre em contato via email