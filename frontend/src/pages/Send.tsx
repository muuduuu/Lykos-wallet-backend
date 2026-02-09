import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { wallets, rpc, chains, tokens } from '../api';
import { mnemonicToAccount, privateKeyToAccount } from 'viem/accounts';
import { parseEther } from 'viem';

interface WalletData {
  id: string;
  address: string;
  name: string;
}

interface Chain {
  id: number;
  name: string;
  symbol: string;
  explorer: string;
}

export function Send() {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token');
  const chainFromUrl = searchParams.get('chain');
  const [walletsList, setWalletsList] = useState<WalletData[]>([]);
  const [chainList, setChainList] = useState<Chain[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<WalletData | null>(null);
  const [chainId, setChainId] = useState(chainFromUrl ? Number(chainFromUrl) : 1); // Ethereum mainnet
  const [tokenAddress, setTokenAddress] = useState<string | null>(tokenFromUrl);
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    wallets.list().then((res) => {
      setWalletsList(res.data.wallets);
      if (res.data.wallets.length > 0) setSelectedWallet(res.data.wallets[0]);
    });
    chains.list().then((res) => setChainList(res.data.chains));
  }, []);

  useEffect(() => {
    if (tokenFromUrl) setTokenAddress(tokenFromUrl);
    if (chainFromUrl) setChainId(Number(chainFromUrl));
  }, [tokenFromUrl, chainFromUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!selectedWallet || !to || !amount || !password) return;

    setLoading(true);
    try {
      if (tokenAddress) {
        // ERC-20 token transfer
        const { data: sendData } = await tokens.transfer(chainId, {
          walletId: selectedWallet.id,
          password,
          tokenAddress,
          to,
          amount,
        });
        setTxHash(sendData.hash);
      } else {
        // Native ETH transfer
        const valueWei = parseEther(amount);
        if (valueWei <= 0n) {
          setError('Invalid amount');
          setLoading(false);
          return;
        }
        const { data } = await wallets.unlock(selectedWallet.id, password);
        let account;
        if (data.mnemonic) {
          account = mnemonicToAccount(data.mnemonic);
        } else if (data.privateKey) {
          account = privateKeyToAccount(data.privateKey as `0x${string}`);
        } else {
          throw new Error('Could not unlock wallet');
        }
        const gasRes = await rpc.gas(chainId);
        const maxFee = BigInt(gasRes.data.maxFeePerGas || gasRes.data.gasPrice);
        const maxPriority = BigInt(gasRes.data.maxPriorityFeePerGas || 1e9);
        const tx = await account.signTransaction({
          to: to as `0x${string}`,
          value: valueWei,
          chainId,
          gas: 21000n,
          maxFeePerGas: maxFee,
          maxPriorityFeePerGas: maxPriority,
        });
        const { data: sendData } = await rpc.send(chainId, tx);
        const chain = chainList.find((c) => c.id === chainId);
        await wallets.recordTx(selectedWallet.id, {
          hash: sendData.hash,
          chainId,
          type: 'send',
          from: data.address,
          to,
          value: valueWei.toString(),
          tokenSymbol: chain?.symbol || 'ETH',
        });
        setTxHash(sendData.hash);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  const chain = chainList.find((c) => c.id === chainId);

  if (txHash) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-[var(--bg-card)] rounded-2xl p-8 border border-[var(--border)] text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--success)]/20 flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl text-[var(--success)]">✓</span>
          </div>
          <h1 className="text-xl font-semibold mb-2">Transaction sent</h1>
          <p className="text-[var(--text-muted)] mb-4 break-all font-mono text-sm">{txHash}</p>
          {chain && (
            <a
              href={`${chain.explorer}/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-cyan-300 font-medium"
            >
              View on explorer →
            </a>
          )}
          <button
            onClick={() => navigate('/')}
            className="mt-8 w-full py-3 rounded-xl gradient-accent text-slate-900 font-semibold shadow-lg shadow-cyan-500/20"
          >
            Back to wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md">
      <h1 className="text-xl font-semibold mb-2">Send {tokenAddress ? 'Token' : chain?.symbol || 'ETH'}</h1>
      <p className="text-[var(--text-secondary)] text-sm mb-6">Transfer to any EVM address</p>

      {tokenAddress && (
        <div className="mb-6 p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)]">
          <p className="text-xs text-[var(--text-muted)] mb-1">Token contract</p>
          <p className="font-mono text-sm truncate">{tokenAddress}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">From</label>
          <select
            value={selectedWallet?.id || ''}
            onChange={(e) => setSelectedWallet(walletsList.find((w) => w.id === e.target.value) || null)}
            className="w-full px-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--border-focus)] focus:ring-2 focus:ring-cyan-500/20 transition"
          >
            {walletsList.map((w) => (
              <option key={w.id} value={w.id}>{w.name} ({w.address.slice(0, 6)}...{w.address.slice(-4)})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Network</label>
          <select
            value={chainId}
            onChange={(e) => setChainId(Number(e.target.value))}
            className="w-full px-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--border-focus)] focus:ring-2 focus:ring-cyan-500/20 transition"
          >
            {chainList.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Recipient address</label>
          <input
            type="text"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border)] font-mono text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--border-focus)] focus:ring-2 focus:ring-cyan-500/20 transition"
            placeholder="0x..."
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Amount ({chain?.symbol || 'ETH'})</label>
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--border-focus)] focus:ring-2 focus:ring-cyan-500/20 transition"
            placeholder="0.0"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Wallet password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--border-focus)] focus:ring-2 focus:ring-cyan-500/20 transition"
            placeholder="Enter password to sign"
            required
          />
        </div>
        {error && <p className="text-[var(--error)] text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl gradient-accent text-slate-900 font-semibold shadow-lg shadow-cyan-500/20 hover:opacity-90 disabled:opacity-50 transition"
        >
          {loading ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
}
