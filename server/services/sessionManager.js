import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import db from '../db/index.js';

// ============================================
// SESSION MANAGER - SESSÕES REVOGÁVEIS
// ============================================

/**
 * Cria uma nova sessão de usuário
 * @param {number} userId - ID do usuário
 * @param {string} userAgent - User agent do browser
 * @param {string} ip - IP do cliente
 * @returns {Promise<{accessToken, refreshToken, sessionId}>}
 */
export const createSession = async (userId, userAgent, ip) => {
  const sessionId = crypto.randomBytes(32).toString('hex');
  const jti = crypto.randomBytes(16).toString('hex'); // JWT ID para rastreamento
  
  const accessToken = jwt.sign(
    {
      id: userId,
      jti,
      type: 'access'
    },
    process.env.JWT_SECRET || 'default-secret',
    { expiresIn: '15m' } // Access token curto: 15 minutos
  );

  const refreshToken = jwt.sign(
    {
      id: userId,
      sessionId,
      jti: jti + '-refresh', // JTI diferente para refresh
      type: 'refresh'
    },
    process.env.JWT_SECRET || 'default-secret',
    { expiresIn: '7d' } // Refresh token: 7 dias
  );

  // Hash do refresh token para armazenar no BD (nunca armazenar token em plaintext)
  const refreshTokenHash = crypto
    .createHash('sha256')
    .update(refreshToken)
    .digest('hex');

  // Salvar sessão no banco
  try {
    await db.query(
      `INSERT INTO user_sessions 
       (userId, session_id, jti, refresh_token_hash, user_agent, ip_address, created_at, expires_at, last_used_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW() + INTERVAL '7 days', NOW())`,
      [userId, sessionId, jti, refreshTokenHash, userAgent.substring(0, 255), ip]
    );
  } catch (error) {
    throw new Error('Erro ao criar sessão: ' + error.message);
  }

  return {
    accessToken,
    refreshToken,
    sessionId,
    expiresIn: 900 // 15 minutos em segundos
  };
};

/**
 * Valida um access token
 * @param {string} token - Token a validar
 * @returns {Object} Payload do token
 * @throws {Error} Se token inválido
 */
export const validateAccessToken = (token) => {
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'default-secret',
      { algorithms: ['HS256'] }
    );

    if (decoded.type !== 'access') {
      throw new Error('Token type inválido');
    }

    return decoded;
  } catch (error) {
    throw new Error('Access token inválido: ' + error.message);
  }
};

/**
 * Valida e rotaciona um refresh token
 * @param {string} refreshToken - Refresh token a validar
 * @param {string} userAgent - User agent do cliente
 * @param {string} ip - IP do cliente
 * @returns {Promise<{accessToken, refreshToken, sessionId}>}
 * @throws {Error} Se token inválido ou detectado reuse
 */
export const rotateRefreshToken = async (refreshToken, userAgent, ip) => {
  let decoded;
  
  try {
    decoded = jwt.verify(
      refreshToken,
      process.env.JWT_SECRET || 'default-secret',
      { algorithms: ['HS256'] }
    );
  } catch (error) {
    throw new Error('Refresh token inválido: ' + error.message);
  }

  if (decoded.type !== 'refresh') {
    throw new Error('Token type inválido');
  }

  const userId = decoded.id;
  const sessionId = decoded.sessionId;
  const refreshTokenHash = crypto
    .createHash('sha256')
    .update(refreshToken)
    .digest('hex');

  // Verificar se a sessão existe e está válida
  try {
    const result = await db.query(
      `SELECT * FROM user_sessions 
       WHERE userId = $1 AND session_id = $2 AND expires_at > NOW()`,
      [userId, sessionId]
    );

    if (result.rows.length === 0) {
      throw new Error('Sessão não encontrada ou expirada');
    }

    const session = result.rows[0];

    // Detectar reuse de refresh token - se o hash não combinar, alguém tentou reusar
    // Nota: em implementação real com Redis seria mais rápido
    if (session.refresh_token_hash && session.refresh_token_hash !== refreshTokenHash) {
      // Possível ataque: alguém tentou reusar um token anterior
      // Revogar todas as sessões do usuário
      await db.query(
        'UPDATE user_sessions SET revoked = true WHERE userId = $1',
        [userId]
      );
      
      throw new Error('Possível ataque detectado: token reuse. Todas as sessões foram revogadas.');
    }

    // Verificar se a sessão foi revogada
    if (session.revoked) {
      throw new Error('Sessão revogada');
    }

  } catch (error) {
    throw error;
  }

  // Criar nova sessão (rotação)
  const newSessionId = crypto.randomBytes(32).toString('hex');
  const newJti = crypto.randomBytes(16).toString('hex');

  const newAccessToken = jwt.sign(
    {
      id: userId,
      jti: newJti,
      type: 'access'
    },
    process.env.JWT_SECRET || 'default-secret',
    { expiresIn: '15m' }
  );

  const newRefreshToken = jwt.sign(
    {
      id: userId,
      sessionId: newSessionId,
      jti: newJti + '-refresh',
      type: 'refresh'
    },
    process.env.JWT_SECRET || 'default-secret',
    { expiresIn: '7d' }
  );

  const newRefreshTokenHash = crypto
    .createHash('sha256')
    .update(newRefreshToken)
    .digest('hex');

  // Atualizar sessão anterior para revogada e criar nova
  try {
    await db.query(
      `UPDATE user_sessions 
       SET revoked = true, rotated_at = NOW()
       WHERE userId = $1 AND session_id = $2`,
      [userId, sessionId]
    );

    await db.query(
      `INSERT INTO user_sessions 
       (userId, session_id, jti, refresh_token_hash, user_agent, ip_address, created_at, expires_at, last_used_at, rotated_from)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW() + INTERVAL '7 days', NOW(), $7)`,
      [userId, newSessionId, newJti, newRefreshTokenHash, userAgent.substring(0, 255), ip, sessionId]
    );
  } catch (error) {
    throw new Error('Erro ao rotacionar sessão: ' + error.message);
  }

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    sessionId: newSessionId,
    expiresIn: 900
  };
};

/**
 * Revoga uma sessão
 * @param {number} userId - ID do usuário
 * @param {string} sessionId - Session ID a revogar
 */
export const revokeSession = async (userId, sessionId) => {
  try {
    await db.query(
      `UPDATE user_sessions 
       SET revoked = true, revoked_at = NOW()
       WHERE userId = $1 AND session_id = $2`,
      [userId, sessionId]
    );
  } catch (error) {
    throw new Error('Erro ao revogar sessão: ' + error.message);
  }
};

/**
 * Revoga todas as sessões de um usuário
 * @param {number} userId - ID do usuário
 */
export const revokeAllUserSessions = async (userId) => {
  try {
    await db.query(
      `UPDATE user_sessions 
       SET revoked = true, revoked_at = NOW()
       WHERE userId = $1 AND revoked = false`,
      [userId]
    );
  } catch (error) {
    throw new Error('Erro ao revogar todas as sessões: ' + error.message);
  }
};

/**
 * Obtém sessões ativas de um usuário
 * @param {number} userId - ID do usuário
 * @returns {Promise<Array>}
 */
export const getUserActiveSessions = async (userId) => {
  try {
    const result = await db.query(
      `SELECT session_id, user_agent, ip_address, created_at, last_used_at
       FROM user_sessions
       WHERE userId = $1 AND revoked = false AND expires_at > NOW()
       ORDER BY created_at DESC`,
      [userId]
    );
    return result.rows;
  } catch (error) {
    throw new Error('Erro ao buscar sessões: ' + error.message);
  }
};

/**
 * Cleanup de sessões expiradas (executar periodicamente)
 */
export const cleanupExpiredSessions = async () => {
  try {
    const result = await db.query(
      `DELETE FROM user_sessions 
       WHERE expires_at < NOW() - INTERVAL '30 days'` // Manter histórico por 30 dias
    );
    console.log(`Limpeza de sessões: ${result.rowCount} linhas removidas`);
  } catch (error) {
    console.error('Erro ao limpar sessões expiradas:', error);
  }
};

// Executar cleanup a cada hora
setInterval(cleanupExpiredSessions, 3600000);
