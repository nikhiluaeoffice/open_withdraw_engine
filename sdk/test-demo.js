const { WithdrawClient } = require('./dist/index.js');

async function main() {
  console.log('🚀 Initializing WithdrawClient SDK...');
  
  // Replace with your generated Secret Key (sk_test_...)
  const secretKey = process.env.API_SECRET_KEY || 'sk_test_8b6e715eb5d20eeb25d1e0a75d8b7f2f7cd772927d082fda';
  const baseUrl = process.env.API_BASE_URL || 'http://localhost:10010';

  const client = new WithdrawClient({
    secretKey,
    environment: 'testnet',
    baseUrl,
  });

  console.log('\n--- 1. Testing getStats() ---');
  const statsRes = await client.getStats();
  console.log('Stats Response:', JSON.stringify(statsRes, null, 2));

  console.log('\n--- 2. Testing getTransactions() ---');
  const txRes = await client.getTransactions();
  console.log('Transactions Response:', JSON.stringify(txRes, null, 2));

  console.log('\n--- 3. Testing transferNative() ---');
  const nativeRes = await client.transferNative({
    receiver: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    amount: 0.001,
  });
  console.log('Native Transfer Response:', JSON.stringify(nativeRes, null, 2));

  console.log('\n--- 4. Testing transferToken() ---');
  const tokenRes = await client.transferToken({
    receiver: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    tokenAddress: '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd', // BSC Testnet USDT
    amount: 10.0,
  });
  console.log('Token Transfer Response:', JSON.stringify(tokenRes, null, 2));
}

main().catch(console.error);
