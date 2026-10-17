import React from 'react';

/**
 * Enterprise-grade Error Boundary for React SPA
 * Handles WebGL context loss or runtime errors with graceful degradation
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    try {
      localStorage.removeItem('tribute_mode');
    } catch (e) {}
    window.location.hash = '#/';
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1E0F18 0%, #3D1326 100%)',
          color: '#FAF3EA',
          fontFamily: "'Be Vietnam Pro', sans-serif",
          padding: '24px',
          textAlign: 'center'
        }}>
          <div style={{
            background: 'rgba(255, 241, 242, 0.08)',
            border: '1.5px solid rgba(244, 63, 94, 0.35)',
            borderRadius: '24px',
            padding: '36px 28px',
            maxWidth: '480px',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🌸</div>
            <h2 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: '1.6rem',
              color: '#FECDD3',
              marginBottom: '12px'
            }}>
              Một chút sự cố nhỏ đã xảy ra
            </h2>
            <p style={{
              fontSize: '0.92rem',
              color: 'rgba(250, 243, 234, 0.85)',
              lineHeight: 1.6,
              marginBottom: '24px'
            }}>
              Trang web đang chuyển hướng an toàn về bản 2D Cổ Tích nhẹ nhàng để bạn tiếp tục tận hưởng ngày 20/10 trọn vẹn nhất.
            </p>
            <button
              onClick={this.handleReset}
              style={{
                background: 'linear-gradient(135deg, #F43F5E, #E11D48)',
                color: '#FFF',
                border: 'none',
                padding: '12px 28px',
                borderRadius: '50px',
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 8px 20px rgba(244, 63, 94, 0.4)'
              }}
            >
              Về Trang Chủ 2D 🎁
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
