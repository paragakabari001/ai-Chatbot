import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("GlobalErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen w-screen bg-[#0A0A0A] text-white p-6 text-center font-sans">
          <div className="w-14 h-14 rounded-2xl bg-red-950/40 border border-red-800/60 text-red-400 flex items-center justify-center text-2xl mb-4 shadow-xl">
            ⚠️
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Workspace Recovery Mode</h1>
          <p className="text-xs text-neutral-400 max-w-md mb-6 leading-relaxed">
            The workspace encountered a temporary state conflict. Click below to reset stored sessions and reload cleanly.
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={this.handleReset}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg transition active:scale-95"
            >
              Reset Session & Reload
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2.5 rounded-xl bg-[#1C1C1C] hover:bg-[#252525] border border-neutral-700 text-neutral-200 text-xs font-semibold transition"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GlobalErrorBoundary>
      <App />
    </GlobalErrorBoundary>
  </React.StrictMode>
);
