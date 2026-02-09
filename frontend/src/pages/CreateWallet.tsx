import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { wallets } from '../api';
import { Copy, Check } from 'lucide-react';

export function CreateWallet() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [name, setName] = useState('Main Wallet');
  const [mnemonic, setMnemonic] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const { data } = await wallets.create(password, name);
      setMnemonic(data.mnemonic);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create wallet');
    } finally {
      setLoading(false);
    }
  };

  const copyMnemonic = () => {
    if (!mnemonic) return;
    navigator.clipboard.writeText(mnemonic);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (mnemonic) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6">
          <p className="text-amber-400 font-medium mb-2">Save your recovery phrase</p>
          <p className="text-sm text-[var(--text-secondary)]">
            Write these 12 words down and store them safely. Anyone with this phrase can access your wallet.
          </p>
        </div>
        <div className="bg-[var(--bg-card)] rounded-xl p-6 border border-[var(--border)] mb-6">
          <div className="grid grid-cols-2 gap-2 font-mono text-sm mb-4">
            {mnemonic.split(' ').map((word, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-[var(--text-muted)] w-6">{i + 1}.</span>
                <span className="text-[var(--text-primary)]">{word}</span>
              </div>
            ))}
          </div>
          <button
            onClick={copyMnemonic}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--bg-input)] hover:bg-cyan-500/10 text-cyan-400 font-medium transition"
          >
            {copied ? <Check className="w-4 h-4 text-[var(--success)]" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy phrase'}
          </button>
        </div>
        <label className="flex items-center gap-2 cursor-pointer mb-6 text-[var(--text-secondary)]">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="rounded border-[var(--border)]"
          />
          <span>I have saved my recovery phrase securely</span>
        </label>
        <button
          onClick={() => navigate('/')}
          disabled={!confirmed}
          className="w-full py-3 rounded-xl gradient-accent text-slate-900 font-semibold shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md">
      <h1 className="text-xl font-semibold mb-2">Create new wallet</h1>
      <p className="text-[var(--text-secondary)] text-sm mb-6">Generate a new HD wallet with a recovery phrase</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Wallet name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--border-focus)] focus:ring-2 focus:ring-cyan-500/20 transition"
            placeholder="Main Wallet"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--border-focus)] focus:ring-2 focus:ring-cyan-500/20 transition"
            minLength={8}
            placeholder="Min 8 characters"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Confirm password</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--border-focus)] focus:ring-2 focus:ring-cyan-500/20 transition"
            minLength={8}
            required
          />
        </div>
        {error && <p className="text-[var(--error)] text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl gradient-accent text-slate-900 font-semibold shadow-lg shadow-cyan-500/20 hover:opacity-90 disabled:opacity-50 transition"
        >
          {loading ? 'Creating...' : 'Create wallet'}
        </button>
      </form>
    </div>
  );
}
