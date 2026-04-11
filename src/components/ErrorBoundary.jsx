import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('React render error:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
          <h2 className="text-xl font-bold text-error mb-2">Something went wrong</h2>
          <p className="text-sm text-base-content/60 mb-4 max-w-md break-all">
            {this.state.error?.message || String(this.state.error)}
          </p>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              this.setState({ error: null });
              window.location.hash = '#/';
              window.location.reload();
            }}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
