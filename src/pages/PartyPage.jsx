import React, { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import html2canvas from 'html2canvas';
import confetti from 'canvas-confetti';

export default function PartyPage() {
  const { selectedSister } = useApp();
  const [recipientName, setRecipientName] = useState(
    selectedSister ? selectedSister.name : 'Chị Em IT Thân Thương'
  );
  const [isExporting, setIsExporting] = useState(false);
  const [thanksSent, setThanksSent] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  // 1. Tải thiệp Retina 2x bằng html2canvas
  const handleDownloadCard = async () => {
    const cardEl = document.getElementById('exportable-card-element');
    if (!cardEl) return;

    setIsExporting(true);
    try {
      const canvas = await html2canvas(cardEl, {
        scale: 2.2,
        useCORS: true,
        backgroundColor: '#FAF3EA'
      });

      const link = document.createElement('a');
      link.download = `Thiep-20-10-Tang-${recipientName.replace(/\s+/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      setIsExporting(false);
      showToast('Đã khắc và tải tấm thiệp thành công! Hãy chia sẻ cùng bạn bè nhé! 🌸');
      
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#F43F5E', '#FDA4AF', '#FCD34D', '#FFF1F2', '#FECDD3']
      });
    } catch (err) {
      console.error(err);
      setIsExporting(false);
      showToast('Chưa thể xuất file ảnh thiệp. Chị em thử lại nhé!');
    }
  };

  // 2. Tải file .ics lịch thật nhắc giờ nhận quà tại Pantry
  const handleSaveCalendar = () => {
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Tech Team//Vietnamese Womens Day 20-10//VI',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      'UID:wishes-2010-' + Date.now() + '@company.com',
      'DTSTAMP:20261016T080000Z',
      'DTSTART:20261020T030000Z', // 10:00 Sáng VN
      'DTEND:20261020T043000Z',   // 11:30 Sáng VN
      'SUMMARY:🌸 Tiệc Trà & Nhận Quà 20/10 Cùng Toàn Thể Anh Em Tech & Product',
      'DESCRIPTION:Thân mời các đóa hoa công ty có mặt tại Pantry để nhận hoa tươi\\, quà kỷ niệm và dự tiệc trà ngọt ngào cùng toàn thể anh em!',
      'LOCATION:Pantry Tầng 8 & Khu Vực Lounge',
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', 'Lich-Nhan-Qua-20-10.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Đã lưu lịch hẹn (.ics) vào máy của bạn! Hẹn gặp bạn lúc 10:00 sáng 20/10! 📅');
  };

  // 3. Thả tim cảm ơn
  const handleReaction = (emoji) => {
    confetti({
      particleCount: 45,
      spread: 75,
      origin: { y: 0.8 },
      colors: ['#F43F5E', '#FDA4AF', '#FCD34D', '#FFF1F2', '#FECDD3']
    });
    setThanksSent(true);
    showToast(`Bạn vừa gửi trao biểu tượng ${emoji} ngọt ngào đến các anh em!`);
  };

  return (
    <div className="page-screen" id="page-party">
      <div className="party-screen-container">
        {/* Header Màn Kết */}
        <div className="party-header">
          <div className="party-eyebrow">
            GRAND FINALE • HAPPY WOMEN'S DAY 20.10
          </div>
          <h2 className="party-title">
            Rạng Rỡ &amp; Vẹn Tròn Niềm Vui
          </h2>
          <p className="party-sub">
            Món quà ảo chỉ là khúc dạo đầu ngọt ngào. Những phần quà thật và hoa tươi đã được anh em chuẩn bị sẵn sàng chào đón bạn!
          </p>
        </div>

        {/* 2 Khối Hành Động Chính */}
        <div className="action-cards-grid">
          {/* Card 1: Nhận Quà Ngoài Đời */}
          <div className="party-action-card">
            <div>
              <div className="party-card-icon amber-grad">
                🎁
              </div>
              <span className="party-card-badge gold">HẸN GẶP NGOÀI ĐỜI THẬT</span>
              <h3 className="party-card-title">Thông Tin Nhận Quà Tại Văn Phòng</h3>
              <p className="party-card-desc">
                Các anh em đã chuẩn bị những đóa hoa tươi thắm, trà bánh ngọt ngào và những phần quà kỷ niệm trực tiếp tại văn phòng dành tặng bạn.
              </p>

              <div className="schedule-parchment-box">
                <div>📍 <strong>Địa điểm:</strong> Pantry Tầng 8 &amp; Khu Vực Lounge Thư Giãn</div>
                <div>⏰ <strong>Thời gian:</strong> 10:00 Sáng • Thứ Ba 20/10</div>
                <div>🥂 <strong>Nội dung:</strong> Tặng hoa tươi, tiệc trà bánh ngọt ngào &amp; mini-game nhận quà</div>
              </div>
            </div>

            <button onClick={handleSaveCalendar} className="btn-rose" style={{ width: '100%' }}>
              <span>📅 Thêm Lịch Nhắc Vào Điện Thoại (.ics)</span>
            </button>
          </div>

          {/* Card 2: Khắc Tên & Tải Thiệp Retina 2x */}
          <div className="party-action-card">
            <div>
              <div className="party-card-icon">
                💌
              </div>
              <span className="party-card-badge">RETINA 2X EDITORIAL</span>
              <h3 className="party-card-title">Tải Tấm Thiệp Mang Tên Bạn</h3>
              <p className="party-card-desc">
                Tải thiệp chúc mừng thiết kế riêng theo phong cách Editorial với độ nét cao 2x Retina để lưu giữ làm kỷ niệm hoặc chia sẻ khoe bạn bè!
              </p>

              <div style={{ marginBottom: '22px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--rose-700)', marginBottom: '8px' }}>
                  Tên in trên thiệp của bạn:
                </label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="identity-search-input"
                  style={{ marginBottom: 0 }}
                  placeholder="Nhập tên bạn..."
                />
              </div>
            </div>

            <button
              onClick={handleDownloadCard}
              disabled={isExporting}
              className="btn-golden-rose"
              style={{ width: '100%' }}
            >
              <span>{isExporting ? 'Đang tạo thiệp... ⏳' : 'Tải Thiệp Về Máy (PNG 2x Retina) 💌'}</span>
            </button>
          </div>
        </div>

        {/* Khối Thả Tim Tri Ân */}
        <div className="reaction-sweet-box">
          <p className="reaction-sweet-title">
            Thả tim / Gửi lời cảm ơn lại đến toàn thể anh em bằng một chạm:
          </p>
          <div className="reaction-buttons-row">
            {['❤️', '🥰', '💐', '✨', '🎉'].map((emoji, idx) => (
              <button
                key={idx}
                onClick={() => handleReaction(emoji)}
                className="reaction-emoji-btn"
                type="button"
              >
                {emoji}
              </button>
            ))}
          </div>
          {thanksSent && (
            <div className="thanks-feedback-msg">
              Cảm ơn bạn! Anh em đã nhận được tim và niềm vui từ bạn! Chúc bạn ngày 20/10 thật hạnh phúc! 🥰
            </div>
          )}
        </div>

        {/* KHUNG THIỆP ẨN ĐỂ HTML2CANVAS RENDER ẢNH RETINA 2X KIỆT TÁC */}
        <div style={{ position: 'fixed', left: '-9999px', top: '-9999px' }}>
          <div
            id="exportable-card-element"
            style={{
              width: '840px',
              height: '1120px',
              background: '#FAF3EA',
              padding: '56px',
              color: '#1E0F18',
              fontFamily: '"Be Vietnam Pro", sans-serif',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              borderRadius: '36px',
              border: '6px solid #C9A66B',
              boxShadow: 'inset 0 0 0 2px #BE123C',
              position: 'relative',
              boxSizing: 'border-box'
            }}
          >
            {/* Họa tiết góc Baroque */}
            <div style={{ position: 'absolute', top: '16px', left: '16px', fontSize: '24px', color: '#C9A66B', opacity: 0.8 }}>❧</div>
            <div style={{ position: 'absolute', top: '16px', right: '16px', fontSize: '24px', color: '#C9A66B', opacity: 0.8 }}>☙</div>
            <div style={{ position: 'absolute', bottom: '16px', left: '16px', fontSize: '24px', color: '#C9A66B', opacity: 0.8 }}>❧</div>
            <div style={{ position: 'absolute', bottom: '16px', right: '16px', fontSize: '24px', color: '#C9A66B', opacity: 0.8 }}>☙</div>

            {/* Header thiệp */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid rgba(201, 166, 107, 0.45)', paddingBottom: '26px' }}>
              <div>
                <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '13px', letterSpacing: '0.28em', textTransform: 'uppercase', color: '#BE123C', fontWeight: '800' }}>
                  HAPPY VIETNAMESE WOMEN'S DAY
                </span>
                <h2 style={{ fontFamily: '"Playfair Display", serif', fontSize: '32px', fontWeight: '800', color: '#881337', margin: '6px 0 0', letterSpacing: '0.02em' }}>
                  20 THÁNG 10 • YÊU THƯƠNG &amp; RẠNG RỠ
                </h2>
              </div>
              {/* Con Dấu Sáp Đỏ */}
              <div style={{ width: '74px', height: '74px', borderRadius: '50%', background: 'radial-gradient(circle at 35% 35%, #F43F5E 0%, #BE123C 60%, #881337 100%)', border: '2px dashed #FDE68A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFDF9', fontFamily: '"Playfair Display", serif', fontSize: '1.4rem', fontWeight: '800', boxShadow: '0 8px 20px rgba(0,0,0,0.2)' }}>
                20.10
              </div>
            </div>

            {/* Thân thiệp */}
            <div style={{ textAlign: 'center', margin: 'auto 0', padding: '0 20px' }}>
              <p style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '14px', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#BE123C', marginBottom: '14px', fontWeight: '700' }}>
                ✦ TRÂN TRỌNG GỬI TRAO ĐẾN ✦
              </p>
              <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: '54px', fontStyle: 'italic', color: '#881337', margin: '0 0 28px', fontWeight: '800', textShadow: '0 2px 4px rgba(0,0,0,0.06)' }}>
                Chị {recipientName}
              </h1>

              {/* Giấy Da Thư */}
              <div style={{ background: '#FFFDF8', border: '2px solid rgba(201, 166, 107, 0.55)', borderRadius: '24px', padding: '38px 46px', margin: '0 auto', boxShadow: '0 10px 30px rgba(244, 63, 94, 0.08)' }}>
                <p style={{ fontSize: '22px', lineHeight: '1.85', color: '#334155', fontStyle: 'italic', margin: '0 0 16px' }}>
                  “Cảm ơn bạn vì đã luôn là đóa hoa tỏa sắc ngát hương, mang lại nụ cười, sự êm đềm và nguồn cảm hứng bất tận cho toàn thể anh em trong công ty.”
                </p>
                <p style={{ fontSize: '18px', lineHeight: '1.7', color: '#64748B', margin: 0 }}>
                  Chúc bạn một ngày 20/10 ngập tràn hạnh phúc, may mắn trong sự nghiệp và luôn rạng ngời như ánh dương ban mai! 🌸
                </p>
              </div>
            </div>

            {/* Footer thiệp */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px solid rgba(201, 166, 107, 0.45)', paddingTop: '22px', fontSize: '15px', color: '#881337', fontWeight: '700' }}>
              <span style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontSize: '18px' }}>
                Toàn thể Anh Em Tech &amp; Product Team kính chúc 💐
              </span>
              <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '13px', color: '#BE123C' }}>
                Built with Love ❤️ 2026
              </span>
            </div>
          </div>
        </div>

        {/* Footer Bản Quyền */}
        <footer style={{ marginTop: '50px', paddingBottom: '20px', fontFamily: 'var(--font-sans)', fontSize: '0.84rem', color: '#94A3B8', textAlign: 'center' }}>
          <p style={{ marginBottom: '6px' }}>Built with ❤️ by anh em Dev, Tech &amp; Product Team • 20/10/2026</p>
          <p style={{ fontSize: '0.78rem' }}>
            <a href="#/sender" style={{ color: 'var(--rose-600)', textDecoration: 'none', fontWeight: '600' }} title="Chế độ soạn thảo của Anh Em">🔑 Studio Soạn Thảo Của Anh Em</a>
          </p>
        </footer>
      </div>

      {toastMsg && <div className="sweet-toast show">{toastMsg}</div>}
    </div>
  );
}


