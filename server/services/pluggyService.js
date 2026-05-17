import axios from 'axios';

const PLUGGY_BASE_URL = process.env.PLUGGY_BASE_URL || 'https://api.pluggy.ai';
const REQUEST_TIMEOUT_MS = Number(process.env.PLUGGY_TIMEOUT_MS || 15000);
const DEBUG_OPENFINANCE = String(process.env.DEBUG_OPENFINANCE || '').toLowerCase() === 'true';

let cachedApiKey = null;
let cachedApiKeyExpiresAt = 0;
let lastPluggyError = null;
let lastPluggyRequest = null;

const http = axios.create({
  baseURL: PLUGGY_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' }
});

const maskValue = (value) => {
  if (value === undefined || value === null) return value;
  const stringValue = String(value);
  if (stringValue.length <= 2) return '***';
  return `${stringValue.slice(0, 1)}***${stringValue.slice(-1)}`;
};

const sanitizeData = (data) => {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(sanitizeData);

  const sensitiveKeys = ['password', 'senha', 'clientSecret', 'secret', 'token', 'apiKey', 'cpf', 'cnpj', 'document', 'username', 'user', 'login'];

  return Object.fromEntries(Object.entries(data).map(([key, value]) => {
    const lowerKey = String(key).toLowerCase();
    if (sensitiveKeys.some((sensitiveKey) => lowerKey.includes(sensitiveKey.toLowerCase()))) {
      return [key, maskValue(value)];
    }
    if (value && typeof value === 'object') return [key, sanitizeData(value)];
    return [key, value];
  }));
};

const summarizeCreateItemPayload = (payload) => ({
  connectorId: payload?.connectorId,
  clientUserId: payload?.clientUserId ? String(payload.clientUserId) : undefined,
  parameterKeys: payload?.parameters && typeof payload.parameters === 'object' && !Array.isArray(payload.parameters)
    ? Object.keys(payload.parameters)
    : [],
  parameterShape: Array.isArray(payload?.parameters) ? 'array' : typeof payload?.parameters
});

const requirePluggyEnv = () => {
  const clientId = process.env.PLUGGY_CLIENT_ID;
  const clientSecret = process.env.PLUGGY_CLIENT_SECRET;

  const isPlaceholder = (value) => !value || String(value).startsWith('replace_with_');

  if (isPlaceholder(clientId) || isPlaceholder(clientSecret)) {
    const error = new Error('Pluggy não configurado no backend. Defina PLUGGY_CLIENT_ID e PLUGGY_CLIENT_SECRET reais no .env/Vercel e reinicie/republique o backend.');
    error.status = 503;
    error.details = {
      hasClientId: Boolean(clientId),
      hasClientSecret: Boolean(clientSecret),
      clientIdLooksPlaceholder: String(clientId || '').startsWith('replace_with_'),
      clientSecretLooksPlaceholder: String(clientSecret || '').startsWith('replace_with_')
    };
    throw error;
  }

  return { clientId, clientSecret };
};

const extractPluggyMessage = (data) => {
  if (!data) return null;
  if (typeof data === 'string') return data;
  if (data.message) return data.message;
  if (data.error) return data.error;
  if (Array.isArray(data.errors)) {
    return data.errors.map((item) => item?.message || item?.msg || JSON.stringify(item)).join('; ');
  }
  return null;
};

const sanitizePluggyError = (error) => {
  const status = error?.response?.status;
  const data = error?.response?.data;
  const pluggyMessage = extractPluggyMessage(data);

  if (status === 400) return pluggyMessage || 'Dados inválidos para conexão Open Finance.';
  if (status === 401 || status === 403) return 'Falha de autenticação com provedor Open Finance.';
  if (status === 404) return 'Recurso Open Finance não encontrado.';
  if (status === 429) return 'Limite de requisições Open Finance excedido. Tente novamente depois.';

  return pluggyMessage || 'Erro ao comunicar com Open Finance.';
};

const requestPluggy = async (config, meta = {}) => {
  const safeRequest = {
    at: new Date().toISOString(),
    method: config?.method,
    url: config?.url,
    params: config?.params,
    timeoutMs: REQUEST_TIMEOUT_MS,
    meta,
    data: meta?.operation === 'createItem'
      ? summarizeCreateItemPayload(config?.data)
      : sanitizeData(config?.data)
  };

  lastPluggyRequest = safeRequest;

  if (DEBUG_OPENFINANCE || meta?.alwaysLog) {
    console.log('Pluggy request debug:', JSON.stringify(safeRequest, null, 2));
  }

  try {
    const response = await http.request(config);
    if (DEBUG_OPENFINANCE || meta?.alwaysLog) {
      console.log('Pluggy response debug:', JSON.stringify({
        at: new Date().toISOString(),
        method: config?.method,
        url: config?.url,
        status: response.status,
        meta
      }, null, 2));
    }
    return response;
  } catch (error) {
    const pluggyPayload = {
      at: new Date().toISOString(),
      status: error?.response?.status,
      data: error?.response?.data,
      method: config?.method,
      url: config?.url,
      meta,
      request: safeRequest
    };

    lastPluggyError = pluggyPayload;

    console.error('Pluggy request failed:', JSON.stringify(pluggyPayload, null, 2));

    const safeMessage = sanitizePluggyError(error);
    const safeError = new Error(safeMessage);
    safeError.status = error?.response?.status || 502;
    safeError.details = pluggyPayload;
    throw safeError;
  }
};

export const getPluggyDiagnostics = () => ({
  baseUrl: PLUGGY_BASE_URL,
  timeoutMs: REQUEST_TIMEOUT_MS,
  debugOpenFinance: DEBUG_OPENFINANCE,
  hasClientId: Boolean(process.env.PLUGGY_CLIENT_ID),
  hasClientSecret: Boolean(process.env.PLUGGY_CLIENT_SECRET),
  clientIdLooksPlaceholder: String(process.env.PLUGGY_CLIENT_ID || '').startsWith('replace_with_'),
  clientSecretLooksPlaceholder: String(process.env.PLUGGY_CLIENT_SECRET || '').startsWith('replace_with_'),
  apiKeyCached: Boolean(cachedApiKey),
  apiKeyExpiresAt: cachedApiKeyExpiresAt ? new Date(cachedApiKeyExpiresAt).toISOString() : null,
  lastPluggyRequest,
  lastPluggyError
});

export const authenticatePluggy = async () => {
  if (cachedApiKey && Date.now() < cachedApiKeyExpiresAt) return cachedApiKey;

  const { clientId, clientSecret } = requirePluggyEnv();
  const response = await requestPluggy({
    method: 'POST',
    url: '/auth',
    data: { clientId, clientSecret }
  }, { operation: 'auth' });

  cachedApiKey = response.data.apiKey;
  cachedApiKeyExpiresAt = Date.now() + 45 * 60 * 1000;
  return cachedApiKey;
};

const authHeaders = async () => ({
  'X-API-KEY': await authenticatePluggy()
});

export const getConnectors = async () => {
  const response = await requestPluggy({
    method: 'GET',
    url: '/connectors',
    headers: await authHeaders()
  }, { operation: 'getConnectors' });

  return (response.data.results || []).filter((connector) =>
    connector.country === 'BR' &&
    Array.isArray(connector.products) &&
    (connector.products.includes('ACCOUNTS') || connector.products.includes('CREDIT_CARDS'))
  );
};

export const getConnectorById = async (connectorId) => {
  const connectors = await getConnectors();
  return connectors.find((connector) => Number(connector.id) === Number(connectorId)) || null;
};

export const createConnectToken = async (itemId) => {
  const data = itemId ? { itemId } : {};
  const response = await requestPluggy({
    method: 'POST',
    url: '/connect_token',
    headers: await authHeaders(),
    data
  }, { operation: 'createConnectToken', itemId: itemId || null });
  return response.data;
};

export const createItem = async ({ connectorId, credentials, clientUserId }) => {
  const payload = {
    connectorId,
    parameters: credentials,
    ...(clientUserId ? { clientUserId: String(clientUserId) } : {})
  };

  const response = await requestPluggy({
    method: 'POST',
    url: '/items',
    headers: await authHeaders(),
    data: payload
  }, {
    operation: 'createItem',
    connectorId,
    clientUserId: clientUserId ? String(clientUserId) : null,
    credentialKeys: credentials && typeof credentials === 'object' ? Object.keys(credentials) : []
  });
  return response.data;
};

export const getItemStatus = async (itemId) => {
  const response = await requestPluggy({
    method: 'GET',
    url: `/items/${encodeURIComponent(itemId)}`,
    headers: await authHeaders()
  }, { operation: 'getItemStatus', itemId });
  return response.data;
};

export const deleteItem = async (itemId) => {
  await requestPluggy({
    method: 'DELETE',
    url: `/items/${encodeURIComponent(itemId)}`,
    headers: await authHeaders()
  }, { operation: 'deleteItem', itemId });
};

export const getAccounts = async (itemId) => {
  const response = await requestPluggy({
    method: 'GET',
    url: '/accounts',
    headers: await authHeaders(),
    params: { itemId }
  }, { operation: 'getAccounts', itemId });
  return response.data.results || [];
};

export const getTransactions = async ({ accountId, from, to }) => {
  const response = await requestPluggy({
    method: 'GET',
    url: '/transactions',
    headers: await authHeaders(),
    params: { accountId, from, to }
  }, { operation: 'getTransactions', accountId, from, to });
  return response.data.results || [];
};

export const getCards = async (itemId) => {
  const response = await requestPluggy({
    method: 'GET',
    url: '/accounts',
    headers: await authHeaders(),
    params: { itemId, type: 'CREDIT' }
  }, { operation: 'getCards', itemId });
  return response.data.results || [];
};

export const getInvestments = async (itemId) => {
  const response = await requestPluggy({
    method: 'GET',
    url: '/investments',
    headers: await authHeaders(),
    params: { itemId }
  }, { operation: 'getInvestments', itemId });
  return response.data.results || [];
};
