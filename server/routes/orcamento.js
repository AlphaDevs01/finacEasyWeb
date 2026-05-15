import express from 'express';
import db from '../db/index.js';

const router = express.Router();

// Obter orçamento do usuário
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { mes, ano } = req.query;
    
    let query = `
      SELECT o.*, 
             COALESCE(
               CASE 
                 WHEN o.tipo = 'despesa' THEN (
                   SELECT SUM(d.valor) 
                   FROM despesas d 
                   WHERE d.categoria = o.categoria 
                   AND d.userId = o.userId 
                   AND EXTRACT(MONTH FROM d.data) = o.mes 
                   AND EXTRACT(YEAR FROM d.data) = o.ano
                   AND d.status != 'cancelada'
                 )
                 ELSE (
                   SELECT SUM(r.valor) 
                   FROM receitas r 
                   WHERE r.categoria = o.categoria 
                   AND r.userId = o.userId 
                   AND EXTRACT(MONTH FROM r.data) = o.mes 
                   AND EXTRACT(YEAR FROM r.data) = o.ano
                   AND r.status != 'cancelada'
                 )
               END, 0
             ) as valor_gasto
      FROM orcamento o
      WHERE o.userId = $1 AND o.ativo = true
    `;
    let params = [userId];
    
    if (mes && ano) {
      query += ' AND o.mes = $2 AND o.ano = $3';
      params.push(mes, ano);
    }
    
    query += ' ORDER BY o.tipo, o.categoria';
    
    const result = await db.query(query, params);
    
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar orçamento' });
  }
});

// Criar item do orçamento
router.post('/', async (req, res) => {
  const { categoria, valor_planejado, tipo, mes, ano } = req.body;
  const userId = req.user.id;
  
  try {
    if (!categoria || !valor_planejado || !tipo || !mes || !ano) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }
    
    if (parseFloat(valor_planejado) <= 0) {
      return res.status(400).json({ error: 'Valor planejado deve ser maior que zero' });
    }
    
    const result = await db.query(
      'INSERT INTO orcamento (userId, categoria, valor_planejado, tipo, mes, ano) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [userId, categoria, valor_planejado, tipo, mes, ano]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Já existe um item para esta categoria no período' });
    }
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar item do orçamento' });
  }
});

// Atualizar item do orçamento
router.put('/:id', async (req, res) => {
  const { valor_planejado, ativo } = req.body;
  const userId = req.user.id;
  const itemId = req.params.id;
  
  try {
    const itemCheck = await db.query(
      'SELECT * FROM orcamento WHERE id = $1 AND userId = $2',
      [itemId, userId]
    );
    
    if (itemCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Item do orçamento não encontrado' });
    }
    
    const result = await db.query(
      'UPDATE orcamento SET valor_planejado = COALESCE($1, valor_planejado), ativo = COALESCE($2, ativo) WHERE id = $3 AND userId = $4 RETURNING *',
      [valor_planejado, ativo, itemId, userId]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar item do orçamento' });
  }
});

// Excluir item do orçamento
router.delete('/:id', async (req, res) => {
  const userId = req.user.id;
  const itemId = req.params.id;
  
  try {
    const itemCheck = await db.query(
      'SELECT * FROM orcamento WHERE id = $1 AND userId = $2',
      [itemId, userId]
    );
    
    if (itemCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Item do orçamento não encontrado' });
    }
    
    await db.query(
      'DELETE FROM orcamento WHERE id = $1 AND userId = $2',
      [itemId, userId]
    );
    
    res.json({ message: 'Item do orçamento excluído com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao excluir item do orçamento' });
  }
});

export default router;