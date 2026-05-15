import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

// ============================================
// CSRF PROTECTION - DOUBLE SUBMIT COOKIE
// ============================================

// Armazenar tokens CSRF em memória (em produção, usar Redis)
const csrfTokens = new Map();

// Limpar tokens antigos a cada hora
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of csrfTokens.entries()) {
    if (now - data.createdAt > 3600000) { // 1 hora
      csrfTokens.delete(token);
    }
  }
}, 600000); // Verificar a cada 10 minutos

/**
 * Gera um novo token CSRF
 * @returns {string} Token CSRF
 */
export const generateCsrfToken = () => {
  const token = uuidv4();
  csrfTokens.set(token, {
    createdAt: Date.now(),
    used: false
  });
  return token;
};

/**
 * Middleware para servir token CSRF
 */
export const csrfTokenEndpoint = (req, res) => {
  // Apenas GET, sem autenticação obrigatória (para login/register)
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = generateCsrfToken();
  
  // Usar HttpOnly + Secure cookies
  res.cookie('x-csrf-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api',
    maxAge: 3600000 // 1 hora
  });

  res.json({
    csrfToken: token // Também retornar no body para que o JS acesse
  });
};

/**
 * Middleware de validação CSRF para métodos mutáveis
 */
export const validateCsrf = (req, res, next) => {
  // CSRF não é necessário para GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Pega token do header X-CSRF-Token (enviado pelo frontend)
  const tokenFromHeader = req.headers['x-csrf-token'];
  
  // Pega token do cookie (double submit)
  const tokenFromCookie = req.cookies['x-csrf-token'];

  // Ambos devem existir e ser iguais
  if (!tokenFromHeader || !tokenFromCookie || tokenFromHeader !== tokenFromCookie) {
    return res.status(403).json({
      error: 'CSRF token inválido ou ausente'
    });
  }

  // Verificar se o token existe e não foi usado
  const tokenData = csrfTokens.get(tokenFromHeader);
  if (!tokenData) {
    return res.status(403).json({
      error: 'CSRF token expirado'
    });
  }

  // Token pode ser reutilizado por um período de tempo
  // (não marcar como usado - double submit cookie é stateless)

  next();
};

/**
 * Middleware alternativo: CSRF com assinatura (HMAC)
 * Mais seguro que double submit cookie
 */
export const generateCsrfTokenSigned = (secret) => {
  const token = uuidv4();
  const timestamp = Math.floor(Date.now() / 1000);
  const data = `${token}.${timestamp}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('hex');
  
  return `${data}.${signature}`;
};

/**
 * Validar CSRF token assinado
 */
export const validateCsrfSigned = (token, secret, maxAge = 3600) => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    const [tokenId, timestamp, signature] = parts;
    const data = `${tokenId}.${timestamp}`;
    
    // Verificar assinatura
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(data)
      .digest('hex');
    
    if (signature !== expectedSignature) return false;

    // Verificar expiração
    const tokenTime = parseInt(timestamp, 10);
    const now = Math.floor(Date.now() / 1000);
    
    if (now - tokenTime > maxAge) return false;

    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Middleware CSRF com validação de assinatura
 */
export const validateCsrfMiddleware = (secret) => (req, res, next) => {
  // CSRF não é necessário para GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const token = req.headers['x-csrf-token'];

  if (!token) {
    return res.status(403).json({
      error: 'CSRF token ausente'
    });
  }

  if (!validateCsrfSigned(token, secret)) {
    return res.status(403).json({
      error: 'CSRF token inválido ou expirado'
    });
  }

  next();
};

/**
 * Middleware para servir CSRF token assinado
 */
export const csrfTokenEndpointSigned = (secret) => (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = generateCsrfTokenSigned(secret);
  
  res.json({ csrfToken: token });
};

/**
 * Middleware para injetar token no header de response
 * Ajuda o frontend a obter o novo token
 */
export const injectCsrfToken = (req, res, next) => {
  const token = generateCsrfToken();
  res.set('X-CSRF-Token', token);
  next();
};
