import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: '#f8f9fa',
          padding: '20px'
        }}>
          <div style={{ 
            maxWidth: '600px', 
            backgroundColor: 'white', 
            padding: '30px', 
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }}>
            <h1 style={{ color: '#dc3545', marginBottom: '20px' }}>
              ⚠️ Something went wrong
            </h1>
            <p style={{ color: '#6c757d', marginBottom: '20px' }}>
              The application encountered an error. Please try refreshing the page.
            </p>
            <details style={{ whiteSpace: 'pre-wrap', color: '#495057' }}>
              <summary style={{ cursor: 'pointer', marginBottom: '10px', fontWeight: 'bold' }}>
                Error Details
              </summary>
              <p style={{ 
                backgroundColor: '#f8f9fa', 
                padding: '15px', 
                borderRadius: '4px',
                fontSize: '14px',
                fontFamily: 'monospace',
                overflow: 'auto'
              }}>
                {this.state.error && this.state.error.toString()}
                <br />
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </p>
            </details>
            <button 
              onClick={() => window.location.reload()} 
              style={{
                marginTop: '20px',
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
