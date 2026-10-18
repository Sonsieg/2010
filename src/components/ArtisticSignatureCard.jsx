import React from 'react';
import { getSignatureStyleForName, SIGNATURE_STYLES } from './signatureCardUtils.js';

export default function ArtisticSignatureCard({ name = 'Lan Anh', customQuote = '', styleType = null, className = '' }) {
  const autoStyle = getSignatureStyleForName(name);
  const style = styleType ? (SIGNATURE_STYLES.find(s => s.id === styleType) || autoStyle) : autoStyle;
  
  const displayName = name.replace(/^(Chị\s+|Em\s+)/i, '').trim() || 'Lan Anh';
  const wishText = customQuote || style.quote;

  return (
    <div
      className={`signature-art-card ${className}`}
      style={{
        background: `linear-gradient(135deg, ${style.theme.bgStart} 0%, ${style.theme.bgEnd} 50%, ${style.theme.bgStart} 100%)`,
        borderColor: style.theme.border,
      }}
    >
      {/* 4 họa tiết Baroque góc hoàng gia */}
      <div className="card-corner corner-tl" style={{ color: style.theme.accent }}>❧</div>
      <div className="card-corner corner-tr" style={{ color: style.theme.accent }}>☙</div>
      <div className="card-corner corner-bl" style={{ color: style.theme.accent }}>❧</div>
      <div className="card-corner corner-br" style={{ color: style.theme.accent }}>☙</div>

      {/* Viền đôi tinh xảo */}
      <div className="signature-inner-border" style={{ borderColor: 'rgba(201, 166, 107, 0.55)' }}>
        {/* Dòng chữ đầu thẻ */}
        <div className="signature-top-eyebrow" style={{ color: style.theme.text }}>
          WITH LOVE • 20.10
        </div>

        {/* Họa tiết hoa lá / vương miện / ánh sao */}
        <div className="signature-emblem-wrapper">
          {style.theme.emblem === 'crown' && (
            <div className="emblem-crown">👑</div>
          )}
          {style.theme.emblem === 'sakura' && (
            <div className="emblem-sakura">🌸</div>
          )}
          {style.theme.emblem === 'stars' && (
            <div className="emblem-stars">✨ ✦ 👑 ✦ ✨</div>
          )}
          {(style.theme.emblem === 'flower' || style.theme.emblem === 'minimal') && (
            <svg className="emblem-flower-svg" viewBox="0 0 200 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 20 C 50 8, 80 32, 100 20 C 120 8, 150 32, 190 20" stroke={style.theme.accent} strokeWidth="2.2" strokeLinecap="round" />
              <circle cx="100" cy="20" r="5" fill="#BE123C" />
              <circle cx="70" cy="15" r="4" fill="#F43F5E" />
              <circle cx="130" cy="25" r="4" fill="#F43F5E" />
              <ellipse cx="85" cy="22" rx="6" ry="2.5" fill="#15803D" transform="rotate(-15 85 22)" />
              <ellipse cx="115" cy="18" rx="6" ry="2.5" fill="#15803D" transform="rotate(15 115 18)" />
            </svg>
          )}
        </div>

        {/* Khối chữ ký bao gồm vệt màu nước nghệ thuật phía dưới */}
        <div className="signature-signature-block">
          {/* Lớp vệt cọ màu nước nâng đỡ chữ ký (chống trống trải & tăng tương phản) */}
          <div
            className="signature-watercolor-backdrop"
            style={{
              background: `radial-gradient(ellipse at center, ${style.theme.splash} 0%, rgba(255, 255, 255, 0) 75%)`
            }}
          />

          {/* Chữ ký nghệ thuật của chị em */}
          <div
            className="signature-name-calligraphy"
            style={{
              color: style.theme.text,
              fontFamily: style.font,
            }}
          >
            {displayName} <span className="signature-heart-loop">♡</span>
          </div>

          {/* Đường gạch ký tên uốn lượn */}
          <svg className="signature-underline-svg" viewBox="0 0 240 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 10 Q 120 20 225 8" stroke={style.theme.border} strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </div>

        {/* Lời chúc ý nghĩa */}
        <div className="signature-blessing-text">
          “{wishText}”
        </div>

        {/* Trái tim biểu tượng chân tình */}
        <div className="signature-bottom-heart" style={{ color: '#BE123C' }}>
          ♥
        </div>

        <div className="signature-tribute-tag" style={{ color: style.theme.accent }}>
          ✦ TECH &amp; PRODUCT TRIBUTE 20.10 ✦
        </div>
      </div>
    </div>
  );
}
