import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL ?? '/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const auth = {
  register: (email: string, password: string, name?: string) =>
    api.post('/auth/register', { email, password, name }),
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
};

export const wallets = {
  list: () => api.get('/wallets'),
  create: (password: string, name?: string) =>
    api.post('/wallets/create', { password, name }),
  import: (data: { mnemonic?: string; privateKey?: string; password: string; name?: string }) =>
    api.post('/wallets/import', data),
  unlock: (walletId: string, password: string) =>
    api.post('/wallets/unlock', { walletId, password }),
  transactions: (id: string) => api.get(`/wallets/${id}/transactions`),
  recordTx: (id: string, tx: object) => api.post(`/wallets/${id}/transactions`, tx),
};

export const rpc = {
  balance: (chainId: number, address: string) =>
    api.get(`/rpc/${chainId}/balance/${address}`),
  gas: (chainId: number) => api.get(`/rpc/${chainId}/gas`),
  send: (chainId: number, signedTx: string) =>
    api.post(`/rpc/${chainId}/send`, { signedTx }),
  raw: (chainId: number, body: object) =>
    api.post(`/rpc/${chainId}`, body),
};

export const chains = {
  list: () => api.get('/chains'),
};

export const tokens = {
  balance: (chainId: number, address: string, tokenAddress: string) =>
    api.get(`/tokens/${chainId}/balance`, { params: { address, tokenAddress } }),
  balances: (chainId: number, address: string, tokenAddresses: string[]) =>
    api.post(`/tokens/${chainId}/balances`, { address, tokenAddresses }),
  transfer: (chainId: number, data: { walletId: string; password: string; tokenAddress: string; to: string; amount: string }) =>
    api.post(`/tokens/${chainId}/transfer`, data),
};

export const nfts = {
  all: (chainId: number, address: string, pageSize?: number, pageKey?: string) =>
    api.get(`/nfts/${chainId}/all`, { params: { address, pageSize, pageKey } }),
  owned: (chainId: number, address: string, contractAddress: string, limit?: number) =>
    api.get(`/nfts/${chainId}/owned`, { params: { address, contractAddress, limit } }),
  metadata: (chainId: number, contractAddress: string, tokenId: string) =>
    api.get(`/nfts/${chainId}/metadata`, { params: { contractAddress, tokenId } }),
  transfer: (chainId: number, data: { walletId: string; password: string; contractAddress: string; to: string; tokenId: string }) =>
    api.post(`/nfts/${chainId}/transfer`, data),
};

export const erc1155 = {
  balance: (chainId: number, address: string, contractAddress: string, tokenId: string) =>
    api.get(`/erc1155/${chainId}/balance`, { params: { address, contractAddress, tokenId } }),
  transfer: (chainId: number, data: { walletId: string; password: string; contractAddress: string; to: string; tokenId: string; amount: string }) =>
    api.post(`/erc1155/${chainId}/transfer`, data),
};
