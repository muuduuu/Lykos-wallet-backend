import { useEffect, useState } from "react";
import { formatEther, shortAddress, wallets, transactions, type Wallet, type Transaction } from "../lib/api";

const CHAIN_NAMES: Record<number, string> = {
  1: "Ethereum",
  11155111: "Sepolia",
};

export default function History() {
  const [walletList, setWalletList] = useState<Wallet[]>([]);
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    wallets.list().then(({ wallets: w }) => {
      setWalletList(w);
      if (w.length && !selectedWalletId) setSelectedWalletId(w[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedWalletId) {
      setTxs([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    transactions
      .list(selectedWalletId)
      .then((r) => setTxs(r.transactions))
      .catch(() => setTxs([]))
      .finally(() => setLoading(false));
  }, [selectedWalletId]);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-100 mb-6">Transaction history</h1>

      {walletList.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-400 mb-1">Wallet</label>
          <select
            value={selectedWalletId || ""}
            onChange={(e) => setSelectedWalletId(e.target.value || null)}
            className="w-full px-4 py-3 rounded-xl bg-surface-800 border border-surface-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500"
          >
            {walletList.map((w) => (
              <option key={w.id} value={w.id}>
                {shortAddress(w.address)}
              </option>
            ))}
          </select>
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-slate-500">Loading…</div>
      ) : txs.length === 0 ? (
        <div className="py-12 text-center text-slate-500 bg-surface-900 border border-surface-800 rounded-2xl">
          No transactions yet. Outgoing sends will appear here.
        </div>
      ) : (
        <ul className="space-y-2">
          {txs.map((tx) => (
            <li
              key={tx.id}
              className="flex items-center justify-between gap-4 p-4 bg-surface-900 border border-surface-800 rounded-xl"
            >
              <div className="min-w-0">
                <p className="text-slate-300 font-medium">
                  Sent {formatEther(tx.valueWei)} ETH to {shortAddress(tx.toAddress)}
                </p>
                <p className="text-sm text-slate-500 mt-0.5">
                  {new Date(tx.createdAt).toLocaleString()} · {CHAIN_NAMES[tx.chainId] ?? tx.chainId}
                </p>
              </div>
              {tx.hash && (
                <a
                  href={
                    tx.chainId === 1
                      ? `https://etherscan.io/tx/${tx.hash}`
                      : `https://sepolia.etherscan.io/tx/${tx.hash}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 text-sm text-brand-400 hover:text-brand-300"
                >
                  View
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
