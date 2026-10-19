import React, { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { submitWish } from '../api.js';

const QUICK_TEMPLATES = [
  {
    icon: '🌸',
    label: 'Tri ân & Đồng hành',
    text: 'Em yêu Vân Anh (Anh Tỏm), cảm ơn em vì đã luôn làm cuộc sống của Anh Són dịu dàng hơn. Chúc em 20/10 thật hạnh phúc, ngọt ngào và luôn được anh yêu thương!'
  },
  {
    icon: '✨',
    label: 'Tỏa sáng & Rạng ngời',
    text: 'Vân Anh yêu của anh, chúc em ngày 20/10 luôn rạng rỡ, vui vẻ và tỏa sáng. Anh Són luôn tự hào và thương em thật nhiều!'
  },
  {
    icon: '☕',
    label: 'Ngọt ngào & Hạnh phúc',
    text: 'Anh Tỏm yêu ơi, chúc em một ngày 20/10 thật ấm áp. Mong mỗi ngày của em đều có niềm vui, những cái ôm và tình yêu của Anh Són!'
  },
  {
    icon: '💎',
    label: 'Bản lĩnh & Thành công',
    text: 'Vân Anh là cô gái tuyệt vời nhất trong lòng Anh Són. Chúc em luôn tự tin, hạnh phúc và gặt hái mọi điều em mong muốn trong cuộc sống!'
  }
];

const DEFAULT_DEPARTMENTS = [
  'Strongest',
  'Engineering (Backend/Dev)',
  'Frontend & Mobile Team',
  'Quality Assurance (QA/QC)',
  'Product & Design (UI/UX)',
  'DevOps & System Infra',
  'Data & AI Team',
  'Tech Support & Operations',
  'Toàn thể Anh Em Công Ty'
];

export default function SenderStudioPage() {
  const { people, navigateWithFlowerTransition } = useApp();
  const [to, setTo] = useState('ALL');
  const [fromName, setFromName] = useState('');
  
  // Tự động gom các phòng ban từ tab 'people' của Google Sheet + phòng ban mặc định
  const departmentOptions = React.useMemo(() => {
    const fromSheet = (people || [])
      .map(p => (p.dept || '').trim())
      .filter(Boolean);
    return Array.from(new Set([...fromSheet, ...DEFAULT_DEPARTMENTS]));
  }, [people]);

  const [dept, setDept] = useState('Strongest');
  const [isCustomDept, setIsCustomDept] = useState(false);
  const [customDept, setCustomDept] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [color, setColor] = useState('#F43F5E');
  const [text, setText] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  const handleSelectTemplate = (templateText) => {
    setText(templateText);
    showToast('✨ Đã áp dụng mẫu lời chúc! Bạn có thể chỉnh sửa thêm.');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (honeypot) return; // Chặn bot spam

    if (!text.trim()) {
      showToast('⚠️ Vui lòng nhập nội dung lời chúc!');
      return;
    }

    const finalDept = isCustomDept ? (customDept.trim() || 'Anh Em Công Ty') : dept;

    setIsSubmitting(true);
    const res = await submitWish({
      to,
      from_name: fromName.trim() || 'Anh Són',
      dept: finalDept || 'Strongest',
      anonymous: isAnonymous,
      text: text.trim(),
      color,
      honeypot
    });
    setIsSubmitting(false);

    if (res.success) {
      showToast('🎉 Gửi lời chúc thành công! Cảm ơn bạn rất nhiều! Lời chúc sẽ xuất hiện sau khi duyệt.');
      setText('');
      setFromName('');
    } else {
      showToast(res.message || 'Lỗi gửi lời chúc, vui lòng thử lại.');
    }
  };

  return (
    <div className="page-screen" id="page-sender" style={{ background: 'radial-gradient(ellipse at 50% 20%, #2D1424 0%, #150A12 100%)', color: '#FFF', minHeight: '100dvh', padding: '40px 16px' }}>
      <div className="studio-container" style={{ maxWidth: '680px', margin: '0 auto', background: 'rgba(30, 15, 24, 0.85)', backdropFilter: 'blur(20px)', borderRadius: '24px', border: '1px solid rgba(201,166,107,0.3)', padding: '32px 28px', boxShadow: '0 20px 50px rgba(0,0,0,0.6)' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid rgba(201,166,107,0.25)', paddingBottom: '16px' }}>
          <div>
            <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.75rem', color: '#C9A66B', letterSpacing: '0.25em', textTransform: 'uppercase', fontWeight: '600' }}>
              ✦ GÓC TÂM TÌNH ANH EM IT ✦
            </span>
            <h1 className="font-serif" style={{ fontSize: '1.85rem', color: '#FAF3EA', marginTop: '6px', fontWeight: '700' }}>
              Trao Gửi Lời Chúc 20/10 💌
            </h1>
          </div>
          <button
            type="button"
            onClick={() => navigateWithFlowerTransition('/')}
            className="pill-btn"
            style={{ background: 'rgba(201,166,107,0.15)', color: '#FDE68A', borderColor: 'rgba(201,166,107,0.5)', padding: '8px 16px', fontSize: '0.85rem' }}
          >
            <span>Vào Trang Chúc Mừng 🌸</span>
          </button>
        </div>

        <p style={{ fontSize: '0.94rem', color: '#E2E8F0', lineHeight: '1.7', marginBottom: '24px' }}>
          Chào anh em! Hãy gửi những lời chúc chân thành, trân trọng năng lực và sự đồng hành của các chị em. Lời chúc của bạn sẽ hóa thành <strong>bóng bay bay lượn</strong> trên bầu trời công ty hoặc <strong>bức thư bí mật dát vàng</strong> gửi riêng vào ngày 20/10!
        </p>

        {/* Mẫu lời chúc nhanh */}
        <div style={{ marginBottom: '24px', background: 'rgba(255,255,255,0.04)', borderRadius: '14px', padding: '14px 16px', border: '1px solid rgba(201,166,107,0.15)' }}>
          <div style={{ fontSize: '0.8rem', color: '#C9A66B', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px', fontWeight: '600' }}>
            💡 Gợi ý nhanh (Bấm để điền mẫu lời chúc chuẩn mực):
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {QUICK_TEMPLATES.map((tmpl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectTemplate(tmpl.text)}
                style={{
                  background: 'rgba(201,166,107,0.12)',
                  border: '1px solid rgba(201,166,107,0.3)',
                  color: '#FAF3EA',
                  borderRadius: '20px',
                  padding: '6px 14px',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(201,166,107,0.25)'; e.currentTarget.style.borderColor = '#FDE68A'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(201,166,107,0.12)'; e.currentTarget.style.borderColor = 'rgba(201,166,107,0.3)'; }}
              >
                <span>{tmpl.icon}</span>
                <span>{tmpl.label}</span>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Honeypot field (ẩn chống bot) */}
          <input
            type="text"
            name="website_url"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            style={{ display: 'none' }}
            tabIndex={-1}
            autoComplete="off"
          />

          {/* 1. Người nhận */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', color: '#C9A66B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px', fontWeight: '600' }}>
              1. Bạn muốn gửi tới:
            </label>
            <select
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="studio-select"
              style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', background: '#1A0C16', color: '#FFF', border: '1px solid rgba(201,166,107,0.4)', fontSize: '0.94rem' }}
            >
              <option value="ALL">🎈 Tất cả chị em (Bóng bay công khai trên bầu trời)</option>
              {people.map(p => (
                <option key={p.id} value={p.id}>
                  💌 Gửi riêng chị: {p.name} ({p.dept || p.role})
                </option>
              ))}
            </select>
          </div>

          {/* 2. Tên & Phòng ban */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: '#C9A66B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px', fontWeight: '600' }}>
                2. Tên của bạn:
              </label>
              <input
                type="text"
                value={fromName}
                onChange={(e) => setFromName(e.target.value)}
                className="studio-input"
                placeholder="Ví dụ: Hoàng Minh..."
                style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', background: '#1A0C16', color: '#FFF', border: '1px solid rgba(201,166,107,0.4)', fontSize: '0.94rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: '#C9A66B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px', fontWeight: '600' }}>
                3. Phòng ban / Team:
              </label>
              <select
                value={isCustomDept ? 'CUSTOM' : dept}
                onChange={(e) => {
                  if (e.target.value === 'CUSTOM') {
                    setIsCustomDept(true);
                  } else {
                    setIsCustomDept(false);
                    setDept(e.target.value);
                  }
                }}
                className="studio-select"
                style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', background: '#1A0C16', color: '#FFF', border: '1px solid rgba(201,166,107,0.4)', fontSize: '0.94rem' }}
              >
                {departmentOptions.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
                <option value="CUSTOM">✍️ Khác (Tự gõ phòng ban của bạn)...</option>
              </select>

              {isCustomDept && (
                <input
                  type="text"
                  value={customDept}
                  onChange={(e) => setCustomDept(e.target.value)}
                  placeholder="Gõ tên phòng ban của bạn (VD: Ban Giám Đốc, Media Team...)"
                  style={{ width: '100%', marginTop: '8px', padding: '10px 14px', borderRadius: '8px', background: '#25121F', color: '#FDE68A', border: '1px solid #C9A66B', fontSize: '0.9rem' }}
                  autoFocus
                />
              )}
            </div>
          </div>

          {/* Ẩn danh */}
          <div style={{ marginBottom: '22px', display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '10px', border: '1px dashed rgba(201,166,107,0.3)' }}>
            <input
              type="checkbox"
              id="anonymousCheck"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              style={{ width: '20px', height: '20px', accentColor: '#BE123C', cursor: 'pointer' }}
            />
            <label htmlFor="anonymousCheck" style={{ fontSize: '0.88rem', color: '#E2E8F0', cursor: 'pointer' }}>
              <strong>Gửi ẩn danh với người nhận</strong> (Trên thẻ chỉ hiện <em>'Đồng nghiệp ẩn danh'</em>, nhưng admin vẫn biết danh tính của bạn)
            </label>
          </div>

          {/* Màu sắc bóng bay */}
          <div style={{ marginBottom: '22px' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', color: '#C9A66B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px', fontWeight: '600' }}>
              4. Chọn sắc màu bóng bay:
            </label>
            <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
              {[
                { hex: '#F43F5E', name: 'Hồng Rose' },
                { hex: '#EC4899', name: 'Hồng Phấn' },
                { hex: '#C9A66B', name: 'Vàng Champagne' },
                { hex: '#8B5CF6', name: 'Tím Lavender' },
                { hex: '#10B981', name: 'Xanh Emerald' },
                { hex: '#0EA5E9', name: 'Xanh Bầu Trời' }
              ].map(item => (
                <label key={item.hex} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }} title={item.name}>
                  <input
                    type="radio"
                    name="balloonColor"
                    value={item.hex}
                    checked={color === item.hex}
                    onChange={() => setColor(item.hex)}
                    style={{ cursor: 'pointer' }}
                  />
                  <span style={{ display: 'inline-block', width: '26px', height: '26px', background: item.hex, borderRadius: '50%', boxShadow: color === item.hex ? '0 0 10px ' + item.hex : 'none', border: color === item.hex ? '2px solid #FFF' : '1px solid rgba(255,255,255,0.2)' }}></span>
                </label>
              ))}
            </div>
          </div>

          {/* Lời chúc */}
          <div style={{ marginBottom: '26px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: '0.82rem', color: '#C9A66B', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '600' }}>
                5. Nội dung lời chúc:
              </label>
              <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.78rem', color: text.length > 280 ? '#F43F5E' : '#94A3B8' }}>
                {text.length}/300 ký tự
              </span>
            </div>
            <textarea
              rows={5}
              value={text}
              maxLength={300}
              onChange={(e) => setText(e.target.value)}
              className="studio-textarea"
              placeholder="Viết những lời trân trọng, cảm ơn chân thành nhất gửi đến chị em..."
              style={{ width: '100%', padding: '14px', borderRadius: '12px', background: '#1A0C16', color: '#FAF3EA', border: '1px solid rgba(201,166,107,0.4)', fontSize: '0.95rem', lineHeight: '1.6', resize: 'vertical' }}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-rose"
            style={{ width: '100%', padding: '15px 24px', fontSize: '1.05rem', fontWeight: '700', borderRadius: '12px', letterSpacing: '0.04em', background: 'linear-gradient(135deg, #BE123C 0%, #8C2F4B 100%)', boxShadow: '0 8px 24px rgba(190, 18, 60, 0.45)', cursor: isSubmitting ? 'wait' : 'pointer' }}
          >
            <span>{isSubmitting ? 'Đang gửi lời chúc vào hệ thống... ⏳' : 'Gửi Lời Chúc Vào Hệ Thống 🚀'}</span>
          </button>
        </form>

        {toastMsg && <div className="sweet-toast show" style={{ position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)', background: '#1E0F18', border: '1.5px solid #C9A66B', color: '#FDE68A', padding: '14px 28px', borderRadius: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.8)', zIndex: 9999 }}>{toastMsg}</div>}
      </div>
    </div>
  );
}

