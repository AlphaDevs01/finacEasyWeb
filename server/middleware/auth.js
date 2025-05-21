import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Acesso negado' });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'dd59d6bec5bb7426b5fd2427cbeeb79dfe67e60bf9dedab06bc96fe037d105af');
    req.user = verified;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Token inválido' });
  }
};

export const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'dd59d6bec5bb7426b5fd2427cbeeb79dfe67e60bf9dedab06bc96fe037d105af', { expiresIn: '1d' });
};