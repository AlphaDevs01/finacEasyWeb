import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import db from './db/index.js';
import authRoutes from './routes/auth.js';
import cartaoRoutes from './routes/cartoes.js';
import faturaRoutes from './routes/faturas.js';
import despesaRoutes from './routes/despesas.js';
import receitaRoutes from './routes/receitas.js';
import investimentoRoutes from './routes/investimentos.js';
import configuracaoRoutes from './routes/configuracoes.js';
import dashboardRoutes from './routes/dashboard.js';
import importRoutes from './routes/import.js';
import metasRoutes from './routes/metas.js';
import notificacoesRoutes from './routes/notificacoes.js';
import categoriasRoutes from './routes/categorias.js';
import lembretesRoutes from './routes/lembretes.js';
import openfinanceRoutes from './routes/openfinance.js';
import { authenticateToken } from './middleware/auth.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PORT = process.env.PORT || 3000;

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Inicializar banco
db.initDatabase();

// Rotas públicas
app.use('/api/auth', authRoutes);

// Rotas protegidas
app.use('/api/dashboard', authenticateToken, dashboardRoutes);
app.use('/api/cartoes', authenticateToken, cartaoRoutes);
app.use('/api/faturas', authenticateToken, faturaRoutes);
app.use('/api/despesas', authenticateToken, despesaRoutes);
app.use('/api/receitas', authenticateToken, receitaRoutes);
app.use('/api/investimentos', authenticateToken, investimentoRoutes);
app.use('/api/configuracoes', authenticateToken, configuracaoRoutes);
app.use('/api/import', authenticateToken, importRoutes);
app.use('/api/metas', authenticateToken, metasRoutes);
app.use('/api/notificacoes', authenticateToken, notificacoesRoutes);
app.use('/api/categorias', authenticateToken, categoriasRoutes);
app.use('/api/lembretes', authenticateToken, lembretesRoutes);
app.use('/api/openfinance', authenticateToken, openfinanceRoutes);

// Teste
app.get('/api/test', (req, res) => {
  res.json({ message: 'API está funcionando!' });
});

// Servir front-end em produção (ex: React)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, '../dist')));

  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, '../dist/index.html'));
  });
}

// Só roda localmente (em dev)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
}

export default app;
