import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Create a new pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_AWG3bkOE2cSi@ep-plain-dawn-acz8jya6-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Database initialization
const initDatabase = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create tables if they don't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        senha_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS cartoes (
        id SERIAL PRIMARY KEY,
        userId INTEGER REFERENCES users(id) ON DELETE CASCADE,
        nome VARCHAR(100) NOT NULL,
        numero VARCHAR(4) NOT NULL,
        limite DECIMAL(10, 2) NOT NULL,
        data_fechamento INTEGER NOT NULL,
        data_vencimento INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS faturas (
        id SERIAL PRIMARY KEY,
        userId INTEGER REFERENCES users(id) ON DELETE CASCADE,
        cartaoId INTEGER REFERENCES cartoes(id) ON DELETE CASCADE,
        mes_referencia INTEGER NOT NULL,
        ano_referencia INTEGER NOT NULL,
        valor_total DECIMAL(10, 2) NOT NULL,
        status VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS despesas (
        id SERIAL PRIMARY KEY,
        userId INTEGER REFERENCES users(id) ON DELETE CASCADE,
        descricao VARCHAR(255) NOT NULL,
        valor DECIMAL(10, 2) NOT NULL,
        data DATE NOT NULL,
        tipo VARCHAR(20) NOT NULL,
        cartaoId INTEGER REFERENCES cartoes(id) ON DELETE SET NULL,
        faturaId INTEGER REFERENCES faturas(id) ON DELETE SET NULL,
        categoria VARCHAR(50) NOT NULL,
        status VARCHAR(20) DEFAULT 'pendente',
        data_vencimento DATE,
        observacoes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS receitas (
        id SERIAL PRIMARY KEY,
        userId INTEGER REFERENCES users(id) ON DELETE CASCADE,
        descricao VARCHAR(255) NOT NULL,
        valor DECIMAL(10, 2) NOT NULL,
        data DATE NOT NULL,
        categoria VARCHAR(50) NOT NULL,
        status VARCHAR(20) DEFAULT 'pendente',
        data_vencimento DATE,
        observacoes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS investimentos (
        id SERIAL PRIMARY KEY,
        userId INTEGER REFERENCES users(id) ON DELETE CASCADE,
        tipo VARCHAR(50) NOT NULL,
        nome VARCHAR(100) NOT NULL,
        valor_aplicado DECIMAL(10, 2) NOT NULL,
        rendimento_mensal DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS configuracoes (
        id SERIAL PRIMARY KEY,
        userId INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        notificacoes_email BOOLEAN DEFAULT FALSE,
        tema VARCHAR(20) DEFAULT 'claro',
        alerta_limite_cartao INTEGER DEFAULT 80,
        alerta_vencimento_dias INTEGER DEFAULT 3,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tabela de metas de gastos
    await client.query(`
      CREATE TABLE IF NOT EXISTS metas_gastos (
        id SERIAL PRIMARY KEY,
        userId INTEGER REFERENCES users(id) ON DELETE CASCADE,
        categoria VARCHAR(50) NOT NULL,
        valor_limite DECIMAL(10, 2) NOT NULL,
        mes INTEGER NOT NULL,
        ano INTEGER NOT NULL,
        ativo BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(userId, categoria, mes, ano)
      );
    `);

    // Tabela de notificações
    await client.query(`
      CREATE TABLE IF NOT EXISTS notificacoes (
        id SERIAL PRIMARY KEY,
        userId INTEGER REFERENCES users(id) ON DELETE CASCADE,
        tipo VARCHAR(50) NOT NULL,
        titulo VARCHAR(255) NOT NULL,
        mensagem TEXT NOT NULL,
        lida BOOLEAN DEFAULT FALSE,
        data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tabela de categorias personalizadas
    await client.query(`
      CREATE TABLE IF NOT EXISTS categorias (
        id SERIAL PRIMARY KEY,
        userId INTEGER REFERENCES users(id) ON DELETE CASCADE,
        nome VARCHAR(100) NOT NULL,
        tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('receita', 'despesa')),
        cor VARCHAR(7) DEFAULT '#3B82F6',
        icone VARCHAR(10) DEFAULT '💰',
        ativo BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(userId, nome, tipo)
      );
    `);

    // Tabela de lembretes
    await client.query(`
      CREATE TABLE IF NOT EXISTS lembretes (
        id SERIAL PRIMARY KEY,
        userId INTEGER REFERENCES users(id) ON DELETE CASCADE,
        titulo VARCHAR(255) NOT NULL,
        descricao TEXT,
        data_vencimento TIMESTAMP NOT NULL,
        tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('despesa', 'receita', 'fatura', 'meta')),
        ativo BOOLEAN DEFAULT TRUE,
        notificado BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tabela de configurações Open Finance
    await client.query(`
      CREATE TABLE IF NOT EXISTS openfinance_settings (
        id SERIAL PRIMARY KEY,
        userId INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        auto_sync BOOLEAN DEFAULT FALSE,
        sync_frequency VARCHAR(20) DEFAULT 'daily',
        last_sync TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tabela de conexões bancárias
    await client.query(`
      CREATE TABLE IF NOT EXISTS openfinance_connections (
        id SERIAL PRIMARY KEY,
        userId INTEGER REFERENCES users(id) ON DELETE CASCADE,
        bank_id VARCHAR(50),
        connection_token VARCHAR(255) NOT NULL,
        connectorId INTEGER,
        itemId VARCHAR(255),
        bankName VARCHAR(255),
        status VARCHAR(20) DEFAULT 'pending',
        connected_at TIMESTAMP,
        disconnected_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tabela de histórico de sincronização
    await client.query(`
      CREATE TABLE IF NOT EXISTS openfinance_sync_history (
        id SERIAL PRIMARY KEY,
        userId INTEGER REFERENCES users(id) ON DELETE CASCADE,
        contas_sincronizadas INTEGER DEFAULT 0,
        transacoes_sincronizadas INTEGER DEFAULT 0,
        cartoes_sincronizados INTEGER DEFAULT 0,
        status VARCHAR(20) NOT NULL,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query('COMMIT');
    console.log('Database initialized successfully');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Error initializing database:', e);
  } finally {
    client.release();
  }
};

// DB query helper function
const query = (text, params) => pool.query(text, params);

export default {
  query,
  initDatabase,
  pool
};