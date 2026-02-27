import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Wallet, Send, Download, Coins, LogOut } from "lucide-react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const loc = useLocation();

  const nav = [
    { to: "/", label: "Wallet", icon: Wallet },
    { to: "/send", label: "Send", icon: Send },
    { to: "/receive", label: "Receive", icon: Download },
    { to: "/assets", label: "Assets", icon: Coins },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex flex-col">
      <header className="border-b border-[var(--border)] bg-[var(--bg-elevated)]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 shrink-0 group"
          >
            <img src="/Lykos.png" alt="Carbon Crowd" className="w-9 h-9 rounded-lg shadow-md shadow-cyan-700/20 group-hover:shadow-cyan-700/30 transition" />
            <div className="flex flex-col leading-tight">
              <span className="text-lg font-semibold text-[var(--text-primary)] tracking-tight">Carbon Crowd Wallet</span>
              <span className="text-[10px] text-[var(--text-muted)] tracking-wide">Powered by LyKos Labs</span>
            </div>
          </Link>

          <nav className="flex items-center gap-1">
            {nav.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
                  loc.pathname === to
                    ? "bg-cyan-600/10 text-cyan-700"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-input)]"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <span className="text-sm text-[var(--text-muted)] truncate max-w-[160px]" title={user?.email}>
              {user?.email}
            </span>
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[var(--text-muted)] hover:text-[var(--error)] hover:bg-red-100 transition"
            >
              <LogOut className="w-4 h-4" />
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
        {children}
      </main>

      <footer className="border-t border-[var(--border)] py-4 text-center text-sm text-[var(--text-muted)]">
        © Carbon Crowd 2026. Powered by LyKos Labs.
      </footer>
    </div>
  );
}
