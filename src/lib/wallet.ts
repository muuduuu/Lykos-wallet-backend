import {
  createPublicClient,
  createWalletClient,
  formatEther,
  http,
  parseEther,
  type Address,
  type Chain,
  type PublicClient,
  type WalletClient,
} from "viem";
import { mnemonicToAccount, generateMnemonic, english } from "viem/accounts";
import { mainnet, sepolia } from "viem/chains";

const CHAINS: Record<number, Chain> = {
  1: mainnet,
  11155111: sepolia,
};

export function getChain(chainId: number): Chain {
  return CHAINS[chainId] ?? mainnet;
}

export function createMnemonic(): string {
  return generateMnemonic(english, 128);
}

export function getAccountFromMnemonic(mnemonic: string, index = 0) {
  return mnemonicToAccount(mnemonic, { addressIndex: index });
}

export function getAddressFromMnemonic(mnemonic: string, index = 0): Address {
  return getAccountFromMnemonic(mnemonic, index).address;
}

export function createPublicClientForChain(chainId: number, rpcUrl?: string): PublicClient {
  const chain = getChain(chainId);
  return createPublicClient({
    chain,
    transport: http(rpcUrl),
  });
}

export function createWalletClientForChain(
  chainId: number,
  mnemonic: string,
  accountIndex = 0,
  rpcUrl?: string
): WalletClient {
  const chain = getChain(chainId);
  const account = getAccountFromMnemonic(mnemonic, accountIndex);
  return createWalletClient({
    account,
    chain,
    transport: http(rpcUrl),
  });
}

export async function getBalance(
  chainId: number,
  address: Address,
  rpcUrl?: string
): Promise<string> {
  const client = createPublicClientForChain(chainId, rpcUrl);
  const wei = await client.getBalance({ address });
  return formatEther(wei);
}

export async function sendTransaction(
  chainId: number,
  mnemonic: string,
  to: Address,
  valueEth: string,
  accountIndex = 0,
  rpcUrl?: string
): Promise<{ hash: `0x${string}` }> {
  const walletClient = createWalletClientForChain(chainId, mnemonic, accountIndex, rpcUrl);
  const account = getAccountFromMnemonic(mnemonic, accountIndex);
  const chain = getChain(chainId);
  const hash = await walletClient.sendTransaction({
    account,
    chain,
    to,
    value: parseEther(valueEth),
  });
  return { hash };
}

export { formatEther, parseEther };
