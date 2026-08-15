export const CHAINS = {
  56: {
    id: 56,
    hexId: "0x38",
    name: "BNB Smart Chain",
    short: "BSC Mainnet",
    rpc: "https://bsc-dataseed.binance.org",
    explorer: "https://bscscan.com",
    usdt: "0x55d398326f99059fF775485246999027B3197955",
    usdtDecimals: 18,
  },
  97: {
    id: 97,
    hexId: "0x61",
    name: "BNB Smart Chain Testnet",
    short: "BSC Testnet",
    rpc: "https://data-seed-prebsc-1-s1.binance.org:8545",
    explorer: "https://testnet.bscscan.com",
    usdt: "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd",
    usdtDecimals: 18,
  },
} as const;

export type ChainId = keyof typeof CHAINS;

export const DEFAULT_CHAIN_ID: ChainId = 97;

export const BATCH_TRANSFER_CONTRACT = "0xf02c17Ed8bD759B1a7B345ad42Fd6f4567C326B4";

export const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address to, uint256 amount) returns (bool)",
];


// Batch disperse contract interface (recipients + amounts arrays).
export const BATCH_ABI = [
  "function batchTransferBNB(address[] recipients, uint256[] amounts) payable",
  "function batchTransferTokenFromSender(address token, address[] recipients, uint256[] amounts)",
  "function batchTransferToken(address token, address[] recipients, uint256[] amounts)",
];

export function explorerTx(chainId: number, hash: string) {
  const chain = CHAINS[chainId as ChainId] ?? CHAINS[DEFAULT_CHAIN_ID];
  return `${chain.explorer}/tx/${hash}`;
}

export function truncate(address: string, head = 6, tail = 4) {
  if (!address) return "";
  return `${address.slice(0, head)}...${address.slice(-tail)}`;
}
