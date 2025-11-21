import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // Log error to console in development
        if (import.meta.env.DEV) {
            console.error('Error caught by boundary:', error, errorInfo);
        }
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2rem',
                    fontFamily: 'Inter, system-ui, sans-serif',
                    backgroundColor: '#edf1f6',
                }}>
                    <div style={{
                        maxWidth: '500px',
                        textAlign: 'center',
                        backgroundColor: '#fff',
                        padding: '3rem 2rem',
                        borderRadius: '24px',
                        boxShadow: '0 20px 45px rgba(15, 23, 42, 0.12)',
                    }}>
                        <h1 style={{
                            fontSize: '2rem',
                            color: '#0f172a',
                            marginBottom: '1rem'
                        }}>
                            Oops! Something went wrong
                        </h1>
                        <p style={{
                            color: '#4a5564',
                            marginBottom: '2rem',
                            lineHeight: '1.6'
                        }}>
                            We encountered an unexpected error. Please try refreshing the page.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            style={{
                                backgroundColor: '#1f7bff',
                                color: '#fff',
                                border: 'none',
                                padding: '12px 32px',
                                borderRadius: '18px',
                                fontSize: '15px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                boxShadow: '0 10px 30px rgba(31, 123, 255, 0.3)',
                            }}
                        >
                            Refresh Page
                        </button>
                        {import.meta.env.DEV && this.state.error && (
                            <details style={{
                                marginTop: '2rem',
                                textAlign: 'left',
                                fontSize: '0.875rem',
                                color: '#6b7280'
                            }}>
                                <summary style={{ cursor: 'pointer', marginBottom: '0.5rem' }}>
                                    Error details (dev only)
                                </summary>
                                <pre style={{
                                    backgroundColor: '#f3f4f6',
                                    padding: '1rem',
                                    borderRadius: '8px',
                                    overflow: 'auto',
                                    fontSize: '0.75rem'
                                }}>
                                    {this.state.error.toString()}
                                </pre>
                            </details>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
