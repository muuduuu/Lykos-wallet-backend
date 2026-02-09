import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { wallets } from '../api';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check } from 'lucide-react';

interface WalletData {
  id: string;
  address: string;
  name: string;
}

export function Receive() {
  const [walletsList, setWalletsList] = useState<WalletData[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<WalletData | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    wallets.list().then((res) => {
      setWalletsList(res.data.wallets);
      if (res.data.wallets.length > 0) setSelectedWallet(res.data.wallets[0]);
    });
  }, []);

  const copyAddress = () => {
    if (!selectedWallet) return;
    navigator.clipboard.writeText(selectedWallet.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-xl font-semibold mb-2">Receive</h1>
      <p className="text-[var(--text-secondary)] text-sm mb-6">Scan or share your address to receive crypto</p>

      {walletsList.length > 0 && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Wallet</label>
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

          <div className="bg-white p-6 rounded-2xl inline-block">
            {selectedWallet && (
              <QRCodeSVG
                value={selectedWallet.address}
                size={200}
                level="M"
                includeMargin={true}
              />
            )}
          </div>

          <div className="bg-[var(--bg-card)] rounded-xl p-4 border border-[var(--border)]">
            <code className="text-sm font-mono break-all block text-left text-[var(--text-primary)]">{selectedWallet?.address}</code>
            <button
              onClick={copyAddress}
              className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[var(--bg-input)] hover:bg-cyan-500/10 text-cyan-400 font-medium transition"
            >
              {copied ? <Check className="w-4 h-4 text-[var(--success)]" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy address'}
            </button>
          </div>

          <p className="text-sm text-[var(--text-muted)]">
            Only send Ethereum and ERC-20 tokens to this address. Sending other assets may result in permanent loss.
          </p>
        </div>
      )}

      {walletsList.length === 0 && (
        <p className="text-[var(--text-secondary)]">
          No wallets yet. <Link to="/wallet/create" className="text-cyan-400 hover:text-cyan-300 font-medium">Create one</Link> first.
        </p>
      )}
    </div>
  );
}
