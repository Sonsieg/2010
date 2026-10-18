import React, { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import confetti from 'canvas-confetti';
import IdentitySelector from '../components/IdentitySelector.jsx';

export default function GiftPage() {
  const { 
    selectedSister, 
    navigateWithFlowerTransition, 
    experienceMode, 
    updateExperienceMode 
  } = useApp();
  const [isLidOpened, setIsLidOpened] = useState(false);
  const [showWelcomeChoice, setShowWelcomeChoice] = useState(false);

  // Khi chọn tên chị em, hiện modal chào mừng trang trọng định hướng 3D vs 2D
  const lastSelectedIdRef = React.useRef(selectedSister?.id);
  React.useEffect(() => {
    if (selectedSister && selectedSister.id !== lastSelectedIdRef.current) {
      lastSelectedIdRef.current = selectedSister.id;
      setShowWelcomeChoice(true);
    }
  }, [selectedSister]);

  const handleOpenGift = () => {
    if (isLidOpened) return;
    setIsLidOpened(true);

    // Bắn pháo hoa cánh hoa tung bay ngọt ngào
    confetti({
      particleCount: 110,
      spread: 95,
      origin: { y: 0.58 },
      colors: ['#F43F5E', '#FDA4AF', '#FCD34D', '#FFF1F2', '#FECDD3', '#FB7185']
    });

    setTimeout(() => {
      navigateWithFlowerTransition('/letter');
    }, 700);
  };

  return (
    <div className="page-screen" id="page-gift">
      <div className="gift-page-container">
        {/* Badge Header */}
        <div className="gift-honor-badge">
          <span className="crown">👑</span>
          <span>
            {selectedSister 
              ? `Món Quà Riêng Tặng: Chị ${selectedSister.name}` 
              : 'Chào Mừng Ngày Phụ Nữ Việt Nam 20/10'}
          </span>
          <span>🌸</span>
        </div>

        {/* Tiêu đề chính */}
        <h1 className="gift-hero-title">
          Món Quà Ngọt Ngào Dành Tặng Bạn 🎁
        </h1>
        <p className="gift-hero-sub">
          Có một chiếc hộp bí mật chứa đựng những đóa hoa tươi thắm và lời chúc chân thành nhất từ toàn thể anh em công ty gửi đến bạn...
        </p>

        {/* BỘ CHỌN TÊN CHỊ EM (ĐẶT NGAY ĐẦU TRANG, TRỰC QUAN & RÕ RÀNG) */}
        <IdentitySelector onOpenGift={handleOpenGift} />

        {/* Switcher chế độ trải nghiệm 2D vs 3D */}
        <div className="mode-banner-card">
          <div className="mode-banner-label">
            <span>🎭 Chế Độ Trải Nghiệm Demo:</span>
          </div>
          <div className="mode-banner-grid">
            <button
              type="button"
              onClick={() => updateExperienceMode('2d')}
              className={`mode-card-pill ${experienceMode === '2d' ? 'active' : ''}`}
            >
              <span style={{ fontSize: '1.6rem' }}>🌸</span>
              <div>
                <strong>Bản 2D Cổ Tích</strong>
                <small>Thiệp bifold mở rộng • Xe thư vintage • Suối hoa pastel</small>
              </div>
            </button>

            <button
              type="button"
              onClick={() => updateExperienceMode('3d')}
              className={`mode-card-pill ${experienceMode === '3d' ? 'active' : ''}`}
            >
              <span style={{ fontSize: '1.6rem' }}>✨</span>
              <div>
                <strong>Bản 3D Điện Ảnh</strong>
                <small>Three.js hoàng hôn • Xe van 3D • Camera bám đuổi</small>
              </div>
            </button>
          </div>
        </div>

        {/* HỘP QUÀ HỒNG PHẤN 3D NƠ VÀNG CHAMPAGNE */}
        <div
          className={`sweet-gift-wrapper ${isLidOpened ? 'box-is-open' : 'gift-wobble-anim'}`}
          onClick={handleOpenGift}
          title="Chạm để mở hộp quà!"
        >
          <svg className="sweet-gift-svg" viewBox="0 0 240 240" fill="none">
            <defs>
              {/* Bóng đổ */}
              <ellipse id="boxShadow" cx="120" cy="222" rx="82" ry="15" fill="#F43F5E" opacity="0.22" />

              {/* Thân hộp màu hồng phấn pastel cao cấp */}
              <linearGradient id="sweetBoxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FDA4AF" />
                <stop offset="40%" stopColor="#FB7185" />
                <stop offset="100%" stopColor="#E11D48" />
              </linearGradient>

              {/* Nắp hộp */}
              <linearGradient id="sweetLidGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFF1F2" />
                <stop offset="35%" stopColor="#FDA4AF" />
                <stop offset="100%" stopColor="#F43F5E" />
              </linearGradient>

              {/* Ruy băng vàng champagne */}
              <linearGradient id="sweetGoldRibbon" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFBEB" />
                <stop offset="30%" stopColor="#FDE68A" />
                <stop offset="70%" stopColor="#C9A66B" />
                <stop offset="100%" stopColor="#B45309" />
              </linearGradient>
            </defs>

            {/* Bóng đổ dưới đáy */}
            <use href="#boxShadow" />

            {/* THÂN HỘP */}
            <rect x="48" y="98" width="144" height="116" rx="18" fill="url(#sweetBoxGrad)" />
            {/* Vệt sáng mép trái thân hộp */}
            <path d="M 50 112 L 50 200" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
            
            {/* Ruy băng vàng dọc thân */}
            <rect x="108" y="98" width="24" height="116" fill="url(#sweetGoldRibbon)" />
            <rect x="118" y="98" width="4" height="116" fill="#FFF" opacity="0.6" />

            {/* Ruy băng vàng ngang thân */}
            <rect x="48" y="148" width="144" height="22" fill="url(#sweetGoldRibbon)" />
            <rect x="48" y="157" width="144" height="4" fill="#FFF" opacity="0.5" />

            {/* NẮP HỘP VÀ NƠ VÀNG (BẬT MỞ KHI CLICK) */}
            <g className="sweet-gift-lid">
              {/* Vành nắp hộp */}
              <rect x="38" y="78" width="164" height="30" rx="9" fill="url(#sweetLidGrad)" stroke="#FDA4AF" strokeWidth="1.5" />
              <line x1="40" y1="82" x2="200" y2="82" stroke="#FFF" strokeWidth="1.5" opacity="0.6" strokeLinecap="round" />

              {/* Ruy băng trên nắp */}
              <rect x="108" y="78" width="24" height="30" fill="url(#sweetGoldRibbon)" />
              <rect x="118" y="78" width="4" height="30" fill="#FFF" opacity="0.7" />

              {/* NƠ BƯỚM VÀNG CHAMPAGNE ĐA TẦNG */}
              {/* Cánh nơ trái */}
              <path
                d="M 120 80 C 95 40 55 46 68 70 C 78 84 105 80 120 80 Z"
                fill="url(#sweetGoldRibbon)"
                stroke="#C9A66B"
                strokeWidth="1.2"
              />
              <path
                d="M 118 78 C 100 48 72 52 82 70 C 90 78 110 78 118 78 Z"
                fill="#FFFBEB"
                opacity="0.6"
              />

              {/* Cánh nơ phải */}
              <path
                d="M 120 80 C 145 40 185 46 172 70 C 162 84 135 80 120 80 Z"
                fill="url(#sweetGoldRibbon)"
                stroke="#C9A66B"
                strokeWidth="1.2"
              />
              <path
                d="M 122 78 C 140 48 168 52 158 70 C 150 78 130 78 122 78 Z"
                fill="#FFFBEB"
                opacity="0.6"
              />

              {/* Đuôi nơ rủ xuống */}
              <path d="M 114 82 Q 88 102 96 122 Q 104 108 118 84 Z" fill="url(#sweetGoldRibbon)" />
              <path d="M 126 82 Q 152 102 144 122 Q 136 108 122 84 Z" fill="url(#sweetGoldRibbon)" />

              {/* Nút thắt nơ trung tâm */}
              <circle cx="120" cy="80" r="10" fill="url(#sweetGoldRibbon)" stroke="#B45309" strokeWidth="1" />
              <circle cx="120" cy="80" r="5" fill="#E11D48" />
              <circle cx="118" cy="78" r="2" fill="#FFF" opacity="0.8" />
            </g>
          </svg>
        </div>

        {/* Nút Mở Hộp Quà */}
        <div style={{ marginBottom: '28px' }}>
          <button onClick={handleOpenGift} className="btn-rose" style={{ fontSize: '1.08rem' }}>
            <span>Mở Hộp Quà Ngay 🌸</span>
          </button>
        </div>
      </div>

      {/* [P1] MODAL CHÀO MỪNG ĐỊNH HƯỚNG 3D VS 2D KHI VỪA CHỌN TÊN */}
      {showWelcomeChoice && selectedSister && (
        <div className="modal-overlay open" onClick={() => setShowWelcomeChoice(false)}>
          <div className="onboarding-welcome-modal" onClick={(e) => e.stopPropagation()}>
            <div className="onboarding-modal-wax-seal">20.10</div>
            <div className="onboarding-badge">🌸 CHÀO MỪNG ĐÓA HOA RẠNG RỠ</div>
            <h2 className="onboarding-title">
              Chào Mừng Chị <strong>{selectedSister.name}</strong>! 💖
            </h2>
            <p className="onboarding-desc">
              Toàn thể anh em TechCorp đã chuẩn bị không gian tri ân riêng dành tặng chị. Chị muốn bắt đầu khám phá qua trải nghiệm nào?
            </p>

            <div className="onboarding-choices">
              <button
                type="button"
                className="btn-onboarding-choice primary-3d-highlight"
                onClick={() => {
                  setShowWelcomeChoice(false);
                  updateExperienceMode('3d');
                  navigateWithFlowerTransition('/3d');
                }}
              >
                <div className="choice-icon-wrap">✨</div>
                <div className="choice-text-wrap">
                  <div className="choice-title">
                    Vương Quốc 3D Điện Ảnh <span className="recommended-tag">Khuyên Dùng</span>
                  </div>
                  <div className="choice-sub">
                    Dạo bước hoàng hôn 3D • Xe hoa cổ điển • Bầu trời pháo hoa & bóng bay
                  </div>
                </div>
                <span className="choice-arrow">➔</span>
              </button>

              <button
                type="button"
                className="btn-onboarding-choice secondary-2d"
                onClick={() => {
                  setShowWelcomeChoice(false);
                  updateExperienceMode('2d');
                  handleOpenGift();
                }}
              >
                <div className="choice-icon-wrap">💌</div>
                <div className="choice-text-wrap">
                  <div className="choice-title">Tạp Chí 2D Cổ Tích</div>
                  <div className="choice-sub">
                    Thiệp bifold mở rộng • Con dấu sáp đỏ • Suối hoa nhẹ nhàng
                  </div>
                </div>
                <span className="choice-arrow">➔</span>
              </button>
            </div>

            <button
              type="button"
              className="onboarding-close-text"
              onClick={() => setShowWelcomeChoice(false)}
            >
              Tôi muốn ở lại trang này tự khám phá
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


