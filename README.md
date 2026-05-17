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

## 🔐 Segurança

- Autenticação JWT
- Senhas criptografadas com bcrypt
- Validação de dados no frontend e backend
- Conexões HTTPS obrigatórias em produção
- Integração segura com Pluggy (certificado pelo Banco Central)

## 📱 PWA Features

- Instalação no dispositivo
- Funcionamento offline
- Cache inteligente
- Notificações push
- Ícones e splash screen personalizados


## 📄 Licença

MIT License - veja o arquivo LICENSE para detalhes.
