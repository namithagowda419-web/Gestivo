import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { NimoMascot } from '../mascots/Mascots';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class RootErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[GESTIVO RootErrorBoundary] Caught uncaught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render() {
    if (this.state.hasError) {
      const isDebug = typeof window !== 'undefined' && window.location.search.includes('debug=1');

      return (
        <div className="min-h-screen w-full bg-[#12082b] text-white flex items-center justify-center p-4 sm:p-6 select-none font-nunito">
          <div className="w-full max-w-xl card-light p-6 sm:p-8 rounded-[36px] shadow-2xl border-4 border-purple-300/40 text-center relative overflow-hidden">
            {/* Top decorative ambient glow */}
            <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />

            {/* Mascot Icon */}
            <div className="w-24 h-24 mx-auto mb-4 relative flex items-center justify-center">
              <NimoMascot size={64} showBubble={false} />
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center shadow-lg border-2 border-white">
                <AlertTriangle size={18} />
              </div>
            </div>

            <span className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full bg-purple-100 text-purple-800 font-heading inline-block mb-2">
              GESTIVO Safety Shield
            </span>

            <h1 className="text-2xl sm:text-3xl font-black font-heading text-indigo-950 mb-2">
              Oops! A Little Hiccup Happened
            </h1>

            <p className="text-sm text-slate-600 font-semibold mb-6 max-w-md mx-auto leading-relaxed">
              Don't worry! Your saved sentences, communication goals, and child profile are safely stored.
              Let's refresh to get everything running smoothly again.
            </p>

            {/* Error Message Box */}
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-left mb-6">
              <div className="text-xs font-bold text-rose-800 font-mono break-words">
                {this.state.error?.message || 'An unexpected application error occurred.'}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                id="root-error-reload-btn"
                onClick={this.handleReload}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-heading font-black text-sm shadow-xl shadow-blue-500/25 cursor-pointer flex items-center justify-center gap-2 transition-all transform active:scale-95"
              >
                <RefreshCw size={18} />
                <span>Reload App</span>
              </button>

              <button
                onClick={this.handleReset}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-heading font-black text-sm border border-slate-300 cursor-pointer flex items-center justify-center gap-2 transition-all"
              >
                <Home size={18} />
                <span>Try to Recover</span>
              </button>
            </div>

            {/* Technical Stack Details for Developers or ?debug=1 */}
            {(isDebug || this.state.showDetails) && this.state.errorInfo && (
              <div className="mt-6 pt-4 border-t border-slate-200 text-left">
                <span className="text-[11px] font-bold text-slate-500 block mb-1">
                  Component Stack Trace:
                </span>
                <pre className="text-[10px] font-mono bg-slate-900 text-emerald-400 p-3 rounded-xl overflow-x-auto max-h-40 scrollbar-thin">
                  {this.state.errorInfo.componentStack}
                </pre>
              </div>
            )}

            {!isDebug && !this.state.showDetails && (
              <button
                onClick={() => this.setState({ showDetails: true })}
                className="mt-4 text-[11px] text-slate-400 hover:text-slate-600 font-semibold underline cursor-pointer"
              >
                Show technical diagnostics
              </button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
