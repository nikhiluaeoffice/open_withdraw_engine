import { WithdrawClientConfig, NativeTransferOptions, TokenTransferOptions, ApiResponse, TransactionRecord } from './types';
export declare class WithdrawClient {
    private secretKey;
    private baseUrl;
    private environment;
    private timeoutMs;
    constructor(config: WithdrawClientConfig);
    private request;
    /**
     * Transfer Native BNB coin to a recipient address
     */
    transferNative(opts: NativeTransferOptions): Promise<ApiResponse>;
    /**
     * Transfer ERC20 / BEP20 Token to a recipient address
     */
    transferToken(opts: TokenTransferOptions): Promise<ApiResponse>;
    /**
     * Retrieve ledger transaction history for this merchant
     */
    getTransactions(sender?: string): Promise<ApiResponse<{
        count: number;
        transactions: TransactionRecord[];
    }>>;
    /**
     * Retrieve aggregate metrics (total, success, failed, pending counts)
     */
    getStats(sender?: string): Promise<ApiResponse>;
}
