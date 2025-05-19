import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Acesso negado' });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'sua_chave_secreta');
    req.user = verified;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Token inválido' });
  }
};

export const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'sua_chave_secreta', { expiresIn: '1d' });
};