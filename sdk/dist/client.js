"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WithdrawClient = void 0;
class WithdrawClient {
    secretKey;
    baseUrl;
    environment;
    timeoutMs;
    constructor(config) {
        if (!config.secretKey) {
            throw new Error('[WithdrawSDK] secretKey is required in config.');
        }
        this.secretKey = config.secretKey;
        this.environment = config.environment || 'testnet';
        this.baseUrl = (config.baseUrl || 'http://localhost:3000').replace(/\/+$/, '');
        this.timeoutMs = config.timeoutMs || 30000;
    }
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
        const headers = {
            'Content-Type': 'application/json',
            'x-api-key': this.secretKey,
            'Authorization': `Bearer ${this.secretKey}`,
            ...(options.headers || {}),
        };
        try {
            const response = await fetch(url, {
                ...options,
                headers,
                signal: controller.signal,
            });
            const data = (await response.json());
            if (!response.ok && !data.error) {
                data.error = `HTTP Error ${response.status}: ${response.statusText}`;
            }
            return data;
        }
        catch (err) {
            if (err.name === 'AbortError') {
                return { success: false, error: `Request timed out after ${this.timeoutMs}ms` };
            }
            return { success: false, error: err.message || String(err) };
        }
        finally {
            clearTimeout(timeout);
        }
    }
    /**
     * Transfer Native BNB coin to a recipient address
     */
    async transferNative(opts) {
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
    async transferToken(opts) {
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
    async getTransactions(sender) {
        const query = sender ? `?sender=${encodeURIComponent(sender)}` : '';
        return this.request(`/api/v1/transactions${query}`, {
            method: 'GET',
        });
    }
    /**
     * Retrieve aggregate metrics (total, success, failed, pending counts)
     */
    async getStats(sender) {
        const query = sender ? `?sender=${encodeURIComponent(sender)}` : '';
        return this.request(`/api/v1/stats${query}`, {
            method: 'GET',
        });
    }
}
exports.WithdrawClient = WithdrawClient;
