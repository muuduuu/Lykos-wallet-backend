import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { wallets, rpc, chains, tokens, nfts } from '../api';
import { formatEther } from 'viem';
import { Coins, Image as ImageIcon } from 'lucide-react';
import { COMMON_TOKENS } from '../constants/tokens';

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

interface TokenBalance {
  tokenAddress: string;
  balance: string;
  decimals: number;
  symbol: string;
  formatted: string;
}

interface NFT {
  tokenId: string;
  name: string;
  image: string | null;
  contractAddress?: string;
  contractName?: string | null;
}

export function Assets() {
  const [walletsList, setWalletsList] = useState<WalletData[]>([]);
  const [chainList, setChainList] = useState<Chain[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<WalletData | null>(null);
  const [selectedChain, setSelectedChain] = useState(1);
  const [nativeBalance, setNativeBalance] = useState<bigint | null>(null);
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [nftList, setNftList] = useState<NFT[]>([]);
  const [nftContract, setNftContract] = useState('');
  const [nftError, setNftError] = useState<string | null>(null);
  const [showContractSearch, setShowContractSearch] = useState(false);
  const [tokensLoading, setTokensLoading] = useState(true);
  const [nftsLoading, setNftsLoading] = useState(false);
  const [tab, setTab] = useState<'tokens' | 'nfts'>('tokens');

  useEffect(() => {
    wallets.list().then((r: { data: { wallets: WalletData[] } }) => {
      setWalletsList(r.data.wallets);
      if (r.data.wallets.length > 0) setSelectedWallet(r.data.wallets[0]);
    });
    chains.list().then((r: { data: { chains: Chain[] } }) => setChainList(r.data.chains));
  }, []);

  useEffect(() => {
    if (tab !== 'nfts' || !selectedWallet) return;
    setNftsLoading(true);
    setNftError(null);
    nfts.all(selectedChain, selectedWallet.address, 100)
      .then((r: { data: { nfts: NFT[] } }) => {
        setNftList(r.data.nfts || []);
        setNftError(null);
      })
      .catch((err: { response?: { data?: { error?: string } } }) => {
        setNftList([]);
        setNftError(err.response?.data?.error || 'Failed to load NFTs');
      })
      .finally(() => setNftsLoading(false));
  }, [tab, selectedWallet, selectedChain]);

  useEffect(() => {
    if (!selectedWallet) return;
    setTokensLoading(true);
    const tokenAddrs = COMMON_TOKENS[selectedChain]?.map((t) => t.address) || [];
    Promise.all([
      rpc.balance(selectedChain, selectedWallet.address).then((r: { data: { balance: string } }) => BigInt(r.data.balance)).catch(() => null),
      tokenAddrs.length > 0
        ? tokens.balances(selectedChain, selectedWallet.address, tokenAddrs).then((r: { data: { tokens: TokenBalance[] } }) =>
            r.data.tokens.filter((t: TokenBalance) => t.balance !== '0')
          ).catch(() => [])
        : Promise.resolve([]),
    ]).then(([bal, toks]) => {
      setNativeBalance(bal);
      setTokenBalances(toks);
    }).finally(() => setTokensLoading(false));
  }, [selectedWallet, selectedChain]);

  const loadNftsByContract = () => {
    if (!selectedWallet || !nftContract.trim()) return;
    setNftsLoading(true);
    setNftError(null);
    nfts.owned(selectedChain, selectedWallet.address, nftContract.trim(), 100)
      .then((r: { data: { nfts: NFT[] } }) => {
        setNftList(r.data.nfts || []);
        setNftError(null);
      })
      .catch(() => {
        setNftList([]);
        setNftError('Failed to load');
      })
      .finally(() => setNftsLoading(false));
  };

  const chainInfo = chainList.find((c) => c.id === selectedChain);

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-xl font-semibold mb-2">Assets</h1>
      <p className="text-sm text-[var(--text-secondary)] mb-6">
        ERC-20 tokens · ERC-721 NFTs · ERC-1155 · All EVM chains
      </p>

      <div className="flex gap-2 mb-6">
        <select
          value={selectedWallet?.id || ''}
          onChange={(e) => setSelectedWallet(walletsList.find((w) => w.id === e.target.value) || null)}
          className="flex-1 bg-[var(--bg-input)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:border-[var(--border-focus)] focus:ring-2 focus:ring-cyan-500/20 transition"
        >
          {walletsList.map((w) => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>
        <select
          value={selectedChain}
          onChange={(e) => setSelectedChain(Number(e.target.value))}
          className="bg-[var(--bg-input)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:border-[var(--border-focus)] focus:ring-2 focus:ring-cyan-500/20 transition"
        >
          {chainList.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border)] mb-6">
        <p className="text-[var(--text-secondary)] text-sm mb-1">Native {chainInfo?.symbol || 'ETH'}</p>
        <p className="text-2xl font-bold">
          {nativeBalance !== null ? parseFloat(formatEther(nativeBalance)).toFixed(6) : '—'} <span className="text-cyan-700">{chainInfo?.symbol}</span>
        </p>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('tokens')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition ${
            tab === 'tokens' ? 'gradient-accent shadow-lg shadow-cyan-700/20' : 'bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Coins className="w-5 h-5" />
          Tokens
        </button>
        <button
          onClick={() => setTab('nfts')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition ${
            tab === 'nfts' ? 'gradient-accent shadow-lg shadow-cyan-700/20' : 'bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <ImageIcon className="w-5 h-5" />
          NFTs
        </button>
      </div>

        {tab === 'tokens' && (
          <div className="space-y-2">
            {tokensLoading ? (
              <div className="animate-pulse h-16 bg-[var(--bg-card)] rounded-xl" />
            ) : tokenBalances.length === 0 ? (
              <p className="text-[var(--text-secondary)] text-center py-8">
                No ERC-20 token balances. Use Send to transfer tokens.
              </p>
            ) : (
              tokenBalances.map((t) => (
                <div
                  key={t.tokenAddress}
                  className="bg-[var(--bg-card)] rounded-xl p-4 border border-[var(--border)] flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">{t.symbol}</p>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {parseFloat(t.formatted).toLocaleString(undefined, { maximumFractionDigits: 6 })}
                    </p>
                  </div>
                  <Link
                    to={`/send?token=${t.tokenAddress}&chain=${selectedChain}`}
                    className="text-cyan-700 text-sm font-medium hover:text-cyan-600 transition"
                  >
                    Send
                  </Link>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'nfts' && (
          <div className="space-y-4">
            <p className="text-sm text-[var(--text-secondary)]">
              All your NFTs in one place — switch chain above to see NFTs on each network.
            </p>

            {nftError && (
              <div className="rounded-lg bg-amber-50 border border-amber-300 p-4 text-sm">
                <p className="text-amber-700">{nftError}</p>
                {nftError.includes('ALCHEMY') && (
                  <p className="mt-2 text-amber-600">
                    Add ALCHEMY_API_KEY to .env (free at alchemy.com). Or search by contract below.
                  </p>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowContractSearch(!showContractSearch)}
              className="text-sm text-cyan-700 hover:text-cyan-600 font-medium transition"
            >
              {showContractSearch ? '− Hide' : '+ Search by contract address'}
            </button>

            {showContractSearch && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nftContract}
                  onChange={(e) => setNftContract(e.target.value)}
                  placeholder="NFT contract address (0x...)"
                  className="flex-1 bg-[var(--bg-input)] border border-[var(--border)] rounded-xl px-4 py-3 font-mono text-sm text-[var(--text-primary)] focus:border-[var(--border-focus)] focus:ring-2 focus:ring-cyan-500/20 transition"
                />
                <button
                  onClick={loadNftsByContract}
                  disabled={!nftContract.trim() || nftsLoading}
                  className="px-4 py-3 rounded-xl gradient-accent font-semibold disabled:opacity-50 transition"
                >
                  Load
                </button>
              </div>
            )}

            {nftsLoading ? (
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="animate-pulse aspect-square bg-[var(--bg-card)] rounded-xl" />
                ))}
              </div>
            ) : nftList.length === 0 ? (
              <p className="text-[var(--text-secondary)] text-center py-8">
                {showContractSearch
                  ? 'Enter an ERC-721 contract address above to load NFTs.'
                  : 'No NFTs found. Switch chain or add ALCHEMY_API_KEY for full indexing.'}
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {nftList.map((nft) => (
                  <div
                    key={`${nft.contractAddress || ''}-${nft.tokenId}`}
                    className="bg-[var(--bg-card)] rounded-xl overflow-hidden border border-[var(--border)]"
                  >
                    <div className="aspect-square bg-[var(--bg-primary)] flex items-center justify-center overflow-hidden">
                      {nft.image ? (
                        <img src={nft.image} alt={nft.name} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <ImageIcon className="w-12 h-12 text-[var(--text-muted)]" />
                      )}
                    </div>
                    <p className="p-2 text-sm font-medium truncate">{nft.name}</p>
                    {nft.contractName && (
                      <p className="px-2 pb-2 text-xs text-[var(--text-secondary)] truncate">{nft.contractName}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
    </div>
  );
}
