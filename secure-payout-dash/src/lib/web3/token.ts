import { useCallback, useEffect, useState } from "react";
import { Contract, JsonRpcProvider, formatUnits, isAddress } from "ethers";
import { useWallet } from "./wallet";
import { CHAINS, ERC20_ABI, type ChainId } from "./constants";

export type TokenMetadata = {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  balance: string;
  rawBalance: bigint;
  loading: boolean;
  error: string | null;
};

export function useTokenMetadata(customAddress: string): TokenMetadata {
  const { address: userAddress, chainId } = useWallet();
  const [meta, setMeta] = useState<TokenMetadata>({
    address: customAddress,
    name: "",
    symbol: "",
    decimals: 18,
    balance: "0",
    rawBalance: 0n,
    loading: false,
    error: null,
  });

  const fetchMeta = useCallback(async () => {
    const trimmed = customAddress.trim();
    if (!isAddress(trimmed)) {
      setMeta({
        address: trimmed,
        name: "",
        symbol: "",
        decimals: 18,
        balance: "0",
        rawBalance: 0n,
        loading: false,
        error: trimmed ? "Invalid token contract address" : null,
      });
      return;
    }

    setMeta((prev) => ({ ...prev, address: trimmed, loading: true, error: null }));

    try {
      // Determine target chain RPC (default BSC Testnet 97)
      const activeChainId = chainId && chainId in CHAINS ? chainId : 97;
      const chainConfig = CHAINS[activeChainId as ChainId];
      const rpcUrl = chainConfig?.rpc ?? "https://data-seed-prebsc-1-s1.binance.org:8545";

      // Direct JsonRpcProvider for active chain
      const provider = new JsonRpcProvider(rpcUrl);

      const code = await provider.getCode(trimmed);
      if (!code || code === "0x" || code === "0x0") {
        setMeta({
          address: trimmed,
          name: "",
          symbol: "",
          decimals: 18,
          balance: "0",
          rawBalance: 0n,
          loading: false,
          error: `No smart contract found at this address on ${chainConfig?.name ?? "active network"}`,
        });
        return;
      }

      const erc20 = new Contract(trimmed, ERC20_ABI, provider);

      // Query contract name, symbol, decimals safely
      const namePromise = (erc20["name"] as () => Promise<string>)()
        .then((res) => String(res))
        .catch(() => "BEP20 / ERC20 Token");

      const symbolPromise = (erc20["symbol"] as () => Promise<string>)()
        .then((res) => String(res))
        .catch(() => "TOKEN");

      const decimalsPromise = (erc20["decimals"] as () => Promise<bigint | number>)()
        .then((res) => Number(res))
        .catch(() => 18);

      const [name, symbol, decimals] = await Promise.all([
        namePromise,
        symbolPromise,
        decimalsPromise,
      ]);

      let balanceStr = "0";
      let rawBal = 0n;

      if (userAddress) {
        try {
          rawBal = (await (erc20["balanceOf"] as (o: string) => Promise<bigint>)(
            userAddress,
          )) as bigint;

          const formatted = formatUnits(rawBal, decimals);
          const parts = formatted.split(".");
          const integerPart = Number(parts[0]).toLocaleString();
          const decimalPart = parts[1] ? parts[1].slice(0, 4) : "00";
          balanceStr = `${integerPart}.${decimalPart}`;
        } catch {
          balanceStr = "0";
          rawBal = 0n;
        }
      }

      setMeta({
        address: trimmed,
        name,
        symbol,
        decimals,
        balance: balanceStr,
        rawBalance: rawBal,
        loading: false,
        error: null,
      });
    } catch (err) {
      setMeta({
        address: trimmed,
        name: "",
        symbol: "",
        decimals: 18,
        balance: "0",
        rawBalance: 0n,
        loading: false,
        error: (err as Error).message || "Failed to query token metadata",
      });
    }
  }, [customAddress, userAddress, chainId]);

  useEffect(() => {
    const timer = setTimeout(() => void fetchMeta(), 300);
    return () => clearTimeout(timer);
  }, [fetchMeta]);

  return meta;
}
