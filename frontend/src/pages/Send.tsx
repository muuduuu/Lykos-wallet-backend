import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { wallets, rpc, chains, tokens } from '../api';
import { mnemonicToAccount, privateKeyToAccount } from 'viem/accounts';
import { parseEther } from 'viem';
import { ArrowLeft } from 'lucide-react';

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
      <div className="min-h-screen bg-[var(--bg-primary)] px-4 py-8">
        <div className="max-w-md mx-auto text-center">
          <div className="text-green-400 text-6xl mb-4">✓</div>
          <h1 className="text-xl font-semibold mb-2">Transaction sent</h1>
          <p className="text-[var(--text-muted)] mb-4 break-all font-mono text-sm">{txHash}</p>
          {chain && (
            <a
              href={`${chain.explorer}/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-500 hover:underline"
            >
              View on explorer →
            </a>
          )}
          <button
            onClick={() => navigate('/')}
            className="mt-8 w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500"
          >
            Back to wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] px-4 py-8">
      <Link to="/" className="flex items-center gap-2 text-[var(--text-muted)] hover:text-white mb-8">
        <ArrowLeft className="w-5 h-5" />
        Back
      </Link>
      <div className="max-w-md mx-auto">
        <h1 className="text-xl font-semibold mb-6">
          Send {tokenAddress ? 'Token' : chain?.symbol || 'ETH'}
        </h1>
        {tokenAddress && (
          <div className="mb-4 p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
            <p className="text-xs text-[var(--text-muted)]">Token contract</p>
            <p className="font-mono text-sm truncate">{tokenAddress}</p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-[var(--text-muted)] mb-2">From</label>
            <select
              value={selectedWallet?.id || ''}
              onChange={(e) => setSelectedWallet(walletsList.find((w) => w.id === e.target.value) || null)}
              className="w-full px-4 py-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]"
            >
              {walletsList.map((w) => (
                <option key={w.id} value={w.id}>{w.name} ({w.address.slice(0, 6)}...{w.address.slice(-4)})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-[var(--text-muted)] mb-2">Network</label>
            <select
              value={chainId}
              onChange={(e) => setChainId(Number(e.target.value))}
              className="w-full px-4 py-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]"
            >
              {chainList.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-[var(--text-muted)] mb-2">Recipient address</label>
            <input
              type="text"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] font-mono"
              placeholder="0x..."
              required
            />
          </div>
          <div>
            <label className="block text-sm text-[var(--text-muted)] mb-2">Amount ({chain?.symbol || 'ETH'})</label>
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]"
              placeholder="0.0"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-[var(--text-muted)] mb-2">Wallet password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]"
              placeholder="Enter password to sign"
              required
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 font-medium disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}
