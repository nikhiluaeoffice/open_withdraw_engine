# Open Withdraw Engine (`ChainPayout`)

<p align="center">
  <img src="secure-payout-dash/public/logo.svg" alt="Open Withdraw Engine Logo" width="100" height="100" />
</p>

<h3 align="center">High-Performance, Non-Custodial Multi-Chain Crypto Withdrawal Engine & Developer SDK</h3>

<p align="center">
  Automate crypto payouts on BNB Smart Chain (BNB & BEP20 USDT) with zero private key custody risk, instant batch disperser, auditable transaction ledger, and developer client SDK.
</p>

<p align="center">
  <a href="#key-features">Key Features</a> •
  <a href="#monorepo-structure">Monorepo Structure</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#developer-sdk-usage">SDK Usage</a> •
  <a href="#rest-api-documentation">REST API</a> •
  <a href="#license">License</a>
</p>

---

## 🌟 Key Features

- 🔒 **Zero Custody Risk**: Transactions in the web console are signed client-side via MetaMask. Private keys never touch any server.
- 🔑 **API Secret Key Auth**: SHA-256 hashed secret key authentication (`x-api-key`) for automated server-to-server backend integrations.
- ⚡ **Batch Transfer Engine**: Execute single or multi-token batch disperses to multiple recipient addresses in a single on-chain transaction.
- 📜 **Auditable MongoDB Ledger**: Comprehensive transaction tracking with transaction hashes, block receipts, gas consumption, and network statuses.
- 📊 **Real-time System Status**: Live monitoring of backend APIs, blockchain RPC latency, wallet connection health, and processing metrics.
- 📖 **Interactive Swagger Docs**: Built-in OpenAPI / Swagger UI at `/api/docs` and dedicated frontend documentation page at `/docs`.
- 📦 **TypeScript SDK (`@reusable-withdraw/sdk`)**: Production-ready developer SDK supporting Node.js, TypeScript, and serverless backends.

---

## 📁 Monorepo Structure

```text
open_withdraw_engine/
├── withdraw_bnb_usdt/       # NestJS Backend API & MongoDB Ledger Engine (Port 10010)
├── sdk/                    # @reusable-withdraw/sdk TypeScript Client Package
├── secure-payout-dash/     # Non-Custodial Vite + React + TanStack Router Dashboard (Port 5173)
└── demo-app/               # Example Node.js application demonstrating SDK integration
```

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Backend API** | NestJS, Ethers.js v6, MongoDB, Mongoose, Swagger | Manages API secret keys, processes SDK withdrawals, and audits ledger history. |
| **Developer SDK** | TypeScript, Fetch API | Lightweight client library for backend integrations. |
| **Dashboard UI** | Vite, React, TanStack Router, Tailwind CSS, Lucide | Web console for client-side signing, batch payouts, system status, and docs. |
| **Demo Application** | Node.js (ESM) | Runnable example showing SDK initialization and transfer execution. |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **bun**
- **MongoDB**: Local MongoDB instance (`mongodb://localhost:27017`) or MongoDB Atlas URI
- **MetaMask** browser extension (for Web Dashboard client-side signing)

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/nikhiluaeoffice/open_withdraw_engine.git
cd open_withdraw_engine
```

### 2. Configure & Start Backend (`withdraw_bnb_usdt`)

```bash
cd withdraw_bnb_usdt
npm install
npm run start:dev
```
> The backend server will start on **`http://localhost:10010`**.  
> Interactive Swagger UI will be available at **`http://localhost:10010/api/docs`**.

### 3. Start Web Dashboard (`secure-payout-dash`)

In a new terminal window:

```bash
cd secure-payout-dash
npm install
npm run dev
```
> The frontend application will start on **`http://localhost:5173`**.

---

## 📦 Developer SDK Usage (`@reusable-withdraw/sdk`)

### Installation

From your backend project directory:

```bash
npm install @reusable-withdraw/sdk
```

### Quickstart Example

```typescript
import { WithdrawClient } from '@reusable-withdraw/sdk';

// Initialize SDK Client
const withdraw = new WithdrawClient({
  secretKey: 'sk_test_your_secret_key', // Generated from /docs or /api/v1/keys/generate
  environment: 'testnet', // 'testnet' (BSC 97) or 'mainnet' (BSC 56)
  baseUrl: 'http://localhost:10010',
});

// 1. Transfer Native BNB
const bnbResult = await withdraw.transferNative({
  receiver: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
  amount: 0.01,
});
console.log('BNB Tx Hash:', bnbResult.transactionHash);

// 2. Transfer BEP20 USDT Token
const usdtResult = await withdraw.transferToken({
  receiver: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
  tokenAddress: '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd', // BSC Testnet USDT
  amount: 50.0,
});
console.log('USDT Tx Hash:', usdtResult.transactionHash);

// 3. Retrieve Merchant Transaction Ledger
const ledger = await withdraw.getTransactions();
console.log('Total Recorded Txs:', ledger.count);
```

---

## ⚡ Testing the Demo Application

You can run the included demo application inside [`demo-app/`](demo-app):

```bash
cd demo-app
npm install
npm start
```

---

## 🌐 REST API Endpoints Overview

All automated SDK and REST endpoints require the `x-api-key` header with a valid Secret Key (`sk_test_...` or `sk_live_...`).

### Authentication Header
```http
x-api-key: sk_test_your_secret_key
Content-Type: application/json
```

### Core API Routes

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/v1/keys/generate` | Generate a new Developer API Secret Key | No |
| `GET` | `/api/v1/keys` | List active API Secret Keys | No |
| `DELETE` | `/api/v1/keys/:id` | Revoke an API Secret Key | No |
| `POST` | `/api/v1/withdrawals/native` | Execute native BNB withdrawal | **Yes** (`x-api-key`) |
| `POST` | `/api/v1/withdrawals/token` | Execute BEP20 USDT / token withdrawal | **Yes** (`x-api-key`) |
| `GET` | `/api/v1/transactions` | Retrieve merchant ledger transaction history | **Yes** (`x-api-key`) |
| `GET` | `/api/v1/stats` | Retrieve aggregate withdrawal metrics | **Yes** (`x-api-key`) |

---

## 🛡️ Security & Architecture

1. **Secret Key Hashing**: Plaintext secret keys (`sk_test_...`) are displayed **once** upon generation and stored as SHA-256 hashes in MongoDB.
2. **Client-Side Signing**: Web dashboard transactions use window.ethereum (MetaMask) RPC provider. The backend never accepts raw private keys.
3. **On-Chain Balance Validation**: Token transfer requests verify on-chain balances and contract approvals before broadcasting transactions.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!  
Feel free to check out the [issues page](https://github.com/nikhiluaeoffice/open_withdraw_engine/issues).

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
