# @reusable-withdraw/sdk

Developer Client SDK for Reusable Crypto Withdrawal Services (BNB, USDT, BEP20/ERC20).

## Quickstart

### 1. Installation

```bash
npm install @reusable-withdraw/sdk
```

### 2. Initialization

```typescript
import { WithdrawClient } from '@reusable-withdraw/sdk';

const withdraw = new WithdrawClient({
  secretKey: 'sk_test_51Nx...', // Your developer secret key
  environment: 'testnet',        // 'testnet' | 'mainnet'
  baseUrl: 'http://localhost:3000'
});
```

### 3. Native BNB Transfer

```typescript
const response = await withdraw.transferNative({
  receiver: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
  amount: 0.05
});

if (response.success) {
  console.log('Transaction Hash:', response.transactionHash);
} else {
  console.error('Transfer Failed:', response.error);
}
```

### 4. BEP20/ERC20 Token Transfer

```typescript
const response = await withdraw.transferToken({
  receiver: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
  tokenAddress: '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd', // e.g. USDT Testnet
  amount: '10.5',
  tokenDecimals: 18
});

console.log(response);
```

### 5. Fetch Ledger Transactions & Stats

```typescript
// Fetch merchant transaction ledger
const history = await withdraw.getTransactions();
console.log('Ledger Transactions:', history.transactions);

// Fetch Aggregate Metrics
const stats = await withdraw.getStats();
console.log('Metrics:', stats.stats);
```
