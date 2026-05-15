import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import compression from 'compression';
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
import openfinanceWebhookRoutes from './routes/openfinanceWebhook.js';
import { authenticateToken } from './middleware/auth.js';
import { generateRequestId } from './config/security.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PORT = process.env.PORT || 3000;

const app = express();

const allowedOrigins = (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable('x-powered-by');
app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || generateRequestId();
  res.setHeader('X-Request-Id', req.id);
  next();
});
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false
}));
app.use(compression());
app.use(cookieParser());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin não permitida pelo CORS'));
  },
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.RATE_LIMIT_MAX || 300),
  standardHeaders: true,
  legacyHeaders: false
}));
app.use('/api/auth/login', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.LOGIN_RATE_LIMIT_MAX || 5),
  standardHeaders: true,
  legacyHeaders: false
}));
app.use('/api/auth/register', rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: Number(process.env.REGISTER_RATE_LIMIT_MAX || 10),
  standardHeaders: true,
  legacyHeaders: false
}));

// Inicializar banco
db.initDatabase();

// Rotas públicas
app.use('/api/auth', authRoutes);
app.use('/api/webhooks/openfinance', openfinanceWebhookRoutes);

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

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Servir front-end em produção (ex: React)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, '../dist')));

  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, '../dist/index.html'));
  });
}

app.use((err, req, res, _next) => {
  console.error(`[${req.id}]`, err);
  res.status(err.status || 500).json({ error: 'Erro interno do servidor', requestId: req.id });
});

// Só roda localmente (em dev)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
}

export default app;
