import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { wallets, rpc, chains } from '../api';
import { formatEther } from 'viem';
import { Send, Download, Plus, Copy, ExternalLink, Coins } from 'lucide-react';
import { copyToClipboard, getUsdPrice } from '../utils';

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
  const [selectedChain, setSelectedChain] = useState(1);
  const [balance, setBalance] = useState<bigint | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [usdPrice, setUsdPrice] = useState<number | null>(null);

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
      .then((res: { data: { balance: string } }) => {
        setBalance(BigInt(res.data.balance));
        setBalanceError(null);
      })
      .catch((err: { response?: { data?: { error?: string } } }) => {
        setBalance(null);
        setBalanceError(err.response?.data?.error || 'Failed to load balance');
      })
      .finally(() => setBalanceLoading(false));
  }, [selectedWallet, selectedChain]);

  // Fetch USD price whenever selected chain changes
  useEffect(() => {
    if (!chainInfo) return;
    getUsdPrice(chainInfo.symbol).then(setUsdPrice);
  }, [selectedChain, chainList]);

  const copyAddress = async () => {
    if (!selectedWallet) return;
    const ok = await copyToClipboard(selectedWallet.address);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const chainInfo = chainList.find((c) => c.id === selectedChain);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-10 h-10 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {walletsList.length === 0 ? (
        <div className="max-w-md mx-auto">
          <div className="bg-[var(--bg-card)] rounded-2xl p-10 border border-[var(--border)] text-center">
            <div className="w-16 h-16 rounded-2xl bg-cyan-600/10 flex items-center justify-center mx-auto mb-6">
              <Plus className="w-8 h-8 text-cyan-700" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No wallets yet</h2>
            <p className="text-[var(--text-secondary)] mb-8">Create or import a wallet to get started</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/wallet/create"
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl gradient-accent font-semibold shadow-lg shadow-cyan-700/20 hover:opacity-90 transition"
              >
                <Plus className="w-5 h-5" />
                Create Wallet
              </Link>
              <Link
                to="/wallet/import"
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-input)] hover:border-cyan-600/30 transition font-medium"
              >
                <Download className="w-5 h-5" />
                Import Wallet
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex gap-4 mb-6 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Wallet</label>
              <select
                value={selectedWallet?.id || ''}
                onChange={(e) => setSelectedWallet(walletsList.find((w) => w.id === e.target.value) || null)}
                className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:border-[var(--border-focus)] focus:ring-2 focus:ring-cyan-500/20 transition"
              >
                {walletsList.map((w) => (
                  <option key={w.id} value={w.id}>{w.name} — {w.address.slice(0, 6)}...{w.address.slice(-4)}</option>
                ))}
              </select>
            </div>
            <div className="min-w-[140px]">
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Network</label>
              <select
                value={selectedChain}
                onChange={(e) => setSelectedChain(Number(e.target.value))}
                className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:border-[var(--border-focus)] focus:ring-2 focus:ring-cyan-500/20 transition"
              >
                {chainList.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-[var(--bg-card)] rounded-2xl p-8 border border-[var(--border)] shadow-sm mb-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-200/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            <p className="text-[var(--text-secondary)] text-sm mb-1">
              Balance — switch network if your funds are on another chain
            </p>
            <p className="text-4xl font-bold mb-1">
              {balanceLoading ? (
                <span className="text-[var(--text-muted)]">Loading...</span>
              ) : balance !== null ? (
                <span>{parseFloat(formatEther(balance)).toFixed(6)} <span className="text-cyan-700">{chainInfo?.symbol || 'ETH'}</span></span>
              ) : (
                <span>— {chainInfo?.symbol || 'ETH'}</span>
              )}
            </p>
            {balance !== null && usdPrice !== null && (
              <p className="text-lg text-[var(--text-secondary)] mb-3">
                ≈ ${(parseFloat(formatEther(balance)) * usdPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
              </p>
            )}
            {balance !== null && usdPrice === null && (
              <p className="text-sm text-[var(--text-muted)] mb-3">USD price unavailable</p>
            )}
            {balanceError && <p className="text-[var(--error)] text-sm mt-1">{balanceError}</p>}
            <div className="flex items-center gap-2 flex-wrap">
              <code className="text-sm text-[var(--text-muted)] font-mono bg-[var(--bg-input)] px-3 py-2 rounded-lg">
                {selectedWallet?.address}
              </code>
              <button
                onClick={copyAddress}
                className="p-2 rounded-lg hover:bg-[var(--bg-input)] text-[var(--text-secondary)] hover:text-cyan-700 transition"
                title="Copy"
              >
                <Copy className="w-4 h-4" />
              </button>
              {chainInfo && (
                <a
                  href={`${chainInfo.explorer}/address/${selectedWallet?.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg hover:bg-[var(--bg-input)] text-[var(--text-secondary)] hover:text-cyan-700 transition"
                  title="View on explorer"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
              {copied && <span className="text-[var(--success)] text-sm font-medium">Copied!</span>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <Link
              to="/send"
              className="flex items-center justify-center gap-3 py-5 rounded-xl gradient-accent font-semibold shadow-lg shadow-cyan-700/20 hover:opacity-90 transition"
            >
              <Send className="w-5 h-5" />
              Send
            </Link>
            <Link
              to="/receive"
              className="flex items-center justify-center gap-3 py-5 rounded-xl border border-[var(--border)] hover:bg-[var(--bg-input)] hover:border-cyan-600/30 transition font-medium"
            >
              <Download className="w-5 h-5" />
              Receive
            </Link>
            <Link
              to="/assets"
              className="flex items-center justify-center gap-3 py-5 rounded-xl border border-[var(--border)] hover:bg-[var(--bg-input)] hover:border-cyan-600/30 transition font-medium"
            >
              <Coins className="w-5 h-5" />
              Assets
            </Link>
          </div>

          <div className="flex gap-6">
            <Link to="/wallet/create" className="text-cyan-700 hover:text-cyan-600 text-sm font-medium transition">+ Add wallet</Link>
            <Link to="/wallet/import" className="text-cyan-700 hover:text-cyan-600 text-sm font-medium transition">Import wallet</Link>
          </div>
        </>
      )}
    </div>
  );
}
