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
  import { authenticateToken } from './middleware/auth.js';

  dotenv.config();

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  const PORT = process.env.PORT || 3000;

  const app = express(); // Adicione esta linha

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Initialize Database
  db.initDatabase();

  // Public routes
  app.use('/api/auth', authRoutes);

  // Protected routes with JWT middleware
  app.use('/api/dashboard', authenticateToken, dashboardRoutes);
  app.use('/api/cartoes', authenticateToken, cartaoRoutes);
  app.use('/api/faturas', authenticateToken, faturaRoutes); // Esta linha já está correta!
  app.use('/api/despesas', authenticateToken, despesaRoutes);
  app.use('/api/receitas', authenticateToken, receitaRoutes);
  app.use('/api/investimentos', authenticateToken, investimentoRoutes);
  app.use('/api/configuracoes', authenticateToken, configuracaoRoutes);
  app.use('/api/import', authenticateToken, importRoutes);

  // Serve static files from the React app in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(join(__dirname, '../../dist')));
    
    app.get('*', (req, res) => {
      res.sendFile(join(__dirname, '../../dist/index.html'));
    });
  }

  // Só rode o app.listen se não estiver em ambiente serverless (Vercel)
  if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  }

  export default app;