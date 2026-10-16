import React, { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { submitWish } from '../api.js';

export default function SenderStudioPage() {
  const { people } = useApp();
  const [to, setTo] = useState('ALL');
  const [fromName, setFromName] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [color, setColor] = useState('#F43F5E');
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) {
      showToast('Vui lòng nhập nội dung lời chúc!');
      return;
    }

    setIsSubmitting(true);
    const res = await submitWish({
      to,
      from_name: fromName.trim() || 'Một người anh em',
      anonymous: isAnonymous,
      text: text.trim(),
      color
    });
    setIsSubmitting(false);

    if (res.success) {
      showToast('Gửi lời chúc thành công! Cảm ơn bạn rất nhiều! 🎉');
      setText('');
      setFromName('');
    } else {
      showToast(res.message || 'Lỗi gửi lời chúc, vui lòng thử lại.');
    }
  };

  return (
    <div className="page-screen" id="page-sender" style={{ background: 'linear-gradient(135deg, #1E1B26 0%, #2D1424 100%)', color: '#FFF' }}>
      <div className="studio-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid rgba(201,166,107,0.3)', paddingBottom: '16px' }}>
          <div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--champagne-gold)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
              Pre-20/10 Portal
            </span>
            <h1 className="font-serif" style={{ fontSize: '1.8rem', color: '#FFF', marginTop: '4px' }}>
              Góc Viết Lời Chúc Của Anh Em 👨‍💻
            </h1>
          </div>
          <a href="#/" className="pill-btn" style={{ background: 'rgba(255,255,255,0.1)', color: '#FFF', borderColor: 'var(--champagne-gold)' }}>
            <span>Xem thử trang Chị Em 🌸</span>
          </a>
        </div>

        <p style={{ fontSize: '0.92rem', color: '#E2E8F0', lineHeight: '1.7', marginBottom: '28px' }}>
          Chào anh em! Hãy gửi những lời chúc chân thành, trân trọng nhất gửi tới các chị em công ty. Lời chúc của bạn sẽ hóa thành quả bóng bay hoặc bức thư bí mật trao tay các chị vào đúng ngày 20/10!
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--champagne-gold)', textTransform: 'uppercase' }}>
              1. Bạn muốn gửi tới:
            </label>
            <select
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="studio-select"
            >
              <option value="ALL">🎈 Tất cả chị em (Bóng bay công khai trên bầu trời)</option>
              {people.map(p => (
                <option key={p.id} value={p.id}>
                  💌 Gửi riêng chị: {p.name} ({p.dept || p.role})
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--champagne-gold)', textTransform: 'uppercase' }}>
              2. Tên của bạn:
            </label>
            <input
              type="text"
              value={fromName}
              onChange={(e) => setFromName(e.target.value)}
              className="studio-input"
              placeholder="Ví dụ: Hoàng Minh - Backend..."
            />
          </div>

          <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="checkbox"
              id="anonymousCheck"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              style={{ width: '20px', height: '20px', accentColor: 'var(--rose-500)' }}
            />
            <label htmlFor="anonymousCheck" style={{ fontSize: '0.9rem', color: 'var(--champagne-light)', cursor: 'pointer' }}>
              Gửi ẩn danh (Người nhận chỉ thấy là 'Đồng nghiệp ẩn danh')
            </label>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--champagne-gold)', textTransform: 'uppercase' }}>
              3. Chọn màu bóng bay:
            </label>
            <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
              {['#F43F5E', '#EC4899', '#C9A66B', '#8B5CF6', '#10B981', '#0EA5E9'].map(c => (
                <label key={c} style={{ cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="balloonColor"
                    value={c}
                    checked={color === c}
                    onChange={() => setColor(c)}
                  />
                  <span style={{ display: 'inline-block', width: '24px', height: '24px', background: c, borderRadius: '50%', verticalAlign: 'middle', marginLeft: '4px' }}></span>
                </label>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--champagne-gold)', textTransform: 'uppercase' }}>
                4. Lời chúc của bạn:
              </label>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: '#94A3B8' }}>
                {text.length}/250
              </span>
            </div>
            <textarea
              rows={5}
              value={text}
              maxLength={250}
              onChange={(e) => setText(e.target.value)}
              className="studio-textarea"
              placeholder="Viết những lời trân trọng, cảm ơn chân thành nhất gửi đến chị em..."
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-rose"
            style={{ width: '100%', fontSize: '1.05rem' }}
          >
            <span>{isSubmitting ? 'Đang gửi lời chúc... ⏳' : 'Gửi Lời Chúc Vào Hệ Thống 🚀'}</span>
          </button>
        </form>

        {toastMsg && <div className="sweet-toast show">{toastMsg}</div>}
      </div>
    </div>
  );
}
