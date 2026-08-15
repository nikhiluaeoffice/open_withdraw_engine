import { WithdrawClient } from '@reusable-withdraw/sdk';

async function run() {
  console.log('⚡ Initializing Node.js SDK Application...');

  const baseUrl = process.env.API_BASE_URL || 'http://localhost:10010';
  let secretKey = process.env.SECRET_KEY || 'sk_test_c3f9dc35b10543b1817e377640837813d5f6c67f6e58c37a';

  // If no secret key is passed via environment variable, automatically generate a test key from backend
  if (!secretKey) {
    console.log('🔑 No SECRET_KEY provided in env. Auto-generating test secret key from backend...');
    try {
      const res = await fetch(`${baseUrl}/api/v1/keys/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Demo App Secret Key',
          environment: 'testnet',
          merchantEmail: 'demo@mailinator.com',
        }),
      });
      const data = await res.json();
      if (data.success && data.apiKey?.secretKey) {
        secretKey = data.apiKey.secretKey;
        console.log(`✅ Auto-generated API Secret Key: ${secretKey}`);
      }
    } catch (err) {
      console.warn('⚠️ Could not auto-generate API Key from backend server:', err.message);
    }
  }

  // Fallback to demo test key if server is unreachable or didn't return a key
  if (!secretKey) {
    secretKey = 'sk_test_8b6e715eb5d20eeb25d1e0a75d8b7f2f7cd772927d082fda';
  }

  // Instantiate the SDK Client
  const withdraw = new WithdrawClient({
    secretKey,
    environment: 'testnet',
    baseUrl,
  });

  console.log('\n--- 1. Fetching Aggregated Ledger Metrics (getStats) ---');
  const stats = await withdraw.getStats();
  console.log('Stats Result:', stats);

  console.log('\n--- 2. Fetching Transaction History (getTransactions) ---');
  const txs = await withdraw.getTransactions();
  console.log('Transactions Result:', txs);

  console.log('\n--- 3. Executing Native BNB Transfer (transferNative) ---');
  const nativeResponse = await withdraw.transferNative({
    receiver: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    amount: 0.001,
  });
  console.log('Native Transfer Response:', nativeResponse);

  console.log('\n--- 4. Executing BEP20 USDT Token Transfer (transferToken) ---');
  const response = await withdraw.transferToken({
    receiver: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    tokenAddress: '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd',
    amount: 10.5,
  });

  console.log('Token Transfer Response:', response);
  if (response.transactionHash) {
    console.log('🎉 Transaction Hash:', response.transactionHash);
  }
}

run().catch((err) => {
  console.error('❌ Error executing SDK Demo App:', err);
});
