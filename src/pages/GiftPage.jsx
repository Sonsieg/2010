import React, { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import confetti from 'canvas-confetti';

export default function GiftPage() {
  const { people, selectedSister, setSelectedSister, navigateWithFlowerTransition } = useApp();
  const [isLidOpened, setIsLidOpened] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPeople = people.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
    (p.dept && p.dept.toLowerCase().includes(searchTerm.toLowerCase().trim()))
  );

  const handleOpenGift = () => {
    if (isLidOpened) return;
    setIsLidOpened(true);

    confetti({
      particleCount: 90,
      spread: 90,
      origin: { y: 0.6 },
      colors: ['#F43F5E', '#FDA4AF', '#FCD34D', '#FFF1F2', '#FECDD3']
    });

    setTimeout(() => {
      navigateWithFlowerTransition('/letter');
    }, 700);
  };

  const handleSelectSister = (person) => {
    setSelectedSister(person);
    handleOpenGift();
  };

  return (
    <div className="page-screen" id="page-gift">
      <div className="gift-badge">
        <span>🌸</span>
        <span>
          {selectedSister ? `Gửi riêng tặng: Chị ${selectedSister.name}` : 'Món Quà Bí Mật 20/10'}
        </span>
      </div>

      <h1 className="page-hero-title">
        Món Quà Đặc Biệt Dành Tặng Chị Em 🎁
      </h1>
      <p className="page-hero-sub">
        Có một chiếc hộp bí mật chứa đựng những điều ngọt ngào nhất từ toàn thể anh em công ty gửi đến bạn...
      </p>

      {/* 3D Gift Box Component */}
      <div
        className={`gift-wrapper ${isLidOpened ? 'gift-opened' : 'gift-wobble'}`}
        onClick={handleOpenGift}
        title="Chạm để mở hộp quà!"
      >
        <svg className="gift-box-svg" viewBox="0 0 220 220" fill="none">
          <ellipse cx="110" cy="205" rx="75" ry="14" fill="#F43F5E" opacity="0.25" />
          <rect x="45" y="90" width="130" height="105" rx="18" fill="url(#boxGrad)" />
          <rect x="100" y="90" width="20" height="105" fill="url(#goldGrad)" />

          <g className="gift-lid-part">
            <rect x="35" y="70" width="150" height="28" rx="8" fill="url(#lidGrad)" />
            <rect x="100" y="70" width="20" height="28" fill="url(#goldGrad)" />
            <path d="M110 70 C95 40 65 45 78 68 C88 80 110 70 110 70 Z" fill="url(#goldGrad)" />
            <path d="M110 70 C125 40 155 45 142 68 C132 80 110 70 110 70 Z" fill="url(#goldGrad)" />
            <circle cx="110" cy="69" r="9" fill="#F59E0B" />
          </g>

          <defs>
            <linearGradient id="boxGrad" x1="45" y1="90" x2="175" y2="195" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FB7185" />
              <stop offset="1" stopColor="#E11D48" />
            </linearGradient>
            <linearGradient id="lidGrad" x1="35" y1="70" x2="185" y2="98" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FDA4AF" />
              <stop offset="1" stopColor="#F43F5E" />
            </linearGradient>
            <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
              <stop stopColor="#FCD34D" />
              <stop offset="1" stopColor="#D97706" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <button onClick={handleOpenGift} className="btn-rose" style={{ fontSize: '1.05rem' }}>
          <span>Mở Hộp Quà Ngay 🌸</span>
        </button>
      </div>

      {/* Smart Name Selector Card nếu chưa chọn tên */}
      {!selectedSister && (
        <div className="name-picker-card">
          <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '700', color: 'var(--rose-600)', marginBottom: '8px' }}>
            Bạn là chị em nào trong công ty nè? (Chọn tên để cá nhân hóa món quà 🌸)
          </label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="name-search-input"
            placeholder="🔍 Gõ tên bạn để tìm nhanh..."
          />
          <div className="name-dropdown-list">
            {filteredPeople.map(p => (
              <div
                key={p.id}
                className="name-option-item"
                onClick={() => handleSelectSister(p)}
              >
                <span><strong>{p.name}</strong> <small style={{ color: '#94A3B8' }}>({p.dept || p.role})</small></span>
                <span>🌸</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
