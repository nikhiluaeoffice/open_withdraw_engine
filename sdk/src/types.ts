export interface WithdrawClientConfig {
  /**
   * Your Developer API Secret Key (e.g., sk_test_... or sk_live_...)
   */
  secretKey: string;

  /**
   * Environment target: 'testnet' | 'mainnet' (Default: 'testnet')
   */
  environment?: 'testnet' | 'mainnet';

  /**
   * Base URL of the withdrawal backend API (Default: 'http://localhost:3000')
   */
  baseUrl?: string;

  /**
   * Optional request timeout in milliseconds (Default: 30000)
   */
  timeoutMs?: number;
}

export interface NativeTransferOptions {
  receiver: string;
  amount: number | string;
}

export interface TokenTransferOptions {
  receiver: string;
  amount: number | string;
  tokenAddress: string;
  tokenDecimals?: number;
}

export interface TransactionRecord {
  id: string;
  txHash: string;
  senderAddress: string;
  recipientAddress: string;
  amount: number;
  tokenSymbol: string;
  tokenAddress?: string | null;
  chainId: number;
  txType: 'single' | 'token' | 'batch' | 'approve';
  status: 'pending' | 'success' | 'failed';
  errorMessage?: string | null;
  createdAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  error?: string;
  receipt?: any;
  transactionHash?: string;
  environment?: string;
  count?: number;
  transactions?: TransactionRecord[];
  stats?: {
    total: number;
    success: number;
    failed: number;
    pending: number;
  };
}
