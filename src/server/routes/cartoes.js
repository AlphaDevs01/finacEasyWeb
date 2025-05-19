import express from 'express';
import db from '../db/index.js';

const router = express.Router();

// Obter todos os cartões do usuário
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await db.query(
      'SELECT * FROM cartoes WHERE userId = $1 ORDER BY nome',
      [userId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar cartões' });
  }
});

// Obter um cartão específico
router.get('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const cartaoId = req.params.id;
    
    const result = await db.query(
      'SELECT * FROM cartoes WHERE id = $1 AND userId = $2',
      [cartaoId, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cartão não encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar cartão' });
  }
});

// Criar novo cartão
router.post('/', async (req, res) => {
  const { nome, numero, limite, data_fechamento, data_vencimento } = req.body;
  const userId = req.user.id;
  
  try {
    // Validar dados
    if (!nome || !numero || !limite || !data_fechamento || !data_vencimento) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }
    
    // Garantir que apenas os últimos 4 dígitos sejam armazenados
    const ultimosDigitos = numero.toString().slice(-4);
    
    const result = await db.query(
      'INSERT INTO cartoes (userId, nome, numero, limite, data_fechamento, data_vencimento) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [userId, nome, ultimosDigitos, limite, data_fechamento, data_vencimento]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar cartão' });
  }
});

// Atualizar cartão
router.put('/:id', async (req, res) => {
  const { nome, limite, data_fechamento, data_vencimento } = req.body;
  const userId = req.user.id;
  const cartaoId = req.params.id;
  
  try {
    // Verificar se o cartão pertence ao usuário
    const cartaoCheck = await db.query(
      'SELECT * FROM cartoes WHERE id = $1 AND userId = $2',
      [cartaoId, userId]
    );
    
    if (cartaoCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Cartão não encontrado' });
    }
    
    // Atualizar cartão
    const result = await db.query(
      'UPDATE cartoes SET nome = $1, limite = $2, data_fechamento = $3, data_vencimento = $4 WHERE id = $5 AND userId = $6 RETURNING *',
      [nome, limite, data_fechamento, data_vencimento, cartaoId, userId]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar cartão' });
  }
});

// Excluir cartão
router.delete('/:id', async (req, res) => {
  const userId = req.user.id;
  const cartaoId = req.params.id;
  
  try {
    // Verificar se o cartão pertence ao usuário
    const cartaoCheck = await db.query(
      'SELECT * FROM cartoes WHERE id = $1 AND userId = $2',
      [cartaoId, userId]
    );
    
    if (cartaoCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Cartão não encontrado' });
    }
    
    // Excluir cartão (as faturas e despesas relacionadas serão excluídas automaticamente devido às constraints ON DELETE CASCADE)
    await db.query(
      'DELETE FROM cartoes WHERE id = $1 AND userId = $2',
      [cartaoId, userId]
    );
    
    res.json({ message: 'Cartão excluído com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao excluir cartão' });
  }
});

export default router;