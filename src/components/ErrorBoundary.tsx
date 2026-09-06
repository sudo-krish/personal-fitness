import { Component, ErrorInfo, ReactNode } from 'react';
import { RotateCcw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught React Error:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.clear();
    } catch {}
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            backgroundColor: '#F8FAFC',
            color: '#0F172A',
            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
          }}
        >
          <div
            style={{
              maxWidth: '400px',
              width: '100%',
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              padding: '28px 24px',
              textAlign: 'center',
              border: '1px solid #E2E8F0',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.05)',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '9999px',
                backgroundColor: '#FEE2E2',
                color: '#EF4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
              }}
            >
              <AlertTriangle style={{ width: '24px', height: '24px' }} />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>
              Display Refresh Needed
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#64748B', marginTop: '8px', lineHeight: 1.5 }}>
              A cached state was updated. Tap below to reload the fitness tracker cleanly.
            </p>
            <button
              type="button"
              onClick={this.handleReset}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
                padding: '12px 20px',
                marginTop: '20px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: '#0284C7',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.9375rem',
                cursor: 'pointer',
              }}
            >
              <RotateCcw style={{ width: '16px', height: '16px' }} />
              <span>Reload Tracker</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
