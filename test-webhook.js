const url = 'http://localhost:3000/api/webhooks/openfinance';

async function main() {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-openfinance-webhook-secret': 'sua_chave_webhook_teste',
      'x-openfinance-webhook-timestamp': `${Date.now()}`,
      'x-idempotency-key': `test-${Date.now()}`
    },
    body: JSON.stringify({
      event: 'item/updated',
      itemId: 'teste',
      status: 'UPDATED'
    })
  });

  console.log('Status:', response.status);
  console.log('Response:', await response.text());
}

main().catch(console.error);