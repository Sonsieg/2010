import React from 'react';

/**
 * Elegant Champagne & Rose Petal Shimmer Loader for Suspense lazy chunks
 */
export default function PageLoader() {
  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      color: '#8C2F4B',
      fontFamily: "'Playfair Display', serif",
      textAlign: 'center'
    }}>
      <div style={{
        position: 'relative',
        width: '64px',
        height: '64px',
        marginBottom: '20px'
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: '3px solid rgba(244, 63, 94, 0.15)',
          borderTopColor: '#F43F5E',
          animation: 'spinLoader 1s linear infinite'
        }} />
        <div style={{
          position: 'absolute',
          inset: '8px',
          borderRadius: '50%',
          border: '2px solid rgba(201, 166, 107, 0.2)',
          borderBottomColor: '#C9A66B',
          animation: 'spinLoaderReverse 1.4s linear infinite'
        }} />
        <span style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.4rem'
        }}>
          🌸
        </span>
      </div>
      <p style={{
        fontSize: '1.05rem',
        fontWeight: 600,
        letterSpacing: '0.04em',
        color: '#8C2F4B',
        margin: 0
      }}>
        Đang mở trang...
      </p>
      <small style={{
        fontFamily: "'Be Vietnam Pro', sans-serif",
        fontSize: '0.8rem',
        color: 'rgba(140, 47, 75, 0.7)',
        marginTop: '6px'
      }}>
        Chờ chút xíu nha ✨
      </small>

      <style>{`
        @keyframes spinLoader {
          to { transform: rotate(360deg); }
        }
        @keyframes spinLoaderReverse {
          to { transform: rotate(-360deg); }
        }
      `}</style>
    </div>
  );
}
