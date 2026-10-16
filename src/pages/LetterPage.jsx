import React from 'react';
import { useApp } from '../context/AppContext.jsx';

export default function LetterPage() {
  const { selectedSister, navigateWithFlowerTransition } = useApp();

  const sisterName = selectedSister ? selectedSister.name : 'Chị Em Quý Mến';
  const hasPhoto = selectedSister && selectedSister.has_consent && selectedSister.photo;
  const initials = selectedSister
    ? selectedSister.name.split(' ').slice(-2).map(n => n[0]).join('')
    : '🌸';

  return (
    <div className="page-screen" id="page-letter">
      <div className="letter-frame">
        {/* Wax Seal 20/10 Stamp */}
        <div className="wax-seal-badge" title="Dấu sáp 20/10">20.10</div>

        {/* Personalized Sister Header */}
        <div className="sister-avatar-preview">
          <div className="avatar-circle">
            {hasPhoto ? (
              <img src={selectedSister.photo} alt={selectedSister.name} />
            ) : (
              <span>{initials}</span>
            )}
          </div>
          <div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: '700', color: 'var(--rose-500)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              Special Tribute • 20 Tháng 10
            </span>
            <h2 className="letter-title">
              Thân Gửi {selectedSister ? `Chị ${selectedSister.name}` : 'Các Chị Em'} Quý Mến,
            </h2>
          </div>
        </div>

        <p className="letter-text">
          Nhân ngày Phụ nữ Việt Nam 20/10, toàn thể anh em công ty xin gửi đến bạn lời tri ân chân thành và nồng nhiệt nhất! Cảm ơn bạn vì đã luôn là chỗ dựa tinh thần ấm áp, là người mang đến sự cân bằng, tinh tế và những nụ cười rạng rỡ giữa những ngày làm việc công nghệ bận rộn.
        </p>

        <p className="letter-text" style={{ marginTop: '-12px' }}>
          Chúc bạn có một ngày 20/10 thật ngập tràn niềm vui, luôn xinh đẹp, tự tin trên con đường sự nghiệp và luôn được yêu thương trọn vẹn! Bây giờ, hãy cùng bước vào <strong>Bầu Trời Bóng Bay</strong> để nhận những lời chúc chân thành từ từng người anh em nhé! 💐
        </p>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px dashed var(--rose-200)', paddingTop: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '1.25rem', color: 'var(--rose-700)', fontWeight: '700' }}>
              — Toàn thể anh em Tech &amp; Product
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#94A3B8' }}>
              With all our love &amp; respect ❤️
            </div>
          </div>

          <button
            onClick={() => navigateWithFlowerTransition('/balloons')}
            className="btn-rose"
            style={{ fontSize: '1.05rem' }}
          >
            <span>Khám Phá Bầu Trời Bóng Bay 🎈</span>
          </button>
        </div>
      </div>
    </div>
  );
}
