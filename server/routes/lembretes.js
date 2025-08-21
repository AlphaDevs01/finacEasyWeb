import express from 'express';
import db from '../db/index.js';

const router = express.Router();

// Obter todos os lembretes do usuário
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { ativo } = req.query;
    
    let query = 'SELECT * FROM lembretes WHERE userId = $1';
    let params = [userId];
    
    if (ativo !== undefined) {
      query += ' AND ativo = $2';
      params.push(ativo === 'true');
    }
    
    query += ' ORDER BY data_vencimento ASC';
    
    const result = await db.query(query, params);
    
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar lembretes' });
  }
});

// Obter lembretes próximos ao vencimento
router.get('/proximos', async (req, res) => {
  try {
    const userId = req.user.id;
    const { dias = 7 } = req.query;
    
    const result = await db.query(
      `SELECT * FROM lembretes 
       WHERE userId = $1 
       AND ativo = true 
       AND data_vencimento <= NOW() + INTERVAL '${parseInt(dias)} days'
       AND data_vencimento >= NOW()
       ORDER BY data_vencimento ASC`,
      [userId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar lembretes próximos' });
  }
});

// Criar novo lembrete
router.post('/', async (req, res) => {
  const { titulo, descricao, data_vencimento, tipo, ativo } = req.body;
  const userId = req.user.id;
  
  try {
    if (!titulo || !data_vencimento || !tipo) {
      return res.status(400).json({ error: 'Título, data de vencimento e tipo são obrigatórios' });
    }

    // Validar data de vencimento
    const dataVencimento = new Date(data_vencimento);
    if (dataVencimento < new Date()) {
      return res.status(400).json({ error: 'Data de vencimento deve ser futura' });
    }
    
    const result = await db.query(
      'INSERT INTO lembretes (userId, titulo, descricao, data_vencimento, tipo, ativo) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [userId, titulo, descricao || '', data_vencimento, tipo, ativo !== false]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar lembrete' });
  }
});

// Atualizar lembrete
router.put('/:id', async (req, res) => {
  const { titulo, descricao, data_vencimento, tipo, ativo } = req.body;
  const userId = req.user.id;
  const lembreteId = req.params.id;
  
  try {
    // Verificar se o lembrete pertence ao usuário
    const lembreteCheck = await db.query(
      'SELECT * FROM lembretes WHERE id = $1 AND userId = $2',
      [lembreteId, userId]
    );
    
    if (lembreteCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Lembrete não encontrado' });
    }

    // Validar data de vencimento se fornecida
    if (data_vencimento) {
      const dataVencimento = new Date(data_vencimento);
      if (dataVencimento < new Date()) {
        return res.status(400).json({ error: 'Data de vencimento deve ser futura' });
      }
    }
    
    const result = await db.query(
      'UPDATE lembretes SET titulo = COALESCE($1, titulo), descricao = COALESCE($2, descricao), data_vencimento = COALESCE($3, data_vencimento), tipo = COALESCE($4, tipo), ativo = COALESCE($5, ativo) WHERE id = $6 AND userId = $7 RETURNING *',
      [titulo, descricao, data_vencimento, tipo, ativo, lembreteId, userId]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar lembrete' });
  }
});

// Atualizar status do lembrete
router.patch('/:id', async (req, res) => {
  const { ativo, notificado } = req.body;
  const userId = req.user.id;
  const lembreteId = req.params.id;
  
  try {
    // Verificar se o lembrete pertence ao usuário
    const lembreteCheck = await db.query(
      'SELECT * FROM lembretes WHERE id = $1 AND userId = $2',
      [lembreteId, userId]
    );
    
    if (lembreteCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Lembrete não encontrado' });
    }
    
    const result = await db.query(
      'UPDATE lembretes SET ativo = COALESCE($1, ativo), notificado = COALESCE($2, notificado) WHERE id = $3 AND userId = $4 RETURNING *',
      [ativo, notificado, lembreteId, userId]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar status do lembrete' });
  }
});

// Excluir lembrete
router.delete('/:id', async (req, res) => {
  const userId = req.user.id;
  const lembreteId = req.params.id;
  
  try {
    // Verificar se o lembrete pertence ao usuário
    const lembreteCheck = await db.query(
      'SELECT * FROM lembretes WHERE id = $1 AND userId = $2',
      [lembreteId, userId]
    );
    
    if (lembreteCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Lembrete não encontrado' });
    }
    
    await db.query(
      'DELETE FROM lembretes WHERE id = $1 AND userId = $2',
      [lembreteId, userId]
    );
    
    res.json({ message: 'Lembrete excluído com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao excluir lembrete' });
  }
});

export default router;