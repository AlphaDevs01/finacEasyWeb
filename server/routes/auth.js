import express from 'express';
import bcrypt from 'bcryptjs';
import db from '../db/index.js';
import { authenticateToken, generateToken } from '../middleware/auth.js';
import { cookieOptions } from '../config/security.js';
import { validate, authSchemas } from '../utils/validation.js';

const router = express.Router();

const publicUser = (user) => ({ id: user.id, nome: user.nome, email: user.email });

router.post('/register', validate(authSchemas.register), async (req, res) => {
  const { nome, email, senha } = req.body;

  try {
    const emailCheck = await db.query('SELECT 1 FROM users WHERE email = $1', [email]);
    if (emailCheck.rows.length > 0) {
      return res.status(409).json({ error: 'Email já está em uso' });
    }

    const senhaHash = await bcrypt.hash(senha, 12);
    const result = await db.query(
      'INSERT INTO users (nome, email, senha_hash) VALUES ($1, $2, $3) RETURNING id, nome, email',
      [nome, email, senhaHash]
    );

    await db.query(
      'INSERT INTO configuracoes (userId, notificacoes_email, tema) VALUES ($1, $2, $3) ON CONFLICT (userId) DO NOTHING',
      [result.rows[0].id, false, 'claro']
    );

    const token = generateToken(result.rows[0].id);
    res.cookie('access_token', token, cookieOptions);

    return res.status(201).json({
      message: 'Usuário criado com sucesso',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    return res.status(500).json({ error: 'Erro ao registrar usuário' });
  }
});

router.post('/login', validate(authSchemas.login), async (req, res) => {
  const { email, senha } = req.body;

  try {
    const result = await db.query('SELECT id, nome, email, senha_hash FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    const user = result.rows[0];
    const senhaValida = await bcrypt.compare(senha, user.senha_hash);
    if (!senhaValida) {
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    const token = generateToken(user.id);
    res.cookie('access_token', token, cookieOptions);

    return res.json({
      message: 'Login realizado com sucesso',
      user: publicUser(user)
    });
  } catch (error) {
    console.error('Erro ao realizar login:', error);
    return res.status(500).json({ error: 'Erro ao realizar login' });
  }
});

router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await db.query('SELECT id, nome, email FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Usuário não encontrado' });
    return res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Erro ao buscar usuário autenticado:', error);
    return res.status(500).json({ error: 'Erro ao buscar usuário autenticado' });
  }
});

router.post('/logout', (_req, res) => {
  res.clearCookie('access_token', { ...cookieOptions, maxAge: undefined });
  return res.json({ message: 'Logout realizado com sucesso' });
});

export default router;
