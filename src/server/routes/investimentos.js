import express from 'express';
import db from '../db/index.js';

const router = express.Router();

// Obter todos os investimentos do usuário
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { tipo } = req.query;
    
    let query = 'SELECT * FROM investimentos WHERE userId = $1';
    let params = [userId];
    
    if (tipo) {
      query += ' AND tipo = $2';
      params.push(tipo);
    }
    
    query += ' ORDER BY nome';
    
    const result = await db.query(query, params);
    
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar investimentos' });
  }
});

// Obter um investimento específico
router.get('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const investimentoId = req.params.id;
    
    const result = await db.query(
      'SELECT * FROM investimentos WHERE id = $1 AND userId = $2',
      [investimentoId, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Investimento não encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar investimento' });
  }
});

// Criar novo investimento
router.post('/', async (req, res) => {
  const { tipo, nome, valor_aplicado, rendimento_mensal } = req.body;
  const userId = req.user.id;
  
  try {
    // Validar dados
    if (!tipo || !nome || !valor_aplicado || rendimento_mensal === undefined) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }
    
    // Verificar valores positivos
    if (parseFloat(valor_aplicado) <= 0) {
      return res.status(400).json({ error: 'Valor aplicado deve ser maior que zero' });
    }
    
    const result = await db.query(
      'INSERT INTO investimentos (userId, tipo, nome, valor_aplicado, rendimento_mensal) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [userId, tipo, nome, valor_aplicado, rendimento_mensal]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar investimento' });
  }
});

// Atualizar investimento
router.put('/:id', async (req, res) => {
  const { tipo, nome, valor_aplicado, rendimento_mensal } = req.body;
  const userId = req.user.id;
  const investimentoId = req.params.id;
  
  try {
    // Verificar se o investimento pertence ao usuário
    const investimentoCheck = await db.query(
      'SELECT * FROM investimentos WHERE id = $1 AND userId = $2',
      [investimentoId, userId]
    );
    
    if (investimentoCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Investimento não encontrado' });
    }
    
    // Atualizar investimento
    const result = await db.query(
      'UPDATE investimentos SET tipo = $1, nome = $2, valor_aplicado = $3, rendimento_mensal = $4 WHERE id = $5 AND userId = $6 RETURNING *',
      [tipo, nome, valor_aplicado, rendimento_mensal, investimentoId, userId]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar investimento' });
  }
});

// Excluir investimento
router.delete('/:id', async (req, res) => {
  const userId = req.user.id;
  const investimentoId = req.params.id;
  
  try {
    // Verificar se o investimento pertence ao usuário
    const investimentoCheck = await db.query(
      'SELECT * FROM investimentos WHERE id = $1 AND userId = $2',
      [investimentoId, userId]
    );
    
    if (investimentoCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Investimento não encontrado' });
    }
    
    // Excluir investimento
    await db.query(
      'DELETE FROM investimentos WHERE id = $1 AND userId = $2',
      [investimentoId, userId]
    );
    
    res.json({ message: 'Investimento excluído com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao excluir investimento' });
  }
});

export default router;