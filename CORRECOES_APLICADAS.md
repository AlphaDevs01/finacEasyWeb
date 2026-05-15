# Correções aplicadas

## Backend / inicialização
- Scripts `start` e `server` agora usam `node -r dotenv/config`, garantindo preload do `.env` antes da aplicação.
- Inicialização do banco passou a ser aguardada antes das rotas `/api` responderem.
- Falhas na inicialização do banco agora retornam `503` e não deixam o servidor parcialmente funcional.
- `initDatabase()` agora relança erros, evitando falhas silenciosas.

## Banco / Open Finance
- Adicionados `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` para colunas usadas pelo fluxo Open Finance (`connectorId`, `itemId`, `bankName`, `synced_at`, `updated_at`).
- Melhorada normalização do payload de credenciais enviado à Pluggy.
- `clientUserId` passa a ser enviado na criação de item Pluggy para rastreabilidade por usuário.
- Erros da Pluggy agora preservam mensagens úteis retornadas pela API em desenvolvimento.

## Frontend / Open Finance
- Corrigido bug de sintaxe no `usePluggy.ts` causado por `showToast` duplicado.
- O nome do conector agora é enviado ao backend ao criar item Open Finance.

## Toast
- Corrigido estouro visual no mobile.
- Corrigida quebra de texto.
- Adicionado `aria-label="Close"` no botão de fechar.
- Duração padrão voltou para 5 segundos.

## Vercel
- Corrigidas rotas de assets no `vercel.json`.
- `start` não aponta mais para `api/index.js`.

## Testes
- Ajustadas mensagens esperadas do validator.
- Ajustado timeout do teste de auto-close do toast.
- Adicionado import explícito de `vi` no setup de testes.
