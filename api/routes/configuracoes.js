import express from 'express';
import bcrypt from 'bcryptjs';
import db from '../db/index.js';

const router = express.Router();

// Obter configurações do usuário
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await db.query(
      'SELECT * FROM configuracoes WHERE userId = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      // Criar configurações padrão se não existirem
      const defaultConfig = await db.query(
        'INSERT INTO configuracoes (userId, notificacoes_email, tema) VALUES ($1, $2, $3) RETURNING *',
        [userId, false, 'claro']
      );
      
      return res.json(defaultConfig.rows[0]);
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar configurações' });
  }
});

// Atualizar configurações
router.put('/', async (req, res) => {
  const { notificacoes_email, tema } = req.body;
  const userId = req.user.id;
  
  try {
    // Verificar se as configurações existem
    const configCheck = await db.query(
      'SELECT * FROM configuracoes WHERE userId = $1',
      [userId]
    );
    
    if (configCheck.rows.length === 0) {
      // Criar configurações se não existirem
      const result = await db.query(
        'INSERT INTO configuracoes (userId, notificacoes_email, tema) VALUES ($1, $2, $3) RETURNING *',
        [userId, notificacoes_email, tema]
      );
      
      return res.json(result.rows[0]);
    }
    
    // Atualizar configurações
    const result = await db.query(
      'UPDATE configuracoes SET notificacoes_email = $1, tema = $2 WHERE userId = $3 RETURNING *',
      [notificacoes_email, tema, userId]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar configurações' });
  }
});

// Atualizar dados do usuário
router.put('/usuario', async (req, res) => {
  const { nome, email } = req.body;
  const userId = req.user.id;
  
  try {
    // Verificar se o email já está em uso por outro usuário
    if (email) {
      const emailCheck = await db.query(
        'SELECT * FROM users WHERE email = $1 AND id != $2',
        [email, userId]
      );
      
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Email já está em uso por outro usuário' });
      }
    }
    
    // Atualizar usuário
    const result = await db.query(
      'UPDATE users SET nome = COALESCE($1, nome), email = COALESCE($2, email) WHERE id = $3 RETURNING id, nome, email',
      [nome, email, userId]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar dados do usuário' });
  }
});

// Atualizar senha do usuário
router.put('/senha', async (req, res) => {
  const { senha_atual, nova_senha } = req.body;
  const userId = req.user.id;
  
  if (!senha_atual || !nova_senha) {
    return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias' });
  }
  
  try {
    // Buscar usuário
    const userResult = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];
    
    // Verificar senha atual
    const senhaValida = await bcrypt.compare(senha_atual, user.senha_hash);
    if (!senhaValida) {
      return res.status(400).json({ error: 'Senha atual incorreta' });
    }
    
    // Hash da nova senha
    const salt = await bcrypt.genSalt(10);
    const novaSenhaHash = await bcrypt.hash(nova_senha, salt);
    
    // Atualizar senha
    await db.query(
      'UPDATE users SET senha_hash = $1 WHERE id = $2',
      [novaSenhaHash, userId]
    );
    
    res.json({ message: 'Senha atualizada com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar senha' });
  }
});

export default router;