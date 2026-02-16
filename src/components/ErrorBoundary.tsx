import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 Error caught by boundary:', error);
    console.error('📍 Component stack:', errorInfo.componentStack);
    
    this.setState({
      error,
      errorInfo
    });
    
    // TODO: Send to error tracking service (Sentry, etc.)
    // this.logErrorToService(error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center p-8">
          <div className="max-w-2xl w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-8 shadow-xl">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
                <span className="text-4xl">😔</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[var(--color-text)] mb-1">
                  Bir şeyler ters gitti
                </h1>
                <p className="text-[var(--color-textSecondary)]">
                  Uygulama beklenmeyen bir hatayla karşılaştı
                </p>
              </div>
            </div>

            {/* Error Details */}
            <div className="mb-6">
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <h3 className="font-semibold text-red-600 mb-2">Hata Detayı:</h3>
                <p className="text-sm font-mono text-[var(--color-text)] break-all">
                  {this.state.error?.message || 'Bilinmeyen hata'}
                </p>
              </div>

              {/* Stack Trace (Development only) */}
              {import.meta.env.DEV && this.state.errorInfo && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-[var(--color-textSecondary)] hover:text-[var(--color-text)]">
                    Teknik Detaylar (Geliştiriciler için)
                  </summary>
                  <pre className="mt-2 p-4 bg-[var(--color-background)] rounded text-xs overflow-auto max-h-64">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={this.handleReload}
                className="flex-1 px-6 py-3 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-80 transition-opacity font-medium"
              >
                🔄 Uygulamayı Yeniden Yükle
              </button>
              <button
                onClick={this.handleReset}
                className="px-6 py-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-hover)] transition-colors font-medium"
              >
                ↩️ Geri Dön
              </button>
            </div>

            {/* Help Text */}
            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-[var(--color-textSecondary)]">
                💡 <strong>İpucu:</strong> Sorun devam ederse:
              </p>
              <ul className="mt-2 text-sm text-[var(--color-textSecondary)] space-y-1 ml-6">
                <li>• Tarayıcı önbelleğini temizleyin</li>
                <li>• Uygulamayı yeniden başlatın</li>
                <li>• Konsol loglarını kontrol edin (F12)</li>
                <li>• GitHub'da issue açın</li>
              </ul>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
