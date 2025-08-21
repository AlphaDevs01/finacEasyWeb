import express from 'express';
import db from '../db/index.js';

const router = express.Router();

// Obter todas as despesas do usuário
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { mes, ano, categoria } = req.query;
    
    let query = 'SELECT * FROM despesas WHERE userId = $1';
    let params = [userId];
    
    // Adicionar filtros
    if (mes && ano) {
      query += ' AND EXTRACT(MONTH FROM data) = $2 AND EXTRACT(YEAR FROM data) = $3';
      params.push(mes, ano);
      
      if (categoria) {
        query += ' AND categoria = $4';
        params.push(categoria);
      }
    } else if (categoria) {
      query += ' AND categoria = $2';
      params.push(categoria);
    }
    
    query += ' ORDER BY data DESC';
    
    const result = await db.query(query, params);
    
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar despesas' });
  }
});

// Obter uma despesa específica
router.get('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const despesaId = req.params.id;
    
    const result = await db.query(
      'SELECT * FROM despesas WHERE id = $1 AND userId = $2',
      [despesaId, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Despesa não encontrada' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar despesa' });
  }
});

// Criar nova despesa
router.post('/', async (req, res) => {
  const { descricao, valor, data, tipo, cartaoId, faturaId, categoria, status, data_vencimento, observacoes } = req.body;
  const userId = req.user.id;
  
  try {
    // Validar dados
    if (!descricao || !valor || !data || !tipo || !categoria) {
      return res.status(400).json({ error: 'Campos obrigatórios não preenchidos' });
    }
    
    // Verificar valor positivo
    if (parseFloat(valor) <= 0) {
      return res.status(400).json({ error: 'Valor deve ser maior que zero' });
    }
    
    // Verificar cartão se tipo for 'cartao'
    if (tipo === 'cartao' && !cartaoId) {
      return res.status(400).json({ error: 'Cartão é obrigatório para despesas no cartão' });
    }
    
    // Se cartão e fatura especificados, verificar se pertencem ao usuário
    if (cartaoId) {
      const cartaoCheck = await db.query(
        'SELECT * FROM cartoes WHERE id = $1 AND userId = $2',
        [cartaoId, userId]
      );
      
      if (cartaoCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Cartão não encontrado' });
      }
    }
    
    if (faturaId) {
      const faturaCheck = await db.query(
        'SELECT * FROM faturas WHERE id = $1 AND userId = $2',
        [faturaId, userId]
      );
      
      if (faturaCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Fatura não encontrada' });
      }
    }
    
    const result = await db.query(
      'INSERT INTO despesas (userId, descricao, valor, data, tipo, cartaoId, faturaId, categoria, status, data_vencimento, observacoes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
      [userId, descricao, valor, data, tipo, cartaoId || null, faturaId || null, categoria, status || 'pendente', data_vencimento || null, observacoes || null]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar despesa' });
  }
});

// Atualizar despesa
router.put('/:id', async (req, res) => {
  const { descricao, valor, data, tipo, cartaoId, faturaId, categoria, status, data_vencimento, observacoes } = req.body;
  const userId = req.user.id;
  const despesaId = req.params.id;
  
  try {
    // Verificar se a despesa pertence ao usuário
    const despesaCheck = await db.query(
      'SELECT * FROM despesas WHERE id = $1 AND userId = $2',
      [despesaId, userId]
    );
    
    if (despesaCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Despesa não encontrada' });
    }
    
    // Verificar cartão e fatura se especificados
    if (cartaoId) {
      const cartaoCheck = await db.query(
        'SELECT * FROM cartoes WHERE id = $1 AND userId = $2',
        [cartaoId, userId]
      );
      
      if (cartaoCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Cartão não encontrado' });
      }
    }
    
    if (faturaId) {
      const faturaCheck = await db.query(
        'SELECT * FROM faturas WHERE id = $1 AND userId = $2',
        [faturaId, userId]
      );
      
      if (faturaCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Fatura não encontrada' });
      }
    }
    
    // Atualizar despesa
    const result = await db.query(
      'UPDATE despesas SET descricao = $1, valor = $2, data = $3, tipo = $4, cartaoId = $5, faturaId = $6, categoria = $7, status = $8, data_vencimento = $9, observacoes = $10 WHERE id = $11 AND userId = $12 RETURNING *',
      [descricao, valor, data, tipo, cartaoId || null, faturaId || null, categoria, status || 'pendente', data_vencimento || null, observacoes || null, despesaId, userId]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar despesa' });
  }
});

// Atualizar status da despesa
router.patch('/:id/status', async (req, res) => {
  const { status } = req.body;
  const userId = req.user.id;
  const despesaId = req.params.id;
  
  try {
    // Verificar se a despesa pertence ao usuário
    const despesaCheck = await db.query(
      'SELECT * FROM despesas WHERE id = $1 AND userId = $2',
      [despesaId, userId]
    );
    
    if (despesaCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Despesa não encontrada' });
    }
    
    // Atualizar status
    const result = await db.query(
      'UPDATE despesas SET status = $1 WHERE id = $2 AND userId = $3 RETURNING *',
      [status, despesaId, userId]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar status da despesa' });
  }
});

// Excluir despesa
router.delete('/:id', async (req, res) => {
  const userId = req.user.id;
  const despesaId = req.params.id;
  
  try {
    // Verificar se a despesa pertence ao usuário
    const despesaCheck = await db.query(
      'SELECT * FROM despesas WHERE id = $1 AND userId = $2',
      [despesaId, userId]
    );
    
    if (despesaCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Despesa não encontrada' });
    }
    
    // Excluir despesa
    await db.query(
      'DELETE FROM despesas WHERE id = $1 AND userId = $2',
      [despesaId, userId]
    );
    
    res.json({ message: 'Despesa excluída com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao excluir despesa' });
  }
});

export default router;