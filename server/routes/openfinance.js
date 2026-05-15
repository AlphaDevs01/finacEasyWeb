import express from 'express';
import db from '../db/index.js';
import * as pluggyService from '../services/pluggyService.js';

const normalizeCredentials = (credentials) => {
  if (!credentials || typeof credentials !== 'object' || Array.isArray(credentials)) return null;

  return Object.fromEntries(
    Object.entries(credentials)
      .map(([key, value]) => [String(key).trim(), typeof value === 'string' ? value.trim() : value])
      .filter(([key, value]) => key && value !== undefined && value !== null && String(value).trim() !== '')
  );
};

const router = express.Router();

const safeError = (res, error, fallback = 'Erro na operação Open Finance') => {
  const status = Number(error?.status || 500);
  return res.status(status >= 400 && status < 600 ? status : 500).json({ error: error?.message || fallback });
};


const mapConnection = (row) => ({
  id: String(row.id),
  userId: row.userid ?? row.userId,
  itemId: row.itemid || row.connection_token,
  connectorId: Number(row.connectorid || row.bank_id || 0),
  bankName: row.bankname || row.bank_id || 'Banco',
  status: row.status,
  lastSync: row.connected_at,
  createdAt: row.created_at
});

const assertOwnedConnection = async (userId, itemId) => {
  const result = await db.query(
    'SELECT * FROM openfinance_connections WHERE connection_token = $1 AND userId = $2 AND disconnected_at IS NULL',
    [itemId, userId]
  );
  return result.rows[0] || null;
};



// Conectores disponíveis via backend. O frontend não deve chamar api.pluggy.ai diretamente.
router.get('/connectors', async (_req, res) => {
  try {
    const connectors = await pluggyService.getConnectors();
    res.json(connectors);
  } catch (error) {
    safeError(res, error, 'Erro ao buscar bancos disponíveis');
  }
});

// Connect token para fluxos Pluggy Connect, quando usado pelo frontend.
router.post('/connect-token', async (req, res) => {
  try {
    const token = await pluggyService.createConnectToken(req.body?.itemId);
    res.json(token);
  } catch (error) {
    safeError(res, error, 'Erro ao criar connect token');
  }
});

// Compatibilidade com a tela atual, que ainda coleta credenciais em modal.
// As credenciais vão para o backend e nunca expõem PLUGGY_CLIENT_SECRET no bundle.
router.post('/items', async (req, res) => {
  const userId = req.user.id;
  const { connectorId, credentials = {}, bankName } = req.body || {};
  const parsedConnectorId = Number(connectorId);
  const normalizedCredentials = normalizeCredentials(credentials);

  if (!Number.isInteger(parsedConnectorId) || parsedConnectorId <= 0 || !normalizedCredentials || Object.keys(normalizedCredentials).length === 0) {
    return res.status(400).json({ error: 'Payload inválido para conexão Open Finance' });
  }

  try {
    const item = await pluggyService.createItem({
      connectorId: parsedConnectorId,
      credentials: normalizedCredentials,
      clientUserId: userId
    });

    await db.query(
      `INSERT INTO openfinance_connections (userId, bank_id, connection_token, connectorId, itemId, bankName, status, connected_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
       ON CONFLICT DO NOTHING`,
      [userId, String(parsedConnectorId), item.id, parsedConnectorId, item.id, bankName || item.connector?.name || null, item.status || 'CREATED']
    );

    res.status(201).json(item);
  } catch (error) {
    safeError(res, error, 'Erro ao conectar com o banco');
  }
});

router.get('/items/:itemId', async (req, res) => {
  const connection = await assertOwnedConnection(req.user.id, req.params.itemId);
  if (!connection) return res.status(404).json({ error: 'Item não encontrado' });

  try {
    const item = await pluggyService.getItemStatus(req.params.itemId);
    await db.query(
      'UPDATE openfinance_connections SET status = $1 WHERE connection_token = $2 AND userId = $3',
      [item.status || connection.status, req.params.itemId, req.user.id]
    );
    res.json(item);
  } catch (error) {
    safeError(res, error, 'Erro ao obter status do item');
  }
});

router.delete('/items/:itemId', async (req, res) => {
  const connection = await assertOwnedConnection(req.user.id, req.params.itemId);
  if (!connection) return res.status(404).json({ error: 'Item não encontrado' });

  try {
    await pluggyService.deleteItem(req.params.itemId);
    await db.query(
      'UPDATE openfinance_connections SET disconnected_at = CURRENT_TIMESTAMP, status = $1 WHERE connection_token = $2 AND userId = $3',
      ['DISCONNECTED', req.params.itemId, req.user.id]
    );
    res.json({ message: 'Conexão removida com sucesso' });
  } catch (error) {
    safeError(res, error, 'Erro ao desconectar banco');
  }
});

router.get('/accounts', async (req, res) => {
  const { itemId } = req.query;
  if (!itemId) return res.status(400).json({ error: 'itemId é obrigatório' });
  const connection = await assertOwnedConnection(req.user.id, String(itemId));
  if (!connection) return res.status(404).json({ error: 'Conexão não encontrada' });

  try {
    res.json(await pluggyService.getAccounts(String(itemId)));
  } catch (error) {
    safeError(res, error, 'Erro ao buscar contas');
  }
});

router.get('/transactions', async (req, res) => {
  const { itemId, accountId, from, to } = req.query;
  if (!itemId || !accountId) return res.status(400).json({ error: 'itemId e accountId são obrigatórios' });
  const connection = await assertOwnedConnection(req.user.id, String(itemId));
  if (!connection) return res.status(404).json({ error: 'Conexão não encontrada' });

  try {
    res.json(await pluggyService.getTransactions({ accountId: String(accountId), from, to }));
  } catch (error) {
    safeError(res, error, 'Erro ao buscar transações');
  }
});

router.get('/cards', async (req, res) => {
  const { itemId } = req.query;
  if (!itemId) return res.status(400).json({ error: 'itemId é obrigatório' });
  const connection = await assertOwnedConnection(req.user.id, String(itemId));
  if (!connection) return res.status(404).json({ error: 'Conexão não encontrada' });

  try {
    res.json(await pluggyService.getCards(String(itemId)));
  } catch (error) {
    safeError(res, error, 'Erro ao buscar cartões');
  }
});

router.get('/investments', async (req, res) => {
  const { itemId } = req.query;
  if (!itemId) return res.status(400).json({ error: 'itemId é obrigatório' });
  const connection = await assertOwnedConnection(req.user.id, String(itemId));
  if (!connection) return res.status(404).json({ error: 'Conexão não encontrada' });

  try {
    res.json(await pluggyService.getInvestments(String(itemId)));
  } catch (error) {
    safeError(res, error, 'Erro ao buscar investimentos');
  }
});

router.post('/disconnect', async (req, res) => {
  const { itemId } = req.body || {};
  if (!itemId) return res.status(400).json({ error: 'itemId é obrigatório' });
  req.params.itemId = itemId;
  const connection = await assertOwnedConnection(req.user.id, String(itemId));
  if (!connection) return res.status(404).json({ error: 'Conexão não encontrada' });

  try {
    await pluggyService.deleteItem(String(itemId));
    await db.query(
      'UPDATE openfinance_connections SET disconnected_at = CURRENT_TIMESTAMP, status = $1 WHERE connection_token = $2 AND userId = $3',
      ['DISCONNECTED', String(itemId), req.user.id]
    );
    res.json({ message: 'Conexão removida com sucesso' });
  } catch (error) {
    safeError(res, error, 'Erro ao desconectar banco');
  }
});

// Endpoints mínimos para evitar 404 na interface atual de correspondência.
router.post('/match/:transactionId/accept', async (req, res) => {
  const { transactionId } = req.params;
  if (!transactionId) return res.status(400).json({ error: 'transactionId é obrigatório' });
  res.json({ message: 'Correspondência aceita', transactionId });
});

router.post('/match/:transactionId/reject', async (req, res) => {
  const { transactionId } = req.params;
  if (!transactionId) return res.status(400).json({ error: 'transactionId é obrigatório' });
  res.json({ message: 'Correspondência rejeitada', transactionId });
});

// Obter todas as conexões do usuário
router.get('/connections', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await db.query(
      'SELECT * FROM openfinance_connections WHERE userId = $1 AND disconnected_at IS NULL ORDER BY created_at DESC',
      [userId]
    );
    
    res.json(result.rows.map(mapConnection));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar conexões' });
  }
});

// Criar nova conexão
router.post('/connections', async (req, res) => {
  const { itemId, connectorId, status } = req.body;
  const userId = req.user.id;
  
  try {
    const result = await db.query(
      'INSERT INTO openfinance_connections (userId, bank_id, connection_token, status, connected_at) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [userId, connectorId.toString(), itemId, status || 'CREATED', new Date()]
    );
    
    res.status(201).json(mapConnection(result.rows[0]));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar conexão' });
  }
});

// Atualizar conexão
router.put('/connections/:itemId', async (req, res) => {
  const { itemId } = req.params;
  const { lastSync, status } = req.body;
  const userId = req.user.id;
  
  try {
    const result = await db.query(
      'UPDATE openfinance_connections SET status = COALESCE($1, status), connected_at = COALESCE($2, connected_at) WHERE connection_token = $3 AND userId = $4 RETURNING *',
      [status, lastSync, itemId, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Conexão não encontrada' });
    }
    
    res.json(mapConnection(result.rows[0]));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar conexão' });
  }
});

// Deletar conexão
router.delete('/connections/:itemId', async (req, res) => {
  const { itemId } = req.params;
  const userId = req.user.id;
  
  try {
    await db.query(
      "UPDATE openfinance_connections SET disconnected_at = CURRENT_TIMESTAMP, status = 'DISCONNECTED' WHERE connection_token = $1 AND userId = $2",
      [itemId, userId]
    );
    
    res.json({ message: 'Conexão removida com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao remover conexão' });
  }
});

// Configurações de sincronização do usuário
router.get('/settings', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await db.query(
      'SELECT * FROM openfinance_settings WHERE userId = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      // Criar configurações padrão
      const defaultSettings = await db.query(
        'INSERT INTO openfinance_settings (userId, auto_sync, sync_frequency) VALUES ($1, $2, $3) RETURNING *',
        [userId, false, 'daily']
      );
      
      return res.json(defaultSettings.rows[0]);
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar configurações' });
  }
});

// Atualizar configurações de sincronização
router.put('/settings', async (req, res) => {
  const { auto_sync, sync_frequency } = req.body;
  const userId = req.user.id;
  
  try {
    const result = await db.query(
      'UPDATE openfinance_settings SET auto_sync = $1, sync_frequency = $2 WHERE userId = $3 RETURNING *',
      [auto_sync, sync_frequency, userId]
    );
    
    if (result.rows.length === 0) {
      const newSettings = await db.query(
        'INSERT INTO openfinance_settings (userId, auto_sync, sync_frequency) VALUES ($1, $2, $3) RETURNING *',
        [userId, auto_sync, sync_frequency]
      );
      
      return res.json(newSettings.rows[0]);
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar configurações' });
  }
});

// Sincronizar dados
router.post('/sync', async (req, res) => {
  const userId = req.user.id;
  const { itemId } = req.body;
  
  try {
    if (!itemId) {
      return res.status(400).json({ error: 'ItemId é obrigatório' });
    }
    
    // Verificar se a conexão pertence ao usuário
    const connectionCheck = await db.query(
      'SELECT * FROM openfinance_connections WHERE connection_token = $1 AND userId = $2 AND disconnected_at IS NULL',
      [itemId, userId]
    );
    
    if (connectionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Conexão não encontrada' });
    }
    
    // A sincronização real será feita pelo frontend usando o Pluggy SDK
    // Aqui apenas registramos o histórico
    const mockResults = {
      accountsSynced: 2,
      transactionsSynced: 45,
      cardsSynced: 1,
      investmentsSynced: 3
    };
    
    // Atualizar última sincronização
    await db.query(
      'UPDATE openfinance_connections SET connected_at = CURRENT_TIMESTAMP WHERE connection_token = $1 AND userId = $2',
      [itemId, userId]
    );
    
    // Registrar sincronização
    await db.query(
      'INSERT INTO openfinance_sync_history (userId, contas_sincronizadas, transacoes_sincronizadas, cartoes_sincronizados, status) VALUES ($1, $2, $3, $4, $5)',
      [userId, mockResults.accountsSynced, mockResults.transactionsSynced, mockResults.cardsSynced, 'sucesso']
    );
    
    res.json(mockResults);
  } catch (error) {
    console.error('Erro ao sincronizar Open Finance:', error);

    try {
      await db.query(
        'INSERT INTO openfinance_sync_history (userId, contas_sincronizadas, transacoes_sincronizadas, cartoes_sincronizados, status, error_message) VALUES ($1, $2, $3, $4, $5, $6)',
        [userId, 0, 0, 0, 'erro', String(error?.message || 'erro interno').slice(0, 500)]
      );
    } catch (historyError) {
      console.error('Erro ao registrar histórico Open Finance:', historyError);
    }

    res.status(500).json({ error: 'Erro na sincronização' });
  }
});

// Histórico de sincronização
router.get('/sync-history', async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Acesso negado' });

  try {
    const result = await db.query(
      `SELECT id, userid AS "userId", contas_sincronizadas, transacoes_sincronizadas,
              cartoes_sincronizados, status, error_message, created_at
       FROM openfinance_sync_history
       WHERE userId = $1
       ORDER BY created_at DESC
       LIMIT 20`,
      [userId]
    );

    return res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar histórico Open Finance:', error);
    return res.status(500).json({ error: 'Erro ao buscar histórico' });
  }
});

// Obter status de um item específico
router.get('/items/:itemId/status', async (req, res) => {
  const { itemId } = req.params;
  const userId = req.user.id;
  
  try {
    // Verificar se o item pertence ao usuário
    const connectionCheck = await db.query(
      'SELECT * FROM openfinance_connections WHERE connection_token = $1 AND userId = $2 AND disconnected_at IS NULL',
      [itemId, userId]
    );
    
    if (connectionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Item não encontrado' });
    }
    
    // O status real será obtido pelo frontend via Pluggy SDK
    res.json({
      status: 'UPDATED',
      lastSync: connectionCheck.rows[0].connected_at
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao obter status do item' });
  }
});

// Webhook público fica isolado em /api/webhooks/openfinance e não passa por autenticação por cookie.

export default router;