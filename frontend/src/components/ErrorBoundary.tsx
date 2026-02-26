import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)] px-4">
          <div className="max-w-md w-full bg-[var(--bg-card)] rounded-2xl p-8 border border-[var(--border)] text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">!</span>
            </div>
            <h1 className="text-xl font-semibold mb-2 text-[var(--text-primary)]">
              Something went wrong
            </h1>
            <p className="text-[var(--text-secondary)] text-sm mb-6">
              {this.state.error?.message || "An unexpected error occurred."}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = "/";
              }}
              className="w-full py-3 rounded-xl gradient-accent text-slate-900 font-semibold shadow-lg shadow-cyan-500/20 hover:opacity-90 transition"
            >
              Back to wallet
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
