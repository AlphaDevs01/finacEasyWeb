import express from 'express';
import bcrypt from 'bcryptjs';
import db from '../db/index.js';
import { generateToken } from '../middleware/auth.js';

const router = express.Router();

// Registro de novo usuário
router.post('/register', async (req, res) => {
  const { nome, email, senha } = req.body;
  
  if (!nome || !email || !senha) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
  }
  
  try {
    // Verificar se o email já existe
    const emailCheck = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Email já está em uso' });
    }
    
    // Hash da senha
    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(senha, salt);
    
    // Inserir novo usuário
    const result = await db.query(
      'INSERT INTO users (nome, email, senha_hash) VALUES ($1, $2, $3) RETURNING id, nome, email',
      [nome, email, senhaHash]
    );
    
    // Criar configurações padrão para o usuário
    await db.query(
      'INSERT INTO configuracoes (userId, notificacoes_email, tema) VALUES ($1, $2, $3)',
      [result.rows[0].id, false, 'claro']
    );
    
    // Gerar token JWT
    const token = generateToken(result.rows[0].id);
    
    res.status(201).json({
      message: 'Usuário criado com sucesso',
      user: result.rows[0],
      token
    });
  } catch (error) {
    console.error('Erro ao registrar usuário:', error); // Log detalhado
    res.status(500).json({ error: 'Erro ao registrar usuário', details: error.message });
  }
});

// Login de usuário
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;
  
  if (!email || !senha) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios' });
  }
  
  try {
    // Buscar usuário pelo email
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Email ou senha inválidos' });
    }
    
    const user = result.rows[0];
    
    // Verificar senha
    const senhaValida = await bcrypt.compare(senha, user.senha_hash);
    if (!senhaValida) {
      return res.status(400).json({ error: 'Email ou senha inválidos' });
    }
    
    // Gerar token JWT
    const token = generateToken(user.id);
    
    res.json({
      message: 'Login realizado com sucesso',
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email
      },
      token
    });
  } catch (error) {
    console.error(error); // Isso aparecerá nos logs da Vercel
    res.status(500).json({ error: 'Erro ao realizar login' });
  }
});

export default router;