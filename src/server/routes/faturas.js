import express from 'express';
import db from '../db/index.js';
import { authenticateToken } from '../middleware/auth.js'; // Corrija o import

const router = express.Router();

// Aplica o middleware de autenticação a todas as rotas deste router
router.use(authenticateToken);

// Obter todas as faturas do usuário
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await db.query(
      `SELECT f.*, c.nome as cartao_nome 
       FROM faturas f 
       JOIN cartoes c ON f.cartaoId = c.id 
       WHERE f.userId = $1 
       ORDER BY f.ano_referencia DESC, f.mes_referencia DESC`,
      [userId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar faturas' });
  }
});

// Obter faturas de um cartão específico
router.get('/cartao/:cartaoId', async (req, res) => {
  try {
    const userId = req.user.id;
    const cartaoId = req.params.cartaoId;
    
    // Verificar se o cartão pertence ao usuário
    const cartaoCheck = await db.query(
      'SELECT * FROM cartoes WHERE id = $1 AND userId = $2',
      [cartaoId, userId]
    );
    
    if (cartaoCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Cartão não encontrado' });
    }
    
    const result = await db.query(
      `SELECT f.*, c.nome as cartao_nome 
       FROM faturas f 
       JOIN cartoes c ON f.cartaoId = c.id 
       WHERE f.cartaoId = $1 AND f.userId = $2 
       ORDER BY f.ano_referencia DESC, f.mes_referencia DESC`,
      [cartaoId, userId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar faturas do cartão' });
  }
});

// Obter uma fatura específica com suas despesas
router.get('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const faturaId = req.params.id;
    
    // Buscar fatura
    const faturaResult = await db.query(
      `SELECT f.*, c.nome as cartao_nome 
       FROM faturas f 
       JOIN cartoes c ON f.cartaoId = c.id 
       WHERE f.id = $1 AND f.userId = $2`,
      [faturaId, userId]
    );
    
    if (faturaResult.rows.length === 0) {
      return res.status(404).json({ error: 'Fatura não encontrada' });
    }
    
    // Buscar despesas da fatura
    const despesasResult = await db.query(
      'SELECT * FROM despesas WHERE faturaId = $1 AND userId = $2 ORDER BY data DESC',
      [faturaId, userId]
    );
    
    const fatura = faturaResult.rows[0];
    fatura.despesas = despesasResult.rows;
    
    res.json(fatura);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar fatura' });
  }
});

// Criar nova fatura
router.post('/', async (req, res) => {
  const { cartaoId, mes_referencia, ano_referencia, valor_total, status } = req.body;
  const userId = req.user.id;
  
  try {
    // Validar dados
    // Corrigido: valor_total pode ser zero, então use checagem explícita de undefined/null
    if (
      !cartaoId ||
      !mes_referencia ||
      !ano_referencia ||
      valor_total === undefined ||
      valor_total === null ||
      !status
    ) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }
    
    // Verificar se o cartão pertence ao usuário
    const cartaoCheck = await db.query(
      'SELECT * FROM cartoes WHERE id = $1 AND userId = $2',
      [cartaoId, userId]
    );
    
    if (cartaoCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Cartão não encontrado' });
    }
    
    // Verificar se já existe fatura para este mês/ano/cartão
    const faturaCheck = await db.query(
      'SELECT * FROM faturas WHERE cartaoId = $1 AND mes_referencia = $2 AND ano_referencia = $3 AND userId = $4',
      [cartaoId, mes_referencia, ano_referencia, userId]
    );
    
    if (faturaCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Já existe uma fatura para este mês/ano' });
    }
    
    const result = await db.query(
      'INSERT INTO faturas (userId, cartaoId, mes_referencia, ano_referencia, valor_total, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [userId, cartaoId, mes_referencia, ano_referencia, valor_total, status]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar fatura' });
  }
});

// Atualizar fatura
router.put('/:id', async (req, res) => {
  const { valor_total, status } = req.body;
  const userId = req.user.id;
  const faturaId = req.params.id;
  
  try {
    // Verificar se a fatura pertence ao usuário
    const faturaCheck = await db.query(
      'SELECT * FROM faturas WHERE id = $1 AND userId = $2',
      [faturaId, userId]
    );
    
    if (faturaCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Fatura não encontrada' });
    }
    
    // Atualizar fatura
    const result = await db.query(
      'UPDATE faturas SET valor_total = $1, status = $2 WHERE id = $3 AND userId = $4 RETURNING *',
      [valor_total, status, faturaId, userId]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar fatura' });
  }
});

// Excluir fatura
router.delete('/:id', async (req, res) => {
  const userId = req.user.id;
  const faturaId = req.params.id;
  
  try {
    // Verificar se a fatura pertence ao usuário
    const faturaCheck = await db.query(
      'SELECT * FROM faturas WHERE id = $1 AND userId = $2',
      [faturaId, userId]
    );
    
    if (faturaCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Fatura não encontrada' });
    }
    
    // Excluir fatura
    await db.query(
      'DELETE FROM faturas WHERE id = $1 AND userId = $2',
      [faturaId, userId]
    );
    
    res.json({ message: 'Fatura excluída com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao excluir fatura' });
  }
});

export default router;