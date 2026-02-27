/**
 * Copy text to clipboard with fallback for non-secure contexts (HTTP).
 * navigator.clipboard.writeText only works on HTTPS or localhost.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    // Fallback: create a temporary textarea
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '-9999px';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

/** Map chain symbol to CoinGecko ID */
const COINGECKO_IDS: Record<string, string> = {
  ETH: 'ethereum',
  MATIC: 'matic-network',
  POL: 'matic-network',
  AVAX: 'avalanche-2',
  BNB: 'binancecoin',
  FTM: 'fantom',
  OP: 'optimism',
  ARB: 'arbitrum',
};

let priceCache: { data: Record<string, number>; ts: number } = { data: {}, ts: 0 };
const CACHE_TTL = 60_000; // 1 minute

/** Fetch USD price for a chain symbol. Returns null on error. */
export async function getUsdPrice(symbol: string): Promise<number | null> {
  const id = COINGECKO_IDS[symbol.toUpperCase()];
  if (!id) return null;

  // Return cached price if fresh
  if (Date.now() - priceCache.ts < CACHE_TTL && priceCache.data[id] != null) {
    return priceCache.data[id];
  }

  try {
    const ids = Object.values(COINGECKO_IDS).join(',');
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`
    );
    if (!res.ok) return null;
    const json = await res.json();
    const data: Record<string, number> = {};
    for (const [key, val] of Object.entries(json)) {
      data[key] = (val as { usd: number }).usd;
    }
    priceCache = { data, ts: Date.now() };
    return data[id] ?? null;
  } catch {
    return null;
  }
}
