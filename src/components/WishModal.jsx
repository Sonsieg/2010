import React, { useRef, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';

export default function WishModal() {
  const { activeModalWish, setActiveModalWish, wishes, markWishOpened } = useApp();
  const cardRef = useRef(null);
  const [tiltStyle, setTiltStyle] = useState({});

  if (!activeModalWish) return null;

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const rotX = (-y / 16).toFixed(2);
    const rotY = (x / 16).toFixed(2);
    setTiltStyle({
      transform: `rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.025)`
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
    if (nextWish) {
      markWishOpened(nextWish.id);
    }
  };

  return (
    <div
      className="royal-modal-overlay open"
      onClick={(e) => {
        if (e.target.classList.contains('royal-modal-overlay')) {
          setActiveModalWish(null);
        }
      }}
    >
      <div
        className="royal-tilt-perspective"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleReset}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleReset}
      >
        <div
          ref={cardRef}
          className="royal-parchment-tilt-card"
          style={tiltStyle}
        >
          {/* Con Dấu Sáp Đỏ Hoàng Gia Đính Góc */}
          <div className="card-wax-seal-badge">
            <span>20.10</span>
          </div>

          {/* Nút Đóng Quý Tộc */}
          <button
            className="royal-btn-close"
            onClick={() => setActiveModalWish(null)}
            title="Đóng lời chúc"
          >
            ✕
          </button>

          {/* Header Người Gửi */}
          {(() => {
            const senderRaw = activeModalWish.from_name || activeModalWish.name || activeModalWish.sender || 'Anh em Tech Team';
            const senderInitial = String(senderRaw).trim().charAt(0) || '🌸';
            const senderDept = activeModalWish.dept || activeModalWish.role || 'Engineering & Product Team';
            const wishContent = activeModalWish.text || activeModalWish.message || activeModalWish.content || '';

            return (
              <>
                <div className="royal-wish-sender-row">
                  <div
                    className="royal-sender-monogram"
                    style={{
                      background: 'linear-gradient(135deg, #BE123C 0%, #8C2F4B 100%)',
                      border: '2px solid #E5C388'
                    }}
                  >
                    {senderInitial}
                  </div>
                  <div>
                    <div className="royal-sender-eyebrow">LỜI CHÚC TỪ ANH SÓN</div>
                    <h4 className="royal-sender-name">
                      {senderRaw}
                    </h4>
                    <span className="royal-sender-dept-pill">
                      ✦ {senderDept}
                    </span>
                  </div>
                </div>

                {/* Nội Dung Lời Chúc (Khung Giấy Da Cẩm Thạch) */}
                <div className="royal-wish-parchment-box">
                  <span className="royal-quote-mark open">“</span>
                  <p className="royal-wish-text">
                    {wishContent}
                  </p>
                  <span className="royal-quote-mark close">”</span>
                </div>
              </>
            );
          })()}

          {/* Footer Card */}
          <div className="royal-wish-footer">
            <span className="royal-wish-hint">
              ✦ Chạm ra ngoài để đóng • Kính chúc chị em rực rỡ ✦
            </span>
            <button
              onClick={handleNextWish}
              className="royal-btn-next-wish"
              type="button"
            >
              <span>Xem bóng tiếp theo 🎈</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

