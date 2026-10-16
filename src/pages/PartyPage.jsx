import React, { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import html2canvas from 'html2canvas';
import confetti from 'canvas-confetti';

export default function PartyPage() {
  const { selectedSister } = useApp();
  const [recipientName, setRecipientName] = useState(
    selectedSister ? selectedSister.name : 'Chị Em IT'
  );
  const [isExporting, setIsExporting] = useState(false);
  const [thanksSent, setThanksSent] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  // 1. Tải thiệp Retina 2x bằng html2canvas
  const handleDownloadCard = async () => {
    const cardEl = document.getElementById('exportable-card-element');
    if (!cardEl) return;

    setIsExporting(true);
    try {
      const canvas = await html2canvas(cardEl, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#FFF1F2'
      });

      const link = document.createElement('a');
      link.download = `Thiep-20-10-Tang-${recipientName.replace(/\s+/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      setIsExporting(false);
      showToast('Đã tải thiệp thành công! Hãy chia sẻ khoe cùng bạn bè nhé! 🌸');
    } catch (err) {
      console.error(err);
      setIsExporting(false);
      showToast('Không thể tạo file thiệp. Thử lại sau.');
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
      'SUMMARY:🌸 Nhận Hoa & Quà 20/10 Cùng Toàn Thể Anh Em Tech & Product',
      'DESCRIPTION:Thân mời các chị em có mặt tại Pantry để nhận hoa tươi\\, quà kỷ niệm và dự tiệc trà ngọt ngào cùng toàn thể anh em!',
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

    showToast('Đã tải file lịch hẹn (.ics) vào máy của bạn! 📅');
  };

  // 3. Thả tim cảm ơn
  const handleReaction = () => {
    confetti({
      particleCount: 30,
      spread: 70,
      origin: { y: 0.85 },
      colors: ['#F43F5E', '#FDA4AF', '#FCD34D', '#FFF1F2']
    });
    setThanksSent(true);
  };

  return (
    <div className="page-screen" id="page-party">
      <div style={{ maxWidth: '680px', margin: '0 auto 30px', textAlign: 'center' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: '700', color: 'var(--rose-500)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
          Final Stage • Happy Women's Day
        </span>
        <h2 className="font-serif" style={{ fontSize: 'clamp(2.4rem, 5.5vw, 3.8rem)', fontStyle: 'italic', color: 'var(--rose-700)', margin: '10px 0 16px' }}>
          Rạng Rỡ &amp; Vẹn Tròn Niềm Vui
        </h2>
        <p style={{ color: '#64748B', fontSize: '1.05rem', lineHeight: '1.8' }}>
          “Chúc các chị em một ngày 20/10 thật rạng rỡ, nhiều niềm vui và luôn có thật nhiều nụ cười trên môi!” 🌸
        </p>
      </div>

      {/* Action Cards */}
      <div className="action-cards-row">
        {/* Card 1: Quà Thật Ngoài Đời */}
        <div className="action-box">
          <div>
            <div style={{ width: '58px', height: '58px', borderRadius: '20px', background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#fff', fontSize: '1.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', boxShadow: '0 6px 18px rgba(245, 158, 11, 0.3)' }}>
              🎁
            </div>
            <h3 className="font-serif" style={{ fontSize: '1.45rem', color: '#1E293B', marginBottom: '12px' }}>
              Thông Tin Nhận Quà Thật
            </h3>
            <p style={{ color: '#64748B', fontSize: '0.92rem', lineHeight: '1.7', marginBottom: '20px' }}>
              Món quà ảo chỉ là phần mở đầu, các anh em đã chuẩn bị những phần hoa tươi và bánh trà ngọt ngào trực tiếp tại văn phòng dành tặng bạn!
            </p>

            <div style={{ background: 'var(--rose-50)', border: '1px solid var(--rose-200)', borderRadius: '18px', padding: '16px', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--rose-700)', lineHeight: '1.8', textAlign: 'left', marginBottom: '24px' }}>
              <div>📍 <strong>Địa điểm:</strong> Pantry Tầng 8 &amp; Khu Vực Lounge</div>
              <div>⏰ <strong>Thời gian:</strong> 10:00 Sáng • Thứ Ba 20/10</div>
              <div>🥂 <strong>Nội dung:</strong> Tặng hoa tươi, tiệc trà ngọt ngào &amp; mini-game</div>
            </div>
          </div>

          <button onClick={handleSaveCalendar} className="btn-rose" style={{ width: '100%' }}>
            <span>📅 Thêm Vào Lịch Điện Thoại (.ics)</span>
          </button>
        </div>

        {/* Card 2: Xuất Thiệp Lưu Niệm Retina 2x */}
        <div className="action-box">
          <div>
            <div style={{ width: '58px', height: '58px', borderRadius: '20px', background: 'linear-gradient(135deg, var(--rose-500), var(--rose-600))', color: '#fff', fontSize: '1.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', boxShadow: '0 6px 18px rgba(244, 63, 94, 0.3)' }}>
              💌
            </div>
            <h3 className="font-serif" style={{ fontSize: '1.45rem', color: '#1E293B', marginBottom: '12px' }}>
              Tải Thiệp Chúc Mừng Mang Tên Bạn
            </h3>
            <p style={{ color: '#64748B', fontSize: '0.92rem', lineHeight: '1.7', marginBottom: '20px' }}>
              Tải tấm thiệp thiết kế riêng mang tên bạn với độ nét cao Retina 2x để lưu làm kỷ niệm hoặc chia sẻ lên Zalo/Facebook khoe bạn bè!
            </p>

            <div style={{ marginBottom: '24px', textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--rose-600)', marginBottom: '6px' }}>
                Tên in trên thiệp của bạn:
              </label>
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="name-search-input"
                style={{ borderRadius: '14px', marginBottom: 0 }}
                placeholder="Nhập tên bạn..."
              />
            </div>
          </div>

          <button
            onClick={handleDownloadCard}
            disabled={isExporting}
            className="btn-rose"
            style={{ width: '100%', background: 'linear-gradient(135deg, #E11D48, #BE123C)' }}
          >
            <span>{isExporting ? 'Đang tạo thiệp... ⏳' : 'Tải Thiệp Về Máy (PNG) 💌'}</span>
          </button>
        </div>
      </div>

      {/* Emoji Reactions */}
      <div style={{ background: '#FFFFFF', border: '2px solid var(--rose-200)', borderRadius: '28px', padding: '28px', maxWidth: '520px', margin: '40px auto', boxShadow: 'var(--shadow-sweet)', textAlign: 'center' }}>
        <p style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--rose-700)', marginBottom: '16px' }}>
          Thả tim / Gửi lời cảm ơn lại đến toàn thể anh em bằng một chạm:
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '18px', fontSize: '2.2rem' }}>
          {['❤️', '🥰', '💐', '✨', '🎉'].map((emoji, idx) => (
            <button
              key={idx}
              onClick={handleReaction}
              style={{ background: 'none', border: 'none', cursor: 'pointer', transition: 'transform 0.2s' }}
              className="reaction-emoji-btn"
            >
              {emoji}
            </button>
          ))}
        </div>
        {thanksSent && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#10B981', marginTop: '14px', fontWeight: '700' }}>
            Cảm ơn bạn! Anh em đã nhận được tim của bạn rồi nhé! 🥰
          </div>
        )}
      </div>

      {/* Hidden Render Card for Retina 2x */}
      <div style={{ position: 'fixed', left: '-9999px', top: '-9999px' }}>
        <div id="exportable-card-element" style={{ width: '800px', height: '1000px', background: 'linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 40%, #FDF2F8 100%)', padding: '60px', color: '#1E293B', fontFamily: 'Be Vietnam Pro, sans-serif', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: '40px', border: '8px solid #F43F5E', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #FDA4AF', paddingBottom: '24px' }}>
            <div>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '14px', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#E11D48', fontWeight: '700' }}>HAPPY VIETNAMESE WOMEN'S DAY</span>
              <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '32px', fontWeight: '700', color: '#BE123C', marginTop: '4px' }}>20 THÁNG 10 • YÊU THƯƠNG &amp; RẠNG RỠ</h2>
            </div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '32px', fontStyle: 'italic', color: '#FFF', background: '#E11D48', borderRadius: '50%', width: '74px', height: '74px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              20.10
            </div>
          </div>

          <div style={{ textAlign: 'center', margin: 'auto 0' }}>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '15px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#E11D48', marginBottom: '16px' }}>Tấm thiệp gửi trao</p>
            <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '56px', fontStyle: 'italic', color: '#BE123C', marginBottom: '32px' }}>
              Chị {recipientName}
            </h1>
            <div style={{ background: 'rgba(255, 255, 255, 0.95)', border: '2px solid #FDA4AF', borderRadius: '28px', padding: '40px 48px', maxWidth: '680px', margin: '0 auto' }}>
              <p style={{ fontSize: '22px', lineHeight: '1.8', color: '#334155', fontStyle: 'italic' }}>
                “Chúc bạn một ngày 20/10 ngập tràn nụ cười, luôn rực rỡ, may mắn trong công việc và vẹn tròn hạnh phúc trong cuộc sống!”
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px solid #FDA4AF', paddingTop: '24px', fontSize: '15px', color: '#BE123C', fontWeight: '600' }}>
            <span>Toàn thể anh em Tech &amp; Product thân tặng</span>
            <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>Built with love ❤️ 2026</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ marginTop: '60px', paddingTop: '24px', borderTop: '1px solid var(--rose-200)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#94A3B8', textAlign: 'center' }}>
        <p style={{ marginBottom: '6px' }}>Built with ❤️ by anh em Dev, Tech &amp; Product Team • Không có bug (chắc vậy 😄)</p>
        <p style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>
          <a href="#/sender" style={{ color: '#CBD5E1', textDecoration: 'none' }} title="Chế độ soạn thảo của Anh Em">🔑 Studio Anh Em</a>
        </p>
      </footer>

      {toastMsg && <div className="sweet-toast show">{toastMsg}</div>}
    </div>
  );
}
