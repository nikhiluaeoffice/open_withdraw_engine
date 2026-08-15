# Withdrawal Wizard

Design and build a client-side Web3 Withdrawal Dashboard UI integrated with MetaMask signing and backend database recording.

### Architecture Goal:

Zero Private Key backend dependency. All withdrawal transactions must be signed directly by the user's connected MetaMask wallet in the browser, and transaction records must be submitted to the backend API for DB storage.

### Core UI Features:

1. **MetaMask Wallet Header**:

   - "Connect Wallet" button supporting window.ethereum / MetaMask.

   - Display connected wallet address (truncated: 0x123...abc), network badge (BNB Smart Chain Mainnet / Testnet), and current native BNB & USDT balance.

   - Auto-detect network changes and wallet account switches.

2. **Withdrawal Execution Forms (Client-Side Signing)**:

   - **Single Withdrawal**: Form to enter Recipient Address, Select Token (BNB / USDT), and Amount.

     - On Submit: Trigger transaction directly via Ethers.js/Web3.js using MetaMask provider (`signer.sendTransaction` or ERC20 `contract.transfer`).

   - **Batch Withdrawal**: Form to enter multiple recipients and amounts (or CSV upload) to interact directly with the Batch Transfer Smart Contract (`0xf02c17Ed8bD759B1a7B345ad42Fd6f4567C326B4`).

     - Automatically prompt ERC20 token `approve` if required before batch transfer.

3. **Backend Database Sync Integration**:

   - Once a transaction is submitted by MetaMask and returns a `txHash`:

     - Send a POST request to backend endpoint `/crypto-withdraw/record-transaction` payload:

       `{ txHash, senderAddress, recipientAddress, amount, tokenAddress, status, timestamp }`

   - Real-time status update (Pending -> Confirmed on BscScan).

4. **Transaction Log & Dashboard Table**:

   - Table showing past withdrawal transactions fetched from backend API:

     - Connected Wallet Tx History

     - Tx Hash (clickable BscScan link)

     - Token & Amount

     - Status Badge (Success / Pending / Failed)

     - Timestamp

5. **Design & UX**:

   - Sleek Web3 dark theme, modern glassmorphism cards, status indicator lights, and live gas cost previews.

   - Interactive toast notifications for: Wallet Connected, Transaction Pending in MetaMask, Tx Broadcasted, and DB Record Saved.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://secure-payout-dash.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/6ca6ca08-5e55-4570-9fa2-1ca8ec86d301).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
