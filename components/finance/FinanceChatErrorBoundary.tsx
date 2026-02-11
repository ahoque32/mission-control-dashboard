'use client';

import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: string | null;
}

export default class FinanceChatErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error: error.message };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('FinanceChat error boundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-white/5 border border-white/10 rounded-xl backdrop-blur p-6">
          <div className="text-center">
            <span className="text-2xl mb-2 block">⚠️</span>
            <h3 className="text-sm font-medium text-foreground mb-1">
              Finance Chat Unavailable
            </h3>
            <p className="text-xs text-foreground-secondary mb-3">
              {this.state.error || 'Something went wrong loading the chat.'}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="text-xs px-3 py-1.5 rounded-lg bg-white/5 border border-white/10
                         text-foreground hover:bg-white/10 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
