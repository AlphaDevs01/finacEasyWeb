import express from 'express';
import db from '../db/index.js';

const router = express.Router();

// Obter todas as categorias do usuário
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await db.query(
      'SELECT * FROM categorias WHERE userId = $1 AND ativo = true ORDER BY tipo, nome',
      [userId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar categorias' });
  }
});

// Criar nova categoria
router.post('/', async (req, res) => {
  const { nome, tipo, cor, icone, ativo } = req.body;
  const userId = req.user.id;
  
  try {
    if (!nome || !tipo) {
      return res.status(400).json({ error: 'Nome e tipo são obrigatórios' });
    }

    // Verificar se já existe uma categoria com o mesmo nome e tipo
    const existingCategory = await db.query(
      'SELECT * FROM categorias WHERE userId = $1 AND nome = $2 AND tipo = $3',
      [userId, nome, tipo]
    );

    if (existingCategory.rows.length > 0) {
      return res.status(400).json({ error: 'Já existe uma categoria com este nome para este tipo' });
    }
    
    const result = await db.query(
      'INSERT INTO categorias (userId, nome, tipo, cor, icone, ativo) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [userId, nome, tipo, cor || '#3B82F6', icone || '💰', ativo !== false]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar categoria' });
  }
});

// Atualizar categoria
router.put('/:id', async (req, res) => {
  const { nome, tipo, cor, icone, ativo } = req.body;
  const userId = req.user.id;
  const categoriaId = req.params.id;
  
  try {
    // Verificar se a categoria pertence ao usuário
    const categoriaCheck = await db.query(
      'SELECT * FROM categorias WHERE id = $1 AND userId = $2',
      [categoriaId, userId]
    );
    
    if (categoriaCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }

    // Verificar se já existe outra categoria com o mesmo nome e tipo
    if (nome && tipo) {
      const existingCategory = await db.query(
        'SELECT * FROM categorias WHERE userId = $1 AND nome = $2 AND tipo = $3 AND id != $4',
        [userId, nome, tipo, categoriaId]
      );

      if (existingCategory.rows.length > 0) {
        return res.status(400).json({ error: 'Já existe uma categoria com este nome para este tipo' });
      }
    }
    
    const result = await db.query(
      'UPDATE categorias SET nome = COALESCE($1, nome), tipo = COALESCE($2, tipo), cor = COALESCE($3, cor), icone = COALESCE($4, icone), ativo = COALESCE($5, ativo) WHERE id = $6 AND userId = $7 RETURNING *',
      [nome, tipo, cor, icone, ativo, categoriaId, userId]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar categoria' });
  }
});

// Excluir categoria (soft delete)
router.delete('/:id', async (req, res) => {
  const userId = req.user.id;
  const categoriaId = req.params.id;
  
  try {
    // Verificar se a categoria pertence ao usuário
    const categoriaCheck = await db.query(
      'SELECT * FROM categorias WHERE id = $1 AND userId = $2',
      [categoriaId, userId]
    );
    
    if (categoriaCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }

    // Verificar se a categoria está sendo usada
    const usageCheck = await db.query(
      'SELECT COUNT(*) as count FROM (SELECT categoria FROM despesas WHERE userId = $1 AND categoria = $2 UNION ALL SELECT categoria FROM receitas WHERE userId = $1 AND categoria = $2) as usage',
      [userId, categoriaCheck.rows[0].nome]
    );

    if (parseInt(usageCheck.rows[0].count) > 0) {
      // Soft delete - apenas desativar
      await db.query(
        'UPDATE categorias SET ativo = false WHERE id = $1 AND userId = $2',
        [categoriaId, userId]
      );
      
      res.json({ message: 'Categoria desativada com sucesso (ainda em uso por transações existentes)' });
    } else {
      // Hard delete - remover completamente
      await db.query(
        'DELETE FROM categorias WHERE id = $1 AND userId = $2',
        [categoriaId, userId]
      );
      
      res.json({ message: 'Categoria excluída com sucesso' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao excluir categoria' });
  }
});

export default router;