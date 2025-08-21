import express from 'express';
import db from '../db/index.js';

const router = express.Router();

// Obter notificações do usuário
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { lida } = req.query;
    
    let query = 'SELECT * FROM notificacoes WHERE userId = $1';
    let params = [userId];
    
    if (lida !== undefined) {
      query += ' AND lida = $2';
      params.push(lida === 'true');
    }
    
    query += ' ORDER BY data_criacao DESC LIMIT 50';
    
    const result = await db.query(query, params);
    
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar notificações' });
  }
});

// Marcar notificação como lida
router.patch('/:id/lida', async (req, res) => {
  const userId = req.user.id;
  const notificacaoId = req.params.id;
  
  try {
    const result = await db.query(
      'UPDATE notificacoes SET lida = true WHERE id = $1 AND userId = $2 RETURNING *',
      [notificacaoId, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notificação não encontrada' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao marcar notificação como lida' });
  }
});

// Marcar todas as notificações como lidas
router.patch('/marcar-todas-lidas', async (req, res) => {
  const userId = req.user.id;
  
  try {
    await db.query(
      'UPDATE notificacoes SET lida = true WHERE userId = $1 AND lida = false',
      [userId]
    );
    
    res.json({ message: 'Todas as notificações foram marcadas como lidas' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao marcar notificações como lidas' });
  }
});

// Criar notificação (função interna)
export const criarNotificacao = async (userId, tipo, titulo, mensagem) => {
  try {
    await db.query(
      'INSERT INTO notificacoes (userId, tipo, titulo, mensagem) VALUES ($1, $2, $3, $4)',
      [userId, tipo, titulo, mensagem]
    );
  } catch (error) {
    console.error('Erro ao criar notificação:', error);
  }
};

export default router;