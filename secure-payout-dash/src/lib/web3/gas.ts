import { formatEther, type BrowserProvider, type TransactionRequest } from "ethers";

export async function estimateGasCost(
  provider: BrowserProvider,
  tx: TransactionRequest,
): Promise<string | null> {
  try {
    const [gas, fee] = await Promise.all([provider.estimateGas(tx), provider.getFeeData()]);
    const price = fee.maxFeePerGas ?? fee.gasPrice;
    if (!price) return null;
    return Number(formatEther(gas * price)).toFixed(6);
  } catch {
    return null;
  }
}
