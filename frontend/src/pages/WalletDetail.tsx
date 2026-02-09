import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { wallets, type WalletDetail as WalletDetailType, type TransactionRow } from "../api/client";

function shortenAddress(addr: string) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function formatBalance(bal: string) {
  const n = parseFloat(bal);
  if (n === 0) return "0";
  if (n < 0.0001) return "<0.0001";
  if (n < 1) return n.toFixed(4);
  return n.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

function weiToEth(wei: string) {
  const n = Number(BigInt(wei) / BigInt(1e18)) / 1e18;
  if (n === 0) return "0";
  if (n < 0.0001) return "<0.0001";
  return n.toFixed(4);
}

function explorerTxUrl(chainId: number, hash: string): string {
  if (chainId === 11155111) return `https://sepolia.etherscan.io/tx/${hash}`;
  return `https://etherscan.io/tx/${hash}`;
}

type Tab = "receive" | "send" | "transactions";

export default function WalletDetail() {
  const { id } = useParams<{ id: string }>();
  const [wallet, setWallet] = useState<WalletDetailType | null>(null);
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("receive");
  const [sendTo, setSendTo] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    wallets
      .get(id)
      .then(setWallet)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    wallets.transactions(id).then((r) => setTransactions(r.transactions)).catch(() => {});
  }, [id]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!id || !sendTo.trim() || !sendAmount.trim()) return;
    setSendError("");
    setSending(true);
    try {
      await wallets.send(id, sendTo.trim(), sendAmount.trim());
      setSendTo("");
      setSendAmount("");
      setTab("transactions");
      const res = await wallets.transactions(id);
      setTransactions(res.transactions);
      const w = await wallets.get(id);
      setWallet(w);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Send failed");
    } finally {
      setSending(false);
    }
  }

  function copyAddress() {
    if (!wallet?.address) return;
    navigator.clipboard.writeText(wallet.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading || !wallet) {
    return (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center">
        <div className="text-slate-400">{loading ? "Loading…" : error || "Wallet not found"}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-950">
      <header className="border-b border-surface-800 bg-surface-900/50 backdrop-blur">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-brand-400 hover:text-brand-300 text-sm">
            ← Wallets
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-white">{wallet.name}</h1>
          <p className="text-slate-400 text-sm font-mono">{shortenAddress(wallet.address)}</p>
        </div>

        <div className="rounded-2xl bg-surface-900 border border-surface-800 p-6 mb-6">
          <p className="text-slate-400 text-sm mb-1">Balance</p>
          <p className="text-2xl font-bold text-white">{formatBalance(wallet.balance)} ETH</p>
        </div>

        <div className="flex gap-2 mb-6 border-b border-surface-800 pb-2">
          {(["receive", "send", "transactions"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t
                  ? "bg-brand-500 text-white"
                  : "text-slate-400 hover:text-white hover:bg-surface-800"
              }`}
            >
              {t === "receive" ? "Receive" : t === "send" ? "Send" : "History"}
            </button>
          ))}
        </div>

        {tab === "receive" && (
          <div className="rounded-2xl bg-surface-900 border border-surface-800 p-6">
            <h2 className="text-lg font-semibold text-white mb-2">Your address</h2>
            <p className="text-slate-400 text-sm mb-4">
              Share this address to receive ETH and tokens.
            </p>
            <div className="bg-surface-800 rounded-xl p-4 font-mono text-sm text-slate-200 break-all select-all mb-4">
              {wallet.address}
            </div>
            <button
              onClick={copyAddress}
              className="w-full py-3 rounded-xl bg-brand-500 text-white font-semibold hover:bg-brand-600 transition-colors"
            >
              {copied ? "Copied!" : "Copy address"}
            </button>
          </div>
        )}

        {tab === "send" && (
          <form
            onSubmit={handleSend}
            className="rounded-2xl bg-surface-900 border border-surface-800 p-6 space-y-4"
          >
            <h2 className="text-lg font-semibold text-white">Send ETH</h2>
            {sendError && (
              <div className="p-3 rounded-lg bg-red-500/10 text-red-400 text-sm">{sendError}</div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Recipient address
              </label>
              <input
                type="text"
                value={sendTo}
                onChange={(e) => setSendTo(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-surface-800 border border-surface-800 text-white font-mono text-sm placeholder-slate-500 focus:border-brand-500"
                placeholder="0x…"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Amount (ETH)</label>
              <input
                type="text"
                value={sendAmount}
                onChange={(e) => setSendAmount(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-surface-800 border border-surface-800 text-white placeholder-slate-500 focus:border-brand-500"
                placeholder="0.0"
                required
                inputMode="decimal"
              />
              <p className="text-xs text-slate-500 mt-1">Available: {formatBalance(wallet.balance)} ETH</p>
            </div>
            <button
              type="submit"
              disabled={sending}
              className="w-full py-3 rounded-xl bg-brand-500 text-white font-semibold hover:bg-brand-600 disabled:opacity-50 transition-colors"
            >
              {sending ? "Sending…" : "Send"}
            </button>
          </form>
        )}

        {tab === "transactions" && (
          <div className="rounded-2xl bg-surface-900 border border-surface-800 overflow-hidden">
            {transactions.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                No transactions yet.
              </div>
            ) : (
              <ul className="divide-y divide-surface-800">
                {transactions.map((tx) => (
                  <li key={tx.id} className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-mono text-slate-300">
                          To {shortenAddress(tx.to)}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {tx.hash ? (
                            <a
                              href={explorerTxUrl(wallet.chainId, tx.hash)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-brand-400 hover:underline"
                            >
                              View on Explorer
                            </a>
                          ) : (
                            "Pending…"
                          )}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-medium">-{weiToEth(tx.valueWei)} ETH</p>
                        <p className="text-xs text-slate-500 capitalize">{tx.status}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
