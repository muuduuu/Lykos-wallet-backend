const API_BASE = "/api";

function getToken(): string | null {
  return localStorage.getItem("token");
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (res.status === 401) {
    localStorage.removeItem("token");
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data as T;
}

export type User = { id: string; email: string; createdAt: string };

export const auth = {
  register: (email: string, password: string) =>
    api<{ user: User; token: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  login: (email: string, password: string) =>
    api<{ user: User; token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  me: () => api<User>("/auth/me"),
};

export type WalletSummary = {
  id: string;
  name: string;
  chainId: number;
  address: string;
  balance: string;
  createdAt: string;
};

export type WalletDetail = WalletSummary;

export type TransactionRow = {
  id: string;
  hash: string | null;
  from: string;
  to: string;
  valueWei: string;
  status: string;
  blockNumber: number | null;
  createdAt: string;
};

export const wallets = {
  list: () => api<{ wallets: WalletSummary[] }>("/wallets"),
  create: (name?: string) =>
    api<{ wallet: WalletDetail; mnemonic?: string }>("/wallets/create", {
      method: "POST",
      body: JSON.stringify(name ? { name } : {}),
    }),
  import: (mnemonic: string, name?: string) =>
    api<{ wallet: WalletDetail }>("/wallets/import", {
      method: "POST",
      body: JSON.stringify({ mnemonic: mnemonic.trim(), name: name ?? "Imported" }),
    }),
  get: (id: string) => api<WalletDetail>(`/wallets/${id}`),
  balance: (id: string) => api<{ balance: string }>(`/wallets/${id}/balance`),
  send: (id: string, to: string, valueEth: string) =>
    api<{ hash: string; status: string }>(`/wallets/${id}/send`, {
      method: "POST",
      body: JSON.stringify({ to, valueEth }),
    }),
  transactions: (id: string) =>
    api<{ transactions: TransactionRow[] }>(`/wallets/${id}/transactions`),
};
