import {
  createPublicClient,
  createWalletClient,
  http,
  type Address,
  type Chain,
  type Hash,
  type PublicClient,
} from "viem";
import { mainnet, sepolia } from "viem/chains";
import { mnemonicToAccount } from "viem/accounts";

const chains: Record<number, Chain> = {
  1: mainnet,
  11155111: sepolia,
};

function getRpcUrl(chainId: number): string {
  if (chainId === 1) return process.env.ETHEREUM_RPC_URL || "https://eth.llamarpc.com";
  if (chainId === 11155111) return process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org";
  throw new Error(`Unsupported chainId: ${chainId}`);
}

export function getPublicClient(chainId: number): PublicClient {
  const chain = chains[chainId];
  if (!chain) throw new Error(`Unsupported chainId: ${chainId}`);
  return createPublicClient({
    chain,
    transport: http(getRpcUrl(chainId)),
  });
}

export function getWalletFromMnemonic(mnemonic: string) {
  return mnemonicToAccount(mnemonic.trim());
}

export async function getBalance(address: Address, chainId: number): Promise<bigint> {
  const client = getPublicClient(chainId);
  return client.getBalance({ address });
}

export async function sendTransaction(params: {
  mnemonic: string;
  to: Address;
  valueWei: bigint;
  chainId: number;
}): Promise<Hash> {
  const { mnemonic, to, valueWei, chainId } = params;
  const account = getWalletFromMnemonic(mnemonic);
  const chain = chains[chainId];
  if (!chain) throw new Error(`Unsupported chainId: ${chainId}`);
  const client = createWalletClient({
    account,
    chain,
    transport: http(getRpcUrl(chainId)),
  });
  const hash = await client.sendTransaction({
    to,
    value: valueWei,
    gas: 21000n,
  });
  return hash;
}

export async function getTransactionReceipt(hash: Hash, chainId: number) {
  const client = getPublicClient(chainId);
  return client.getTransactionReceipt({ hash });
}

export { mainnet, sepolia, chains };
