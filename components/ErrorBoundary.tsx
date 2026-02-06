'use client';

import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div 
          className="flex items-center justify-center min-h-[200px] p-6"
          role="alert"
          aria-live="assertive"
        >
          <div className="text-center max-w-md">
            <div className="text-4xl mb-3" aria-hidden="true">⚠️</div>
            <h2 className="text-lg font-semibold text-[#ededed] mb-2">
              Something went wrong
            </h2>
            <p className="text-sm text-[#888] mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="
                px-4 py-2 bg-[#d4a574] text-[#0a0a0a] font-medium rounded-lg
                hover:bg-[#c69563] transition-colors
              "
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
