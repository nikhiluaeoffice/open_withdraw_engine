import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { BrowserProvider, Contract, formatEther, formatUnits } from "ethers";
import { toast } from "sonner";
import { CHAINS, DEFAULT_CHAIN_ID, ERC20_ABI, type ChainId } from "./constants";

type Eip1193Provider = {
  request: (args: { method: string; params?: unknown[] | object }) => Promise<unknown>;
  on?: (event: string, handler: (...args: never[]) => void) => void;
  removeListener?: (event: string, handler: (...args: never[]) => void) => void;
  isMetaMask?: boolean;
};

declare global {
  interface Window {
    ethereum?: Eip1193Provider;
  }
}

type WalletState = {
  hasProvider: boolean;
  address: string | null;
  chainId: number | null;
  bnbBalance: string;
  usdtBalance: string;
  connecting: boolean;
  isSupportedChain: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchChain: (target: ChainId) => Promise<void>;
  getProvider: () => BrowserProvider;
  refreshBalances: () => Promise<void>;
};

const WalletContext = createContext<WalletState | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [hasProvider, setHasProvider] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [bnbBalance, setBnbBalance] = useState("0");
  const [usdtBalance, setUsdtBalance] = useState("0");
  const [connecting, setConnecting] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const getProvider = useCallback(() => {
    if (!window.ethereum) throw new Error("MetaMask is not installed");
    return new BrowserProvider(window.ethereum);
  }, []);

  const loadBalances = useCallback(async (account: string, activeChain: number) => {
    try {
      const provider = getProvider();
      const native = await provider.getBalance(account);
      if (mounted.current) setBnbBalance(Number(formatEther(native)).toFixed(5));

      const chain = CHAINS[activeChain as ChainId];
      if (!chain) {
        if (mounted.current) setUsdtBalance("0");
        return;
      }
      const token = new Contract(chain.usdt, ERC20_ABI, provider);
      const [raw, decimals] = await Promise.all([
        token['balanceOf']!(account) as Promise<bigint>,
        token['decimals']!() as Promise<bigint>,
      ]);
      if (mounted.current) setUsdtBalance(Number(formatUnits(raw, decimals)).toFixed(2));
    } catch {
      if (mounted.current) setUsdtBalance("0");
    }
  }, [getProvider]);

  const refreshBalances = useCallback(async () => {
    if (address && chainId) await loadBalances(address, chainId);
  }, [address, chainId, loadBalances]);

  const syncAccounts = useCallback(
    async (accounts: string[]) => {
      if (!accounts.length) {
        setAddress(null);
        setBnbBalance("0");
        setUsdtBalance("0");
        return;
      }
      const account = accounts[0]!;
      setAddress(account);
      const provider = getProvider();
      const network = await provider.getNetwork();
      const id = Number(network.chainId);
      setChainId(id);
      await loadBalances(account, id);
    },
    [getProvider, loadBalances],
  );

  useEffect(() => {
    const eth = window.ethereum;
    if (!eth) return;
    setHasProvider(true);

    void (async () => {
      const accounts = (await eth.request({ method: "eth_accounts" })) as string[];
      if (accounts.length) await syncAccounts(accounts);
    })();

    const onAccounts = (...args: never[]) => {
      const accounts = args[0] as unknown as string[];
      void syncAccounts(accounts);
      if (accounts?.length) toast.info("Wallet account switched");
    };
    const onChain = (...args: never[]) => {
      const hex = args[0] as unknown as string;
      const id = Number.parseInt(hex, 16);
      setChainId(id);
      const label = CHAINS[id as ChainId]?.short ?? `Chain ${id}`;
      toast.info(`Network changed to ${label}`);
      void (async () => {
        const accounts = (await eth.request({ method: "eth_accounts" })) as string[];
        if (accounts.length) await loadBalances(accounts[0]!, id);
      })();
    };

    eth.on?.("accountsChanged", onAccounts);
    eth.on?.("chainChanged", onChain);
    return () => {
      eth.removeListener?.("accountsChanged", onAccounts);
      eth.removeListener?.("chainChanged", onChain);
    };
  }, [syncAccounts, loadBalances]);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      toast.error("MetaMask not detected", {
        description: "Install the MetaMask extension to continue.",
      });
      window.open("https://metamask.io/download/", "_blank", "noopener");
      return;
    }
    setConnecting(true);
    try {
      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];
      await syncAccounts(accounts);
      toast.success("Wallet connected", { description: accounts[0] });
    } catch (error) {
      toast.error("Connection rejected", { description: (error as Error).message });
    } finally {
      setConnecting(false);
    }
  }, [syncAccounts]);

  const disconnect = useCallback(() => {
    setAddress(null);
    setBnbBalance("0");
    setUsdtBalance("0");
    toast.info("Wallet disconnected from this dashboard");
  }, []);

  const switchChain = useCallback(async (target: ChainId) => {
    if (!window.ethereum) return;
    const chain = CHAINS[target];
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: chain.hexId }],
      });
    } catch (error) {
      const code = (error as { code?: number }).code;
      if (code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: chain.hexId,
              chainName: chain.name,
              nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
              rpcUrls: [chain.rpc],
              blockExplorerUrls: [chain.explorer],
            },
          ],
        });
      } else {
        toast.error("Network switch failed", { description: (error as Error).message });
      }
    }
  }, []);

  const value = useMemo<WalletState>(
    () => ({
      hasProvider,
      address,
      chainId,
      bnbBalance,
      usdtBalance,
      connecting,
      isSupportedChain: chainId !== null && chainId in CHAINS,
      connect,
      disconnect,
      switchChain,
      getProvider,
      refreshBalances,
    }),
    [
      hasProvider,
      address,
      chainId,
      bnbBalance,
      usdtBalance,
      connecting,
      connect,
      disconnect,
      switchChain,
      getProvider,
      refreshBalances,
    ],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used inside WalletProvider");
  return ctx;
}

export const FALLBACK_CHAIN_ID = DEFAULT_CHAIN_ID;
