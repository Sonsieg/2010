import React, { useEffect, useState } from 'react';

const LOADING_STEPS = [
  'Đang tải mô-đun JavaScript...',
  'Đang chuẩn bị thư viện đồ họa 3D...',
  'Sắp mở không gian 3D...'
];

/**
 * Elegant Champagne & Rose Petal Shimmer Loader for Suspense lazy chunks
 */
export default function PageLoader() {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setStepIndex((current) => Math.min(current + 1, LOADING_STEPS.length - 1));
    }, 900);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 90000,
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      color: '#8C2F4B',
      fontFamily: "'Playfair Display', serif",
      textAlign: 'center',
      background: 'radial-gradient(circle at 50% 38%, #4a1733 0%, #1e0f18 58%, #10070c 100%)'
    }} role="status" aria-live="polite" aria-label="Đang tải ứng dụng">
      <div style={{
        position: 'relative',
        width: '64px',
        height: '64px',
        marginBottom: '20px'
      }}>
        <div className="page-loader-ring" style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: '3px solid rgba(244, 63, 94, 0.15)',
          borderTopColor: '#F43F5E',
          animation: 'spinLoader 1s linear infinite'
        }} />
        <div className="page-loader-ring page-loader-ring-secondary" style={{
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
        Đang mở món quà cho Clouda...
      </p>
      <small style={{
        fontFamily: "'Be Vietnam Pro', sans-serif",
        fontSize: '0.8rem',
        color: 'rgba(140, 47, 75, 0.7)',
        marginTop: '6px'
      }}>
        {LOADING_STEPS[stepIndex]}
      </small>

      <div className="page-loader-track" aria-hidden="true">
        <span className="page-loader-bar" />
      </div>

      <style>{`
        @keyframes spinLoader {
          to { transform: rotate(360deg); }
        }
        @keyframes spinLoaderReverse {
          to { transform: rotate(-360deg); }
        }
        .page-loader-track {
          width: min(320px, 78vw);
          height: 4px;
          margin-top: 18px;
          overflow: hidden;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.12);
        }
        .page-loader-bar {
          display: block;
          width: 42%;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #8C2F4B, #FDA4AF, #C9A66B);
          animation: pageLoaderSweep 1.15s ease-in-out infinite;
        }
        @keyframes pageLoaderSweep {
          from { transform: translateX(-110%); }
          to { transform: translateX(340%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .page-loader-ring, .page-loader-bar { animation: none !important; }
          .page-loader-bar { width: 100%; opacity: 0.72; }
        }
      `}</style>
    </div>
  );
}
