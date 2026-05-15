import rateLimit from 'express-rate-limit';

// ============================================
// RATE LIMITERS
// ============================================

// Rate limit genérico por IP
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requisições por IP
  message: 'Muitas requisições deste IP, tente novamente mais tarde.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'development'
});

// Login: proteção contra brute force
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 tentativas por IP
  message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Não conta sucessos
  keyGenerator: (req) => {
    // Usar email + IP como chave para login
    return req.body?.email ? `${req.body.email}-${req.ip}` : req.ip;
  }
});

// Register: proteção contra criação de contas em massa
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5, // 5 registros por IP por hora
  message: 'Muitas contas criadas. Tente novamente em 1 hora.',
  standardHeaders: true,
  legacyHeaders: false
});

// Forgot Password: proteção contra enumeração de emails
export const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // 3 requisições por email por hora
  message: 'Muitas tentativas. Tente novamente em 1 hora.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Usar email como chave
    return req.body?.email ? `forgot-${req.body.email}` : req.ip;
  }
});

// Reset Password: proteção contra força bruta
export const resetPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5, // 5 tentativas por IP por hora
  message: 'Muitas tentativas de reset. Tente novamente em 1 hora.',
  standardHeaders: true,
  legacyHeaders: false
});

// Import de dados: limite de requisições
export const importLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10, // 10 importações por usuário por hora
  message: 'Limite de importações atingido. Tente novamente em 1 hora.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Usar userId se autenticado, senão IP
    return req.user?.id ? `import-${req.user.id}` : `import-${req.ip}`;
  }
});

// Backup export: limite de requisições
export const backupExportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5, // 5 exports por usuário por hora
  message: 'Limite de exports atingido. Tente novamente em 1 hora.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?.id ? `backup-export-${req.user.id}` : `backup-export-${req.ip}`;
  }
});

// Backup import/restore
export const backupImportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // 3 imports por usuário por hora
  message: 'Limite de restores atingido. Tente novamente em 1 hora.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?.id ? `backup-import-${req.user.id}` : `backup-import-${req.ip}`;
  }
});

// Open Finance sync: limite de sincronizações
export const openFinanceSyncLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutos
  max: 2, // 2 sincronizações por usuário a cada 10 minutos
  message: 'Muitas sincronizações. Aguarde 10 minutos.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?.id ? `ofinance-sync-${req.user.id}` : `ofinance-sync-${req.ip}`;
  }
});

// Webhook: proteção contra spam
export const webhookLimiter = rateLimit({
  windowMs: 1000, // 1 segundo
  max: 100, // 100 webhooks por segundo globalmente
  message: 'Webhook rate limit exceeded',
  standardHeaders: true,
  legacyHeaders: false
});

// Limite de tamanho de payload por rota
export const bodySizeLimits = {
  default: '1mb',
  import: '10mb',
  backup: '50mb',
  api: '1mb'
};

// Middleware para validar tamanho de payload por rota
export const validatePayloadSize = (maxSize) => (req, res, next) => {
  const contentLength = parseInt(req.headers['content-length'], 10);
  
  if (isNaN(contentLength)) {
    return next();
  }
  
  const maxBytes = parseFloat(maxSize) * (maxSize.includes('mb') ? 1024 * 1024 : 1024);
  
  if (contentLength > maxBytes) {
    return res.status(413).json({
      error: `Payload excede o tamanho máximo de ${maxSize}`
    });
  }
  
  next();
};

// Middleware para timeout em requisições
export const requestTimeout = (seconds) => (req, res, next) => {
  req.setTimeout(seconds * 1000, () => {
    res.status(408).json({ error: 'Requisição excedeu o tempo limite' });
  });
  next();
};
