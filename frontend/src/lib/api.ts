const API = import.meta.env.VITE_API_URL || "";

function getToken(): string | null {
  return localStorage.getItem("token");
}

export async function api<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {}
): Promise<T> {
  const { token = getToken(), ...init } = options;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };
  if (token) (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, { ...init, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error?.message || data.error || res.statusText || "Request failed");
  return data as T;
}

export type User = { id: string; email: string; name: string | null; createdAt: string };
export type Wallet = { id: string; address: string; derivationPath?: string; createdAt: string };
export type Transaction = {
  id: string;
  hash: string | null;
  fromAddress: string;
  toAddress: string;
  valueWei: string;
  chainId: number;
  status: string;
  createdAt: string;
  direction: "out";
};

export const auth = {
  register: (email: string, password: string, name?: string) =>
    api<{ user: User; token: string }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
      token: null,
    }),
  login: (email: string, password: string) =>
    api<{ user: User; token: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
      token: null,
    }),
  me: () => api<User>("/api/auth/me"),
};

export const wallets = {
  list: () => api<{ wallets: Wallet[] }>("/api/wallets"),
  create: (password: string) =>
    api<{ wallet: Wallet; mnemonic: string[]; warning: string }>("/api/wallets", {
      method: "POST",
      body: JSON.stringify({ password }),
    }),
  import: (mnemonic: string, password: string) =>
    api<{ wallet: Wallet }>("/api/wallets/import", {
      method: "POST",
      body: JSON.stringify({ mnemonic: mnemonic.trim().replace(/\s+/g, " "), password }),
    }),
  balance: (walletId: string, chainId?: number) =>
    api<{ address: string; balance: string; chainId: number }>(
      `/api/wallets/${walletId}/balance${chainId != null ? `?chainId=${chainId}` : ""}`
    ),
  send: (walletId: string, password: string, to: string, valueWei: string, chainId = 1) =>
    api<{ transaction: { id: string; hash: string | null; status: string } }>("/api/wallets/send", {
      method: "POST",
      body: JSON.stringify({ walletId, password, to, valueWei, chainId }),
    }),
};

export const transactions = {
  list: (walletId: string) =>
    api<{ transactions: Transaction[] }>(`/api/wallets/${walletId}/transactions`),
};

export function formatEther(wei: string): string {
  const w = BigInt(wei);
  const eth = Number(w) / 1e18;
  if (eth >= 1e6) return eth.toExponential(2);
  if (eth >= 1) return eth.toFixed(4);
  if (eth >= 0.0001) return eth.toFixed(6);
  return eth.toFixed(8);
}

export function parseEther(eth: string): string {
  const parts = eth.replace(/,/g, "").split(".");
  const whole = parts[0] || "0";
  const frac = (parts[1] || "").padEnd(18, "0").slice(0, 18);
  return (BigInt(whole) * 10n ** 18n + BigInt(frac)).toString();
}

export function shortAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}
