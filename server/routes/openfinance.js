import express from 'express';
import db from '../db/index.js';

const router = express.Router();

// Obter todas as conexões do usuário
router.get('/connections', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await db.query(
      'SELECT * FROM openfinance_connections WHERE userId = $1 ORDER BY created_at DESC',
      [userId]
    );
    
    res.json(result.rows);
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
      [userId, connectorId.toString(), itemId, status, new Date()]
    );
    
    res.status(201).json(result.rows[0]);
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
    
    res.json(result.rows[0]);
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
      'DELETE FROM openfinance_connections WHERE connection_token = $1 AND userId = $2',
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
      'SELECT * FROM openfinance_connections WHERE connection_token = $1 AND userId = $2',
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
    console.error(error);
    
    // Registrar erro de sincronização
    await db.query(
      'INSERT INTO openfinance_sync_history (userId, contas_sincronizadas, transacoes_sincronizadas, cartoes_sincronizados, status, error_message) VALUES ($1, $2, $3, $4, $5, $6)',
      [userId, 0, 0, 0, 'erro', error.message]
    );
    
    res.status(500).json({ error: 'Erro na sincronização' });
  }
});

// Histórico de sincronização
router.get('/sync-history', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await db.query(
      'SELECT * FROM openfinance_sync_history WHERE userId = $1 ORDER BY created_at DESC LIMIT 20',
      [userId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar histórico' });
  }
});

// Obter status de um item específico
router.get('/items/:itemId/status', async (req, res) => {
  const { itemId } = req.params;
  const userId = req.user.id;
  
  try {
    // Verificar se o item pertence ao usuário
    const connectionCheck = await db.query(
      'SELECT * FROM openfinance_connections WHERE connection_token = $1 AND userId = $2',
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

// Webhook do Pluggy para atualizações de status
router.post('/webhook', async (req, res) => {
  const { itemId, status, event } = req.body;
  
  try {
    // Atualizar status da conexão
    await db.query(
      'UPDATE openfinance_connections SET status = $1 WHERE connection_token = $2',
      [status, itemId]
    );
    
    // Se for uma atualização bem-sucedida, registrar no histórico
    if (event === 'item/updated' && status === 'UPDATED') {
      // Buscar userId da conexão
      const connection = await db.query(
        'SELECT userId FROM openfinance_connections WHERE connection_token = $1',
        [itemId]
      );
      
      if (connection.rows.length > 0) {
        await db.query(
          'INSERT INTO openfinance_sync_history (userId, contas_sincronizadas, transacoes_sincronizadas, cartoes_sincronizados, status) VALUES ($1, $2, $3, $4, $5)',
          [connection.rows[0].userId, 0, 0, 0, 'sucesso']
        );
      }
    }
    
    res.json({ message: 'Webhook processado com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao processar webhook' });
  }
});

export default router;