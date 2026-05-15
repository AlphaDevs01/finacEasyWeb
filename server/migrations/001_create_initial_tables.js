/**
 * Migration 001: Create initial tables
 * Date: 2025-01-01
 */

export const up = async (client) => {
  // Users table
  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      nome VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      senha_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Índice de busca por email
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  `);

  // User sessions table
  await client.query(`
    CREATE TABLE IF NOT EXISTS user_sessions (
      id SERIAL PRIMARY KEY,
      userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      session_id VARCHAR(64) NOT NULL UNIQUE,
      jti VARCHAR(32) NOT NULL,
      refresh_token_hash VARCHAR(64) NOT NULL,
      user_agent VARCHAR(255),
      ip_address VARCHAR(45),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMP NOT NULL,
      last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      revoked BOOLEAN DEFAULT FALSE,
      revoked_at TIMESTAMP,
      rotated_at TIMESTAMP,
      rotated_from VARCHAR(64),
      UNIQUE(session_id)
    );
  `);

  // Índices para performance de sessão
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_user_sessions_userId ON user_sessions(userId);
  `);
  
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_user_sessions_refresh_hash ON user_sessions(refresh_token_hash);
  `);

  // Cartões table
  await client.query(`
    CREATE TABLE IF NOT EXISTS cartoes (
      id SERIAL PRIMARY KEY,
      userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      nome VARCHAR(100) NOT NULL,
      numero VARCHAR(4) NOT NULL,
      limite DECIMAL(10, 2) NOT NULL CHECK (limite >= 0),
      data_fechamento INTEGER NOT NULL CHECK (data_fechamento >= 1 AND data_fechamento <= 31),
      data_vencimento INTEGER NOT NULL CHECK (data_vencimento >= 1 AND data_vencimento <= 31),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Índice para cartões por usuário
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_cartoes_userId ON cartoes(userId);
  `);

  // Faturas table
  await client.query(`
    CREATE TABLE IF NOT EXISTS faturas (
      id SERIAL PRIMARY KEY,
      userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      cartaoId INTEGER NOT NULL REFERENCES cartoes(id) ON DELETE CASCADE,
      mes_referencia INTEGER NOT NULL CHECK (mes_referencia >= 1 AND mes_referencia <= 12),
      ano_referencia INTEGER NOT NULL CHECK (ano_referencia >= 2000 AND ano_referencia <= 2100),
      valor_total DECIMAL(10, 2) NOT NULL CHECK (valor_total >= 0),
      status VARCHAR(20) NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta', 'fechada', 'paga')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(userId, cartaoId, mes_referencia, ano_referencia)
    );
  `);

  // Índices para faturas
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_faturas_userId ON faturas(userId);
  `);
  
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_faturas_cartaoId ON faturas(cartaoId);
  `);

  // Despesas table
  await client.query(`
    CREATE TABLE IF NOT EXISTS despesas (
      id SERIAL PRIMARY KEY,
      userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      descricao VARCHAR(255) NOT NULL,
      valor DECIMAL(10, 2) NOT NULL CHECK (valor >= 0),
      data DATE NOT NULL,
      tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('conta', 'cartao')),
      cartaoId INTEGER REFERENCES cartoes(id) ON DELETE SET NULL,
      faturaId INTEGER REFERENCES faturas(id) ON DELETE SET NULL,
      categoria VARCHAR(50) NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'paga', 'atrasada')),
      data_vencimento DATE,
      observacoes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Índices para despesas
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_despesas_userId_data ON despesas(userId, data DESC);
  `);
  
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_despesas_categoria ON despesas(userId, categoria);
  `);

  // Receitas table
  await client.query(`
    CREATE TABLE IF NOT EXISTS receitas (
      id SERIAL PRIMARY KEY,
      userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      descricao VARCHAR(255) NOT NULL,
      valor DECIMAL(10, 2) NOT NULL CHECK (valor >= 0),
      data DATE NOT NULL,
      categoria VARCHAR(50) NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'recebida')),
      data_vencimento DATE,
      observacoes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Índices para receitas
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_receitas_userId_data ON receitas(userId, data DESC);
  `);

  // Investimentos table
  await client.query(`
    CREATE TABLE IF NOT EXISTS investimentos (
      id SERIAL PRIMARY KEY,
      userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      tipo VARCHAR(50) NOT NULL,
      nome VARCHAR(100) NOT NULL,
      valor_aplicado DECIMAL(10, 2) NOT NULL CHECK (valor_aplicado >= 0),
      rendimento_mensal DECIMAL(10, 2) NOT NULL CHECK (rendimento_mensal >= 0),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Índice para investimentos
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_investimentos_userId ON investimentos(userId);
  `);

  // Metas de gastos table
  await client.query(`
    CREATE TABLE IF NOT EXISTS metas_gastos (
      id SERIAL PRIMARY KEY,
      userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      categoria VARCHAR(50) NOT NULL,
      valor_limite DECIMAL(10, 2) NOT NULL CHECK (valor_limite >= 0),
      mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
      ano INTEGER NOT NULL CHECK (ano >= 2000 AND ano <= 2100),
      ativo BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(userId, categoria, mes, ano)
    );
  `);

  // Índice para metas
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_metas_userId ON metas_gastos(userId);
  `);

  // Notificações table
  await client.query(`
    CREATE TABLE IF NOT EXISTS notificacoes (
      id SERIAL PRIMARY KEY,
      userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      tipo VARCHAR(50) NOT NULL,
      titulo VARCHAR(255) NOT NULL,
      mensagem TEXT NOT NULL,
      lida BOOLEAN DEFAULT FALSE,
      data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Índice para notificações
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_notificacoes_userId_lida ON notificacoes(userId, lida);
  `);

  // Categorias personalizadas table
  await client.query(`
    CREATE TABLE IF NOT EXISTS categorias (
      id SERIAL PRIMARY KEY,
      userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      nome VARCHAR(100) NOT NULL,
      tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('receita', 'despesa')),
      cor VARCHAR(7) DEFAULT '#3B82F6',
      icone VARCHAR(10) DEFAULT '💰',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(userId, nome, tipo)
    );
  `);

  // Índice para categorias
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_categorias_userId ON categorias(userId);
  `);

  // Lembretes table
  await client.query(`
    CREATE TABLE IF NOT EXISTS lembretes (
      id SERIAL PRIMARY KEY,
      userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      titulo VARCHAR(255) NOT NULL,
      descricao TEXT,
      data_vencimento TIMESTAMP NOT NULL,
      ativo BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Índice para lembretes
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_lembretes_userId ON lembretes(userId);
  `);

  // Configurações table
  await client.query(`
    CREATE TABLE IF NOT EXISTS configuracoes (
      id SERIAL PRIMARY KEY,
      userId INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      notificacoes_email BOOLEAN DEFAULT FALSE,
      tema VARCHAR(20) DEFAULT 'claro' CHECK (tema IN ('claro', 'escuro')),
      alerta_limite_cartao INTEGER DEFAULT 80 CHECK (alerta_limite_cartao >= 0 AND alerta_limite_cartao <= 100),
      alerta_vencimento_dias INTEGER DEFAULT 3 CHECK (alerta_vencimento_dias >= 1 AND alerta_vencimento_dias <= 365),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('✓ Migration 001: Initial tables created');
};

export const down = async (client) => {
  // Drop tables in reverse order
  const tables = [
    'configuracoes',
    'lembretes',
    'categorias',
    'notificacoes',
    'metas_gastos',
    'investimentos',
    'receitas',
    'despesas',
    'faturas',
    'cartoes',
    'user_sessions',
    'users'
  ];

  for (const table of tables) {
    await client.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
  }

  console.log('✓ Migration 001: All tables dropped');
};
