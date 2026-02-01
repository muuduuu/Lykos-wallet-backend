import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { wallets, rpc, chains } from '../api';
import { formatEther } from 'viem';
import { Wallet, Send, Download, Plus, LogOut, Copy, ExternalLink, Coins } from 'lucide-react';

interface Chain {
  id: number;
  name: string;
  symbol: string;
  explorer: string;
}

interface WalletData {
  id: string;
  address: string;
  name: string;
}

export function Dashboard() {
  const [walletsList, setWalletsList] = useState<WalletData[]>([]);
  const [chainList, setChainList] = useState<Chain[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<WalletData | null>(null);
  const [selectedChain, setSelectedChain] = useState(1); // Ethereum mainnet - real balances
  const [balance, setBalance] = useState<bigint | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const loadData = async () => {
    try {
      const [wRes, cRes] = await Promise.all([wallets.list(), chains.list()]);
      setWalletsList(wRes.data.wallets);
      setChainList(cRes.data.chains);
      if (wRes.data.wallets.length > 0 && !selectedWallet) {
        setSelectedWallet(wRes.data.wallets[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!selectedWallet) return;
    setBalanceLoading(true);
    setBalanceError(null);
    rpc.balance(selectedChain, selectedWallet.address)
      .then((res) => {
        setBalance(BigInt(res.data.balance));
        setBalanceError(null);
      })
      .catch((err) => {
        setBalance(null);
        setBalanceError(err.response?.data?.error || 'Failed to load balance');
      })
      .finally(() => setBalanceLoading(false));
  }, [selectedWallet, selectedChain]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const copyAddress = () => {
    if (!selectedWallet) return;
    navigator.clipboard.writeText(selectedWallet.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const chainInfo = chainList.find((c) => c.id === selectedChain);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <header className="border-b border-[var(--border)] px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet className="w-8 h-8 text-indigo-500" />
          <span className="font-bold text-lg">Lykos Wallet</span>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={selectedChain}
            onChange={(e) => setSelectedChain(Number(e.target.value))}
            className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm"
          >
            {chainList.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-[var(--text-muted)] hover:text-white"
          >
            <LogOut className="w-5 h-5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8">
        {walletsList.length === 0 ? (
          <div className="bg-[var(--bg-secondary)] rounded-2xl p-8 border border-[var(--border)] text-center">
            <p className="text-[var(--text-muted)] mb-6">No wallets yet. Create or import one to get started.</p>
            <div className="flex gap-4 justify-center">
              <Link
                to="/wallet/create"
                className="flex items-center gap-2 px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500"
              >
                <Plus className="w-5 h-5" />
                Create Wallet
              </Link>
              <Link
                to="/wallet/import"
                className="flex items-center gap-2 px-6 py-3 rounded-lg border border-[var(--border)] hover:bg-[var(--bg-secondary)]"
              >
                <Download className="w-5 h-5" />
                Import Wallet
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <label className="block text-sm text-[var(--text-muted)] mb-2">Wallet</label>
              <select
                value={selectedWallet?.id || ''}
                onChange={(e) => setSelectedWallet(walletsList.find((w) => w.id === e.target.value) || null)}
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-4 py-3 flex items-center"
              >
                {walletsList.map((w) => (
                  <option key={w.id} value={w.id}>{w.name} - {w.address.slice(0, 6)}...{w.address.slice(-4)}</option>
                ))}
              </select>
            </div>

            <div className="bg-[var(--bg-secondary)] rounded-2xl p-8 border border-[var(--border)] mb-6">
              <p className="text-[var(--text-muted)] text-sm mb-1">
                Balance — switch network above if your funds are on another chain
              </p>
              <p className="text-4xl font-bold mb-2">
                {balanceLoading ? (
                  <span className="text-[var(--text-muted)]">Loading...</span>
                ) : balance !== null ? (
                  `${parseFloat(formatEther(balance)).toFixed(6)} ${chainInfo?.symbol || 'ETH'}`
                ) : (
                  `— ${chainInfo?.symbol || 'ETH'}`
                )}
              </p>
              {balanceError && (
                <p className="text-red-400 text-sm mt-1">{balanceError}</p>
              )}
              <div className="flex items-center gap-2">
                <code className="text-sm text-[var(--text-muted)] font-mono bg-[var(--bg-primary)] px-3 py-1 rounded">
                  {selectedWallet?.address}
                </code>
                <button onClick={copyAddress} className="p-1 hover:bg-[var(--bg-primary)] rounded">
                  <Copy className="w-4 h-4" />
                </button>
                {chainInfo && (
                  <a
                    href={`${chainInfo.explorer}/address/${selectedWallet?.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 hover:bg-[var(--bg-primary)] rounded"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                {copied && <span className="text-green-400 text-sm">Copied!</span>}
              </div>
            </div>

            <div className="flex gap-4 flex-wrap">
              <Link
                to="/send"
                className="flex-1 min-w-[100px] flex items-center justify-center gap-2 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-medium"
              >
                <Send className="w-5 h-5" />
                Send
              </Link>
              <Link
                to="/receive"
                className="flex-1 min-w-[100px] flex items-center justify-center gap-2 py-4 rounded-xl border border-[var(--border)] hover:bg-[var(--bg-secondary)] font-medium"
              >
                <Download className="w-5 h-5" />
                Receive
              </Link>
              <Link
                to="/assets"
                className="flex-1 min-w-[100px] flex items-center justify-center gap-2 py-4 rounded-xl border border-[var(--border)] hover:bg-[var(--bg-secondary)] font-medium"
              >
                <Coins className="w-5 h-5" />
                Assets
              </Link>
            </div>

            <div className="mt-8 flex gap-4">
              <Link to="/wallet/create" className="text-indigo-500 hover:underline text-sm">+ Add wallet</Link>
              <Link to="/wallet/import" className="text-indigo-500 hover:underline text-sm">Import wallet</Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
