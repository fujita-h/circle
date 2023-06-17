import React from 'react';

type FallbackFunc = (error: Error, resetError: () => void) => React.ReactNode;

type ErrorBoundaryProps = {
  fallback?: React.ReactNode | FallbackFunc;
  children?: React.ReactNode;
};

type ErrorBoundaryState = {
  error: Error | null;
};

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ error });
  }

  render() {
    if (this.state.error) {
      return typeof this.props.fallback === 'function'
        ? this.props.fallback(this.state.error, () => this.setState({ error: null }))
        : this.props.fallback;
    }
    return this.props.children;
  }
}

export function DisplayBoundaryError({ error, resetError }: { error: Error; resetError: () => void }) {
  return (
    <div>
      <h1>Something went wrong</h1>
      <pre>{error.message}</pre>
      <button onClick={resetError}>Try again</button>
    </div>
  );
}
