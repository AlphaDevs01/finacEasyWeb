/*
  Debug OpenFinance/Pluggy production flow.

  Required envs:
    API_BASE_URL=https://financeasy.alphadevss.com.br/api
    DEBUG_EMAIL=seu-email
    DEBUG_PASSWORD=sua-senha

  Optional:
    DEBUG_CONNECTOR_ID=283
    DEBUG_CREATE_ITEM=true
    DEBUG_CREDENTIALS_JSON={"cpf":"00000000000","senha":"..."}

  Run:
    node scripts/debug-openfinance.mjs
*/

const API_BASE_URL = (process.env.API_BASE_URL || 'http://localhost:3000/api').replace(/\/$/, '');
const email = process.env.DEBUG_EMAIL;
const senha = process.env.DEBUG_PASSWORD;
const connectorId = process.env.DEBUG_CONNECTOR_ID ? Number(process.env.DEBUG_CONNECTOR_ID) : null;
const shouldCreateItem = String(process.env.DEBUG_CREATE_ITEM || '').toLowerCase() === 'true';
const credentials = process.env.DEBUG_CREDENTIALS_JSON ? JSON.parse(process.env.DEBUG_CREDENTIALS_JSON) : null;

const cookieJar = new Map();

const updateCookies = (headers) => {
  const setCookie = headers.get('set-cookie');
  if (!setCookie) return;
  setCookie.split(/,(?=\s*[^;]+=)/).forEach((cookie) => {
    const [pair] = cookie.trim().split(';');
    const [key, value] = pair.split('=');
    if (key && value) cookieJar.set(key, value);
  });
};

const cookieHeader = () => Array.from(cookieJar.entries()).map(([key, value]) => `${key}=${value}`).join('; ');

const request = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(cookieJar.size ? { Cookie: cookieHeader() } : {}),
      ...(options.headers || {})
    }
  });
  updateCookies(response.headers);
  const text = await response.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  console.log(`\n${options.method || 'GET'} ${path} -> ${response.status}`);
  console.log(JSON.stringify(data, null, 2));
  return { response, data };
};

if (!email || !senha) {
  console.error('Defina DEBUG_EMAIL e DEBUG_PASSWORD para executar o debug autenticado.');
  process.exit(1);
}

await request('/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email, senha })
});

await request('/auth/me');
await request('/openfinance/debug/environment');
await request('/openfinance/connectors');

if (connectorId) {
  await request(`/openfinance/debug/connector/${connectorId}`);
}

if (shouldCreateItem) {
  if (!connectorId || !credentials) {
    console.error('Para criar item, defina DEBUG_CONNECTOR_ID e DEBUG_CREDENTIALS_JSON.');
    process.exit(1);
  }

  await request('/openfinance/items', {
    method: 'POST',
    body: JSON.stringify({ connectorId, credentials, bankName: `Debug connector ${connectorId}` })
  });
}

await request('/openfinance/debug/last-pluggy-error');
