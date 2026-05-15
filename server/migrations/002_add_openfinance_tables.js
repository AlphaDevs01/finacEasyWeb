/**
 * Migration 002: Add Open Finance tables
 * Date: 2025-01-02
 */

export const up = async (client) => {
  // Open Finance connections table
  await client.query(`
    CREATE TABLE IF NOT EXISTS openfinance_connections (
      id SERIAL PRIMARY KEY,
      userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      bank_id VARCHAR(50) NOT NULL,
      connection_token VARCHAR(255) NOT NULL UNIQUE,
      status VARCHAR(50) NOT NULL,
      connected_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      synced_at TIMESTAMP,
      disconnected_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Índice para conexões
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_openfinance_connections_userId ON openfinance_connections(userId);
  `);

  // Open Finance settings table
  await client.query(`
    CREATE TABLE IF NOT EXISTS openfinance_settings (
      id SERIAL PRIMARY KEY,
      userId INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      auto_sync BOOLEAN DEFAULT FALSE,
      sync_frequency VARCHAR(20) DEFAULT 'daily' CHECK (sync_frequency IN ('hourly', 'daily', 'weekly')),
      last_sync TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Open Finance webhook events table (para auditoria)
  await client.query(`
    CREATE TABLE IF NOT EXISTS openfinance_webhook_events (
      id SERIAL PRIMARY KEY,
      connection_id VARCHAR(255),
      event_type VARCHAR(50) NOT NULL,
      status VARCHAR(50),
      item_id VARCHAR(255),
      payload JSONB,
      signature_valid BOOLEAN DEFAULT FALSE,
      processed BOOLEAN DEFAULT FALSE,
      processed_at TIMESTAMP,
      error_message TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Índice para webhooks
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_openfinance_webhook_events_connection ON openfinance_webhook_events(connection_id);
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_openfinance_webhook_events_created ON openfinance_webhook_events(created_at DESC);
  `);

  // Audit log table
  await client.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id SERIAL PRIMARY KEY,
      userId INTEGER REFERENCES users(id) ON DELETE SET NULL,
      action VARCHAR(100) NOT NULL,
      resource_type VARCHAR(50) NOT NULL,
      resource_id INTEGER,
      old_values JSONB,
      new_values JSONB,
      ip_address VARCHAR(45),
      user_agent VARCHAR(255),
      status VARCHAR(20) DEFAULT 'success' CHECK (status IN ('success', 'failure')),
      error_message TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Índices para audit log
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_audit_logs_userId ON audit_logs(userId);
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
  `);

  // Import history table
  await client.query(`
    CREATE TABLE IF NOT EXISTS import_history (
      id SERIAL PRIMARY KEY,
      userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      import_type VARCHAR(50) NOT NULL,
      file_name VARCHAR(255),
      total_records INTEGER,
      successful_records INTEGER,
      failed_records INTEGER,
      status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'partial', 'failed')),
      error_message TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Índice para histórico de importação
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_import_history_userId ON import_history(userId);
  `);

  console.log('✓ Migration 002: Open Finance and audit tables created');
};

export const down = async (client) => {
  const tables = [
    'import_history',
    'audit_logs',
    'openfinance_webhook_events',
    'openfinance_settings',
    'openfinance_connections'
  ];

  for (const table of tables) {
    await client.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
  }

  console.log('✓ Migration 002: Open Finance and audit tables dropped');
};
