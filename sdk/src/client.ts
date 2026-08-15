import {
  WithdrawClientConfig,
  NativeTransferOptions,
  TokenTransferOptions,
  ApiResponse,
  TransactionRecord,
} from './types';

export class WithdrawClient {
  private secretKey: string;
  private baseUrl: string;
  private environment: 'testnet' | 'mainnet';
  private timeoutMs: number;

  constructor(config: WithdrawClientConfig) {
    if (!config.secretKey) {
      throw new Error('[WithdrawSDK] secretKey is required in config.');
    }
    this.secretKey = config.secretKey;
    this.environment = config.environment || 'testnet';
    this.baseUrl = (config.baseUrl || 'http://localhost:3000').replace(/\/+$/, '');
    this.timeoutMs = config.timeoutMs || 30000;
  }

  private async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-api-key': this.secretKey,
      'Authorization': `Bearer ${this.secretKey}`,
      ...(options.headers as Record<string, string> || {}),
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      const data = (await response.json()) as ApiResponse<T>;
      if (!response.ok && !data.error) {
        data.error = `HTTP Error ${response.status}: ${response.statusText}`;
      }
      return data;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { success: false, error: `Request timed out after ${this.timeoutMs}ms` };
      }
      return { success: false, error: err.message || String(err) };
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Transfer Native BNB coin to a recipient address
   */
  async transferNative(opts: NativeTransferOptions): Promise<ApiResponse> {
    return this.request('/api/v1/withdrawals/native', {
      method: 'POST',
      body: JSON.stringify({
        receiver: opts.receiver,
        amount: Number(opts.amount),
      }),
    });
  }

  /**
   * Transfer ERC20 / BEP20 Token to a recipient address
   */
  async transferToken(opts: TokenTransferOptions): Promise<ApiResponse> {
    return this.request('/api/v1/withdrawals/token', {
      method: 'POST',
      body: JSON.stringify({
        receiver: opts.receiver,
        amount: opts.amount,
        tokenAddress: opts.tokenAddress,
        tokenDecimals: opts.tokenDecimals || 18,
      }),
    });
  }

  /**
   * Retrieve ledger transaction history for this merchant
   */
  async getTransactions(sender?: string): Promise<ApiResponse<{ count: number; transactions: TransactionRecord[] }>> {
    const query = sender ? `?sender=${encodeURIComponent(sender)}` : '';
    return this.request(`/api/v1/transactions${query}`, {
      method: 'GET',
    });
  }

  /**
   * Retrieve aggregate metrics (total, success, failed, pending counts)
   */
  async getStats(sender?: string): Promise<ApiResponse> {
    const query = sender ? `?sender=${encodeURIComponent(sender)}` : '';
    return this.request(`/api/v1/stats${query}`, {
      method: 'GET',
    });
  }
}
