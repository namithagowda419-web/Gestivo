import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, MessageSquare } from 'lucide-react';
import { PinkCatMascot } from '../mascots/Mascots';

interface Props {
  children: ReactNode;
  onSwitchToBoard?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class CueCameraErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Cue Camera encountered an error caught by boundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full glass-panel-glow p-6 sm:p-8 rounded-3xl border border-rose-400/40 text-white text-center max-w-xl mx-auto shadow-2xl my-6">
          <PinkCatMascot
            size={60}
            speechText="The camera had a problem. Your board still works! You can do it! 💖"
            className="justify-center mb-4"
          />

          <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-300 flex items-center justify-center mx-auto mb-4 border border-rose-400/30">
            <AlertCircle size={36} />
          </div>

          <h3 className="text-xl sm:text-2xl font-black font-heading mb-2 text-white">
            Cue Camera Had a Problem
          </h3>

          <p className="text-sm text-slate-200 mb-4 leading-relaxed font-semibold">
            The camera had a problem. Your communication board still works.
          </p>

          <div className="p-3 bg-black/30 rounded-xl text-xs text-rose-200 font-mono mb-5 text-left overflow-x-auto">
            {this.state.error?.message || 'Unknown camera runtime error'}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              id="camera-error-reload-btn"
              onClick={() => window.location.reload()}
              className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-heading font-extrabold text-sm shadow-md cursor-pointer flex items-center justify-center gap-2"
            >
              <RefreshCw size={16} />
              <span>Reload</span>
            </button>

            <button
              onClick={this.handleReset}
              className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-heading font-extrabold text-sm border border-white/20 cursor-pointer flex items-center justify-center gap-2"
            >
              <RefreshCw size={16} />
              <span>Try again</span>
            </button>

            {this.props.onSwitchToBoard && (
              <button
                onClick={this.props.onSwitchToBoard}
                className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-heading font-extrabold text-sm border border-white/20 cursor-pointer flex items-center justify-center gap-2"
              >
                <MessageSquare size={16} />
                <span>Back to board</span>
              </button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
