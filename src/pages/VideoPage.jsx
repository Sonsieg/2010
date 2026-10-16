import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.jsx';

export default function VideoPage() {
  const { navigateWithFlowerTransition } = useApp();

  const quotes = [
    { text: "“Cảm ơn vì đã luôn làm cho công ty này rực rỡ, vui vẻ và có nhiều điều đáng nhớ hơn mỗi ngày!”", author: "Toàn thể anh em Tech & Product" },
    { text: "“Mọi sprint release cam go đều trở nên êm đềm hơn nhờ nụ cười và sự thấu cảm của các chị em!”", author: "Engineering & QA Family" },
    { text: "“Chúc các đóa hoa IT luôn tự tin, kiên cường, hạnh phúc và luôn là phiên bản tỏa sáng nhất!”", author: "From Brothers with Love" }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);

  useEffect(() => {
    if (!isAutoPlay) return;
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % quotes.length);
    }, 3800);
    return () => clearInterval(timer);
  }, [isAutoPlay]);

  return (
    <div className="page-screen" id="page-video">
      <div className="slideshow-cinema-box">
        <div style={{ fontSize: '3.2rem', marginBottom: '12px' }}>🎬</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--rose-200)', marginBottom: '16px' }}>
          Special Video &amp; Quotes Tribute
        </div>

        <h3
          key={currentIndex}
          className="font-serif slide-fade-in"
          style={{ fontSize: 'clamp(1.5rem, 3.8vw, 2.3rem)', fontStyle: 'italic', maxWidth: '750px', lineHeight: '1.5', marginBottom: '18px' }}
        >
          {quotes[currentIndex].text}
        </h3>

        <p
          key={`author-${currentIndex}`}
          className="slide-fade-in"
          style={{ fontFamily: 'var(--font-mono)', fontSize: '0.92rem', color: 'var(--rose-100)' }}
        >
          — {quotes[currentIndex].author}
        </p>

        {/* Controls */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
          <button
            onClick={() => setCurrentIndex((currentIndex - 1 + quotes.length) % quotes.length)}
            className="pill-btn"
            style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', borderColor: 'rgba(255,255,255,0.4)' }}
          >
            ‹
          </button>
          <button
            onClick={() => setIsAutoPlay(!isAutoPlay)}
            className="pill-btn"
            style={{ background: '#fff', color: 'var(--rose-600)', fontWeight: '700' }}
          >
            {isAutoPlay ? 'Tạm dừng ⏸' : 'Tự động chạy ▶️'}
          </button>
          <button
            onClick={() => setCurrentIndex((currentIndex + 1) % quotes.length)}
            className="pill-btn"
            style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', borderColor: 'rgba(255,255,255,0.4)' }}
          >
            ›
          </button>
        </div>
      </div>

      <div style={{ marginTop: '36px', textAlign: 'center' }}>
        <button
          onClick={() => navigateWithFlowerTransition('/party')}
          className="btn-rose"
          style={{ fontSize: '1.05rem' }}
        >
          <span>Màn Kết: Nhận Quà Thật &amp; Tải Thiệp Khoe Bạn Bè 🌸</span>
        </button>
      </div>
    </div>
  );
}
