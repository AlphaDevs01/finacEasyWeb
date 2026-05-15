import axios from 'axios';

const PLUGGY_BASE_URL = process.env.PLUGGY_BASE_URL || 'https://api.pluggy.ai';
const REQUEST_TIMEOUT_MS = Number(process.env.PLUGGY_TIMEOUT_MS || 15000);

let cachedApiKey = null;
let cachedApiKeyExpiresAt = 0;

const http = axios.create({
  baseURL: PLUGGY_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' }
});

const requirePluggyEnv = () => {
  const clientId = process.env.PLUGGY_CLIENT_ID;
  const clientSecret = process.env.PLUGGY_CLIENT_SECRET;

  const isPlaceholder = (value) => !value || String(value).startsWith('replace_with_');

  if (isPlaceholder(clientId) || isPlaceholder(clientSecret)) {
    const error = new Error('Pluggy não configurado no backend. Defina PLUGGY_CLIENT_ID e PLUGGY_CLIENT_SECRET reais no .env e reinicie o backend.');
    error.status = 503;
    throw error;
  }

  return { clientId, clientSecret };
};

const sanitizePluggyError = (error) => {
  const status = error?.response?.status;
  const data = error?.response?.data;
  const pluggyMessage = data?.message || data?.error || (Array.isArray(data?.errors) ? data.errors.map((item) => item.message || item).join('; ') : null);

  if (status === 400) return pluggyMessage || 'Dados inválidos para conexão Open Finance.';
  if (status === 401 || status === 403) return 'Falha de autenticação com provedor Open Finance.';
  if (status === 404) return 'Recurso Open Finance não encontrado.';
  if (status === 429) return 'Limite de requisições Open Finance excedido. Tente novamente depois.';

  return pluggyMessage || 'Erro ao comunicar com Open Finance.';
};

const requestPluggy = async (config) => {
  try {
    return await http.request(config);
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Pluggy request failed:', {
        status: error?.response?.status,
        data: error?.response?.data,
        url: config?.url
      });
    }

    const safeMessage = sanitizePluggyError(error);
    const safeError = new Error(safeMessage);
    safeError.status = error?.response?.status || 502;
    throw safeError;
  }
};

export const authenticatePluggy = async () => {
  if (cachedApiKey && Date.now() < cachedApiKeyExpiresAt) return cachedApiKey;

  const { clientId, clientSecret } = requirePluggyEnv();
  const response = await requestPluggy({
    method: 'POST',
    url: '/auth',
    data: { clientId, clientSecret }
  });

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
  });

  return (response.data.results || []).filter((connector) =>
    connector.country === 'BR' &&
    Array.isArray(connector.products) &&
    (connector.products.includes('ACCOUNTS') || connector.products.includes('CREDIT_CARDS'))
  );
};

export const createConnectToken = async (itemId) => {
  const data = itemId ? { itemId } : {};
  const response = await requestPluggy({
    method: 'POST',
    url: '/connect_token',
    headers: await authHeaders(),
    data
  });
  return response.data;
};

export const createItem = async ({ connectorId, credentials, clientUserId }) => {
  const response = await requestPluggy({
    method: 'POST',
    url: '/items',
    headers: await authHeaders(),
    data: {
      connectorId,
      parameters: credentials,
      ...(clientUserId ? { clientUserId: String(clientUserId) } : {})
    }
  });
  return response.data;
};

export const getItemStatus = async (itemId) => {
  const response = await requestPluggy({
    method: 'GET',
    url: `/items/${encodeURIComponent(itemId)}`,
    headers: await authHeaders()
  });
  return response.data;
};

export const deleteItem = async (itemId) => {
  await requestPluggy({
    method: 'DELETE',
    url: `/items/${encodeURIComponent(itemId)}`,
    headers: await authHeaders()
  });
};

export const getAccounts = async (itemId) => {
  const response = await requestPluggy({
    method: 'GET',
    url: '/accounts',
    headers: await authHeaders(),
    params: { itemId }
  });
  return response.data.results || [];
};

export const getTransactions = async ({ accountId, from, to }) => {
  const response = await requestPluggy({
    method: 'GET',
    url: '/transactions',
    headers: await authHeaders(),
    params: { accountId, from, to }
  });
  return response.data.results || [];
};

export const getCards = async (itemId) => {
  const response = await requestPluggy({
    method: 'GET',
    url: '/accounts',
    headers: await authHeaders(),
    params: { itemId, type: 'CREDIT' }
  });
  return response.data.results || [];
};

export const getInvestments = async (itemId) => {
  const response = await requestPluggy({
    method: 'GET',
    url: '/investments',
    headers: await authHeaders(),
    params: { itemId }
  });
  return response.data.results || [];
};
