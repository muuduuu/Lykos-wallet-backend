import 'dotenv/config';

const nodeEnv = process.env.NODE_ENV || 'development';
const isProd = nodeEnv === 'production';

if (isProd) {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required in production');
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'dev-secret-change-in-production') {
    throw new Error('JWT_SECRET must be set to a secure value in production');
  }
}

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv,
  isProd,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  databaseUrl: process.env.DATABASE_URL!,
  corsOrigins: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean)
    : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'],
  rpcUrls: {
    1: process.env.ETHEREUM_RPC_URL || (process.env.ALCHEMY_API_KEY ? `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}` : 'https://cloudflare-eth.com'),
    10: process.env.OPTIMISM_RPC_URL || (process.env.ALCHEMY_API_KEY ? `https://opt-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}` : 'https://mainnet.optimism.io'),
    137: process.env.POLYGON_RPC_URL || (process.env.ALCHEMY_API_KEY ? `https://polygon-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}` : 'https://polygon-rpc.com'),
    8453: process.env.BASE_RPC_URL || (process.env.ALCHEMY_API_KEY ? `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}` : 'https://mainnet.base.org'),
    42161: process.env.ARBITRUM_RPC_URL || (process.env.ALCHEMY_API_KEY ? `https://arb-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}` : 'https://arb1.arbitrum.io/rpc'),
    11155111: process.env.SEPOLIA_RPC_URL || (process.env.ALCHEMY_API_KEY ? `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}` : 'https://rpc.sepolia.org'),
  },
  etherscanKeys: {
    1: process.env.ETHERSCAN_API_KEY || '',
    10: process.env.OPTIMISM_ETHERSCAN_API_KEY || '',
    137: process.env.POLYGONSCAN_API_KEY || '',
    8453: process.env.BASESCAN_API_KEY || '',
    42161: process.env.ARBISCAN_API_KEY || '',
    11155111: process.env.SEPOLIA_ETHERSCAN_API_KEY || '',
  },
  alchemyApiKey: process.env.ALCHEMY_API_KEY || '',
  chains: {
    1: { name: 'Ethereum', symbol: 'ETH', decimals: 18, explorer: 'https://etherscan.io' },
    10: { name: 'Optimism', symbol: 'ETH', decimals: 18, explorer: 'https://optimistic.etherscan.io' },
    137: { name: 'Polygon', symbol: 'MATIC', decimals: 18, explorer: 'https://polygonscan.com' },
    8453: { name: 'Base', symbol: 'ETH', decimals: 18, explorer: 'https://basescan.org' },
    42161: { name: 'Arbitrum', symbol: 'ETH', decimals: 18, explorer: 'https://arbiscan.io' },
    11155111: { name: 'Sepolia', symbol: 'ETH', decimals: 18, explorer: 'https://sepolia.etherscan.io' },
  },
} as const;
