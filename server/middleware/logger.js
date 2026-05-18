import pino from 'pino';
import { v4 as uuidv4 } from 'uuid';

// ============================================
// LOGGER ESTRUTURADO COM PINO
// ============================================

// Configurar Pino
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' 
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname'
        }
      }
    : undefined,
  // Redação de dados sensíveis
  redact: {
    paths: [
      'password',
      'senha',
      'token',
      'accessToken',
      'refreshToken',
      'apiKey',
      'clientSecret',
      'connectionToken',
      'req.headers.authorization',
      'req.headers.cookie',
      'req.cookies',
      'req.body.password',
      'req.body.senha',
      'req.body.token',
      'cpf',
      'cnpj',
      'creditCard'
    ],
    remove: true
  }
});

// Middleware para adicionar correlationId
export const correlationIdMiddleware = (req, res, next) => {
  req.correlationId = req.headers['x-correlation-id'] || uuidv4();
  res.setHeader('x-correlation-id', req.correlationId);
  
  req.logger = logger.child({
    correlationId: req.correlationId,
    userId: req.user?.id,
    endpoint: `${req.method} ${req.path}`
  });
  
  // Log do request
  req.logger.info({
    msg: 'incoming request',
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  
  // Registrar response
  const originalJson = res.json;
  res.json = function(data) {
    res.locals.data = data;
    return originalJson.call(this, data);
  };
  
  res.on('finish', () => {
    req.logger.info({
      msg: 'outgoing response',
      statusCode: res.statusCode,
      duration: res.getHeader('x-response-time') || 'unknown'
    });
  });
  
  next();
};

// Logging de eventos sensíveis (auditoria)
export const auditLog = {
  // Login
  login: (userId, email, ip, success = true) => {
    logger.info({
      msg: 'user_login',
      userId,
      email,
      ip,
      success,
      timestamp: new Date().toISOString()
    });
  },
  
  // Logout
  logout: (userId, ip) => {
    logger.info({
      msg: 'user_logout',
      userId,
      ip,
      timestamp: new Date().toISOString()
    });
  },
  
  // Mudança de senha
  passwordChange: (userId, ip) => {
    logger.info({
      msg: 'password_changed',
      userId,
      ip,
      timestamp: new Date().toISOString()
    });
  },
  
  // Importação
  dataImport: (userId, tipo, quantidade, status, error = null) => {
    logger.info({
      msg: 'data_imported',
      userId,
      tipo,
      quantidade,
      status,
      error: error ? error.substring(0, 100) : null, // Sanitizar
      timestamp: new Date().toISOString()
    });
  },
  
  // Exportação/Backup
  dataExport: (userId, tipo) => {
    logger.info({
      msg: 'data_exported',
      userId,
      tipo,
      timestamp: new Date().toISOString()
    });
  },
  
  // Open Finance
  
  // Webhook recebido
  webhookReceived: (source, eventType, correlationId, verified = false) => {
    logger.info({
      msg: 'webhook_received',
      source,
      eventType,
      correlationId,
      verified,
      timestamp: new Date().toISOString()
    });
  },
  
  // Alteração de dados críticos
  dataModification: (userId, type, recordId, action) => {
    logger.info({
      msg: 'data_modified',
      userId,
      type,
      recordId,
      action, // 'create', 'update', 'delete'
      timestamp: new Date().toISOString()
    });
  }
};

// Logging de erros com contexto
export const logError = (logger, error, context = {}) => {
  const errorLog = {
    msg: 'error_occurred',
    error: error.message,
    stack: error.stack ? error.stack.substring(0, 500) : null,
    code: error.code,
    status: error.status,
    ...context
  };
  
  // Nunca logar stack de database error ou query SQL
  if (error.message && (error.message.includes('SQL') || error.message.includes('SELECT'))) {
    errorLog.error = 'Database error occurred';
    delete errorLog.stack;
  }
  
  logger.error(errorLog);
};

export default logger;
