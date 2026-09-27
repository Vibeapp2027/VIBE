import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: '',
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message || 'Erreur inconnue',
    };
  }

  componentDidCatch(error) {
    console.error('Erreur non gérée interceptée:', error);
  }

  handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-lg w-full rounded-2xl border border-rose-500/50 bg-slate-900 p-6 space-y-4">
            <h1 className="text-xl font-bold text-rose-400">Une erreur est survenue</h1>
            <p className="text-sm text-slate-300">
              L&apos;application a rencontré un problème inattendu. Vous pouvez recharger la page pour tenter une récupération.
            </p>
            <p className="text-xs text-slate-400">Détail technique: {this.state.errorMessage}</p>
            <button
              type="button"
              onClick={this.handleReload}
              className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold"
            >
              Recharger l&apos;application
            </button>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
