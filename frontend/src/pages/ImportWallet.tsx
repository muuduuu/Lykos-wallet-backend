import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { wallets } from '../api';

export function ImportWallet() {
  const [mode, setMode] = useState<'mnemonic' | 'privateKey'>('mnemonic');
  const [mnemonic, setMnemonic] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('Imported Wallet');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'mnemonic') {
        await wallets.import({ mnemonic: mnemonic.trim(), password, name });
      } else {
        await wallets.import({ privateKey: privateKey.trim(), password, name });
      }
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to import wallet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md">
      <h1 className="text-xl font-semibold mb-2">Import wallet</h1>
      <p className="text-[var(--text-secondary)] text-sm mb-6">Import using recovery phrase or private key</p>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setMode('mnemonic')}
          className={`flex-1 py-2.5 rounded-xl font-medium transition ${
            mode === 'mnemonic' ? 'gradient-accent shadow-lg shadow-cyan-700/20' : 'bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          Recovery phrase
        </button>
        <button
          onClick={() => setMode('privateKey')}
          className={`flex-1 py-2.5 rounded-xl font-medium transition ${
            mode === 'privateKey' ? 'gradient-accent shadow-lg shadow-cyan-700/20' : 'bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          Private key
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {mode === 'mnemonic' ? (
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Recovery phrase (12 or 24 words)</label>
            <textarea
              value={mnemonic}
              onChange={(e) => setMnemonic(e.target.value)}
              autoComplete="off"
              className="w-full px-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border)] font-mono text-sm min-h-[100px] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--border-focus)] focus:ring-2 focus:ring-cyan-500/20 transition"
              placeholder="word1 word2 word3 ..."
              required
            />
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Private key</label>
            <input
              type="password"
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
              autoComplete="off"
              className="w-full px-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border)] font-mono text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--border-focus)] focus:ring-2 focus:ring-cyan-500/20 transition"
              placeholder="0x..."
              required
            />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Wallet name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--border-focus)] focus:ring-2 focus:ring-cyan-500/20 transition"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Password to encrypt</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            className="w-full px-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--border-focus)] focus:ring-2 focus:ring-cyan-500/20 transition"
            minLength={8}
            required
          />
        </div>
        {error && <p className="text-[var(--error)] text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl gradient-accent font-semibold shadow-lg shadow-cyan-700/20 hover:opacity-90 disabled:opacity-50 transition"
        >
          {loading ? 'Importing...' : 'Import wallet'}
        </button>
      </form>
    </div>
  );
}
