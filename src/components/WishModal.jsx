import React, { useRef, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';

export default function WishModal() {
  const { activeModalWish, setActiveModalWish, wishes } = useApp();
  const cardRef = useRef(null);
  const [tiltStyle, setTiltStyle] = useState({});

  if (!activeModalWish) return null;

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const rotX = (-y / 15).toFixed(2);
    const rotY = (x / 15).toFixed(2);
    setTiltStyle({
      transform: `rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.02)`
    });
  };

  const handleTouchMove = (e) => {
    if (!cardRef.current || !e.touches[0]) return;
    const touch = e.touches[0];
    const rect = cardRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left - rect.width / 2;
    const y = touch.clientY - rect.top - rect.height / 2;
    const rotX = (-y / 18).toFixed(2);
    const rotY = (x / 18).toFixed(2);
    setTiltStyle({
      transform: `rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.02)`
    });
  };

  const handleReset = () => {
    setTiltStyle({
      transform: 'rotateX(0deg) rotateY(0deg) scale(1)'
    });
  };

  const handleNextWish = () => {
    const curIdx = wishes.findIndex(w => w.id === activeModalWish.id);
    const nextWish = wishes[(curIdx + 1) % wishes.length];
    setActiveModalWish(nextWish);
  };

  return (
    <div
      className="modal-overlay open"
      onClick={(e) => {
        if (e.target.classList.contains('modal-overlay')) {
          setActiveModalWish(null);
        }
      }}
    >
      <div
        className="tilt-perspective-box"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleReset}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleReset}
      >
        <div
          ref={cardRef}
          className="tilt-wish-card"
          style={tiltStyle}
        >
          <button
            className="btn-close-x"
            onClick={() => setActiveModalWish(null)}
            title="Đóng"
          >
            &times;
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '18px',
                background: activeModalWish.color || 'var(--rose-500)',
                color: '#fff',
                fontFamily: 'var(--font-serif)',
                fontSize: '1.6rem',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 6px 18px rgba(244, 63, 94, 0.3)'
              }}
            >
              {activeModalWish.name.charAt(0)}
            </div>
            <div>
              <h4
                className="font-serif"
                style={{ fontSize: '1.35rem', color: '#1E293B', marginBottom: '2px' }}
              >
                {activeModalWish.name}
              </h4>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  background: 'var(--rose-50)',
                  color: 'var(--rose-600)',
                  padding: '3px 12px',
                  borderRadius: '9999px',
                  border: '1px solid var(--rose-200)'
                }}
              >
                {activeModalWish.dept || 'Tech & Product'}
              </span>
            </div>
          </div>

          <div
            style={{
              background: 'var(--rose-50)',
              borderLeft: '4px solid var(--rose-500)',
              borderRadius: '14px',
              padding: '22px',
              marginBottom: '22px'
            }}
          >
            <p style={{ fontSize: '1.08rem', lineHeight: '1.85', color: '#334155', fontStyle: 'italic' }}>
              “{activeModalWish.text}”
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--rose-100)', paddingTop: '16px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: '#94A3B8' }}>
              Chạm ra ngoài để đóng
            </span>
            <button
              onClick={handleNextWish}
              className="btn-rose"
              style={{ padding: '10px 22px', fontSize: '0.88rem' }}
            >
              <span>Bóng tiếp theo 🎈</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
