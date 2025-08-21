import express from 'express';
import db from '../db/index.js';

const router = express.Router();

// Obter todas as receitas do usuário
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { mes, ano, categoria } = req.query;
    
    let query = 'SELECT * FROM receitas WHERE userId = $1';
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
    res.status(500).json({ error: 'Erro ao buscar receitas' });
  }
});

// Obter uma receita específica
router.get('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const receitaId = req.params.id;
    
    const result = await db.query(
      'SELECT * FROM receitas WHERE id = $1 AND userId = $2',
      [receitaId, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Receita não encontrada' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar receita' });
  }
});

// Criar nova receita
router.post('/', async (req, res) => {
  const { descricao, valor, data, categoria, status, data_vencimento, observacoes } = req.body;
  const userId = req.user.id;
  
  try {
    // Validar dados
    if (!descricao || !valor || !data || !categoria) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }
    
    // Verificar valor positivo
    if (parseFloat(valor) <= 0) {
      return res.status(400).json({ error: 'Valor deve ser maior que zero' });
    }
    
    const result = await db.query(
      'INSERT INTO receitas (userId, descricao, valor, data, categoria, status, data_vencimento, observacoes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [userId, descricao, valor, data, categoria, status || 'pendente', data_vencimento || null, observacoes || null]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar receita' });
  }
});

// Atualizar receita
router.put('/:id', async (req, res) => {
  const { descricao, valor, data, categoria, status, data_vencimento, observacoes } = req.body;
  const userId = req.user.id;
  const receitaId = req.params.id;
  
  try {
    // Verificar se a receita pertence ao usuário
    const receitaCheck = await db.query(
      'SELECT * FROM receitas WHERE id = $1 AND userId = $2',
      [receitaId, userId]
    );
    
    if (receitaCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Receita não encontrada' });
    }
    
    // Atualizar receita
    const result = await db.query(
      'UPDATE receitas SET descricao = $1, valor = $2, data = $3, categoria = $4, status = $5, data_vencimento = $6, observacoes = $7 WHERE id = $8 AND userId = $9 RETURNING *',
      [descricao, valor, data, categoria, status || 'pendente', data_vencimento || null, observacoes || null, receitaId, userId]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar receita' });
  }
});

// Atualizar status da receita
router.patch('/:id/status', async (req, res) => {
  const { status } = req.body;
  const userId = req.user.id;
  const receitaId = req.params.id;
  
  try {
    // Verificar se a receita pertence ao usuário
    const receitaCheck = await db.query(
      'SELECT * FROM receitas WHERE id = $1 AND userId = $2',
      [receitaId, userId]
    );
    
    if (receitaCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Receita não encontrada' });
    }
    
    // Atualizar status
    const result = await db.query(
      'UPDATE receitas SET status = $1 WHERE id = $2 AND userId = $3 RETURNING *',
      [status, receitaId, userId]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar status da receita' });
  }
});

// Excluir receita
router.delete('/:id', async (req, res) => {
  const userId = req.user.id;
  const receitaId = req.params.id;
  
  try {
    // Verificar se a receita pertence ao usuário
    const receitaCheck = await db.query(
      'SELECT * FROM receitas WHERE id = $1 AND userId = $2',
      [receitaId, userId]
    );
    
    if (receitaCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Receita não encontrada' });
    }
    
    // Excluir receita
    await db.query(
      'DELETE FROM receitas WHERE id = $1 AND userId = $2',
      [receitaId, userId]
    );
    
    res.json({ message: 'Receita excluída com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao excluir receita' });
  }
});

export default router;