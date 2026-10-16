import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.jsx';

export default function VideoPage() {
  const { navigateWithFlowerTransition } = useApp();

  const quotes = [
    {
      category: "DÀNH TẶNG NỤ CƯỜI TỎA NẮNG",
      icon: "✨",
      text: "“Cảm ơn vì đã luôn làm cho công ty này rực rỡ, vui tươi và tràn ngập năng lượng tích cực mỗi ngày!”",
      author: "Toàn thể Anh Em Tech & Product Team",
      badge: "Tech & Product Family"
    },
    {
      category: "TRI ÂN SỰ ĐỒNG HÀNH TRONG TỪNG SPRINT",
      icon: "🚀",
      text: "“Mọi sprint release cam go, mọi đêm OT dự án đều trở nên êm đềm và đáng nhớ hơn nhờ nụ cười, sự thấu cảm và kiên trì của các chị em!”",
      author: "Engineering & QA Family",
      badge: "Dev & QA Brothers"
    },
    {
      category: "VINH DANH NHỮNG ĐÓA HOA XUẤT CHÚNG",
      icon: "👑",
      text: "“Chúc các đóa hoa IT luôn tự tin, kiên cường, hạnh phúc và mãi là phiên bản tài năng, rực rỡ nhất trong cuộc sống!”",
      author: "From Brothers with Sincere Respect",
      badge: "With Love & Honor"
    },
    {
      category: "LỜI CHÚC TỪ TRÁI TIM",
      icon: "🌸",
      text: "“Mỗi dòng code chúng mình viết ra có thể chứa bug, nhưng sự trân trọng và biết ơn dành cho các chị em thì luôn hoàn hảo 100%!”",
      author: "Frontend, Backend & DevOps Club",
      badge: "Code with Love"
    }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);

  useEffect(() => {
    if (!isAutoPlay) return;
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % quotes.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [isAutoPlay, quotes.length]);

  const currentQuote = quotes[currentIndex];

  return (
    <div className="page-screen" id="page-video">
      <div className="cinema-screen-container">
        {/* Header Phòng Chiếu */}
        <div className="cinema-header">
          <div className="cinema-eyebrow">
            SPECIAL TRIBUTE CINEMA • 20.10
          </div>
          <h2 className="cinema-title">Thước Phim Tri Ân Từ Trái Tim</h2>
          <p className="cinema-sub">
            Những xúc cảm, lời trân trọng chân thành nhất được gửi gắm trong từng khung hình điện ảnh dành tặng các chị em.
          </p>
        </div>

        {/* Khung Chiếu Phim Sweet Rose & Champagne */}
        <div className="cinema-theatre-box">
          {/* Badge Thể Loại */}
          <div className="theatre-badge-pill">
            <span>{currentQuote.icon}</span>
            <span>{currentQuote.category}</span>
          </div>

          {/* Trích Dẫn Tri Ân */}
          <div className="theatre-quote-box">
            <h3
              key={currentIndex}
              className="theatre-quote-text quote-fade-anim"
            >
              {currentQuote.text}
            </h3>
          </div>

          {/* Người Gửi & Chữ Ký */}
          <div
            key={`author-${currentIndex}`}
            className="theatre-author-info quote-fade-anim"
          >
            <div className="author-name">— {currentQuote.author} —</div>
            <div className="author-tag">✦ {currentQuote.badge} ✦</div>
          </div>

          {/* Thanh Tiến Trình Chiếu Phim */}
          <div className="theatre-timeline-bar">
            {quotes.map((q, idx) => (
              <div
                key={idx}
                className={`timeline-segment ${idx === currentIndex ? 'active' : ''}`}
                onClick={() => setCurrentIndex(idx)}
              />
            ))}
          </div>

          {/* Bộ Điều Khiển Chiếu Phim */}
          <div className="theatre-controls-row">
            <button
              onClick={() => setCurrentIndex((currentIndex - 1 + quotes.length) % quotes.length)}
              className="btn-theatre-ctrl"
              title="Khung hình trước"
            >
              ❮
            </button>

            <button
              onClick={() => setIsAutoPlay(!isAutoPlay)}
              className="btn-theatre-play"
              title={isAutoPlay ? "Tạm dừng chiếu" : "Tiếp tục chiếu"}
            >
              {isAutoPlay ? '⏸ Tạm dừng' : '▶️ Tự động chiếu'}
            </button>

            <button
              onClick={() => setCurrentIndex((currentIndex + 1) % quotes.length)}
              className="btn-theatre-ctrl"
              title="Khung hình kế tiếp"
            >
              ❯
            </button>
          </div>
        </div>

        {/* Nút Chuyển Màn Tiếp Theo */}
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={() => navigateWithFlowerTransition('/party')}
            className="btn-golden-rose"
          >
            <span>Màn Kết: Nhận Quà Thật &amp; Tải Thiệp Kỷ Niệm 💐</span>
          </button>
        </div>
      </div>
    </div>
  );
}


