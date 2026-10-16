import React, { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext.jsx';

export default function BalloonsPage() {
  const { wishes, openedBalloons, popBalloon, setIsArchiveOpen, navigateWithFlowerTransition } = useApp();
  const canvasRef = useRef(null);
  const activeBalloonsRef = useRef([]);

  const balloonColors = [
    '#F43F5E', '#EC4899', '#FB7185', '#F59E0B',
    '#BE123C', '#C9A66B', '#8B5CF6', '#10B981', '#0EA5E9'
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let w = (canvas.width = canvas.parentElement.clientWidth);
    let h = (canvas.height = canvas.parentElement.clientHeight);

    const handleResize = () => {
      if (!canvas.parentElement) return;
      w = canvas.width = canvas.parentElement.clientWidth;
      h = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    // Khởi tạo các quả bóng bay từ dưới lên
    // Phân bổ độ cao so le để bóng bay tràn ngập khắp màn hình
    const unpopped = wishes.filter(w => !openedBalloons.has(w.id));
    activeBalloonsRef.current = unpopped.map((wish, idx) => {
      const radius = Math.min(38, Math.max(26, w / 24));
      return {
        wish,
        radius,
        x: Math.random() * (w - radius * 2.5) + radius * 1.2,
        // Xuất phát từ dưới màn hình và rải rác trên màn hình
        y: h + (idx * 28) + Math.random() * 80,
        speedY: Math.random() * 0.9 + 0.8, // Tốc độ bay lên từ đáy
        color: wish.color || balloonColors[idx % balloonColors.length],
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: Math.random() * 0.025 + 0.015,
        wobbleAmp: Math.random() * 1.2 + 0.6
      };
    });

    let animId;
    function render() {
      ctx.clearRect(0, 0, w, h);

      activeBalloonsRef.current.forEach(b => {
        // Bay lên từ cuối trang
        b.y -= b.speedY;
        b.wobble += b.wobbleSpeed;
        const currentX = b.x + Math.sin(b.wobble) * b.wobbleAmp * 12;

        // Vòng lặp: Nếu chưa chọc thủng mà bay quá trần màn hình -> bay lại từ đáy lên!
        if (b.y < -b.radius * 2) {
          b.y = h + b.radius * 2 + Math.random() * 40;
          b.x = Math.random() * (w - b.radius * 2.5) + b.radius * 1.2;
        }

        const x = currentX;
        const y = b.y;
        const r = b.radius;

        ctx.save();

        // 1. Dây bóng bay uốn lượn bên dưới
        ctx.strokeStyle = '#FDA4AF';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x, y + r);
        ctx.quadraticCurveTo(x - 6, y + r + 15, x + 4, y + r + 32);
        ctx.stroke();

        // 2. Nút thắt bóng
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.moveTo(x - 5, y + r);
        ctx.lineTo(x + 5, y + r);
        ctx.lineTo(x, y + r + 6);
        ctx.closePath();
        ctx.fill();

        // 3. Thân bóng hình giọt nước tròn
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();

        // Viền sáng bóng
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 4. Ánh sáng phản chiếu bóng loáng (Gloss)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.beginPath();
        ctx.ellipse(x - r * 0.35, y - r * 0.35, r * 0.32, r * 0.16, -Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();

        // 5. In tên người gửi trên bề mặt bóng
        ctx.font = '700 11px "Be Vietnam Pro", sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
        ctx.shadowBlur = 4;

        const shortName = b.wish.name.split(' ').slice(-1)[0];
        ctx.fillText(shortName, x, y);

        ctx.restore();
      });

      animId = requestAnimationFrame(render);
    }

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [wishes, openedBalloons]);

  // Xử lý chọc nổ bóng khi chạm vào canvas
  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Tìm bóng gần nhất với tọa độ click
    const clickedIdx = activeBalloonsRef.current.findIndex(b => {
      const currentX = b.x + Math.sin(b.wobble) * b.wobbleAmp * 12;
      return Math.hypot(currentX - clickX, b.y - clickY) <= b.radius + 8;
    });

    if (clickedIdx !== -1) {
      const balloon = activeBalloonsRef.current[clickedIdx];
      // Xóa bóng khỏi danh sách đang bay
      activeBalloonsRef.current.splice(clickedIdx, 1);

      // Kích hoạt nổ cánh hoa tại đúng tọa độ
      const screenX = e.clientX / window.innerWidth;
      const screenY = e.clientY / window.innerHeight;
      popBalloon(balloon.wish, { x: screenX, y: screenY });
    }
  };

  const handleRandomPop = () => {
    if (activeBalloonsRef.current.length === 0) {
      alert('Chị em đã mở hết bóng rồi! Cùng khám phá Hòm Thư Bí Mật nhé! 🌸');
      return;
    }
    const randIdx = Math.floor(Math.random() * activeBalloonsRef.current.length);
    const balloon = activeBalloonsRef.current[randIdx];
    activeBalloonsRef.current.splice(randIdx, 1);

    const canvas = canvasRef.current;
    const rect = canvas ? canvas.getBoundingClientRect() : { left: 0, top: 0 };
    const currentX = balloon.x + Math.sin(balloon.wobble) * balloon.wobbleAmp * 12;
    const screenX = (rect.left + currentX) / window.innerWidth;
    const screenY = (rect.top + balloon.y) / window.innerHeight;

    popBalloon(balloon.wish, { x: screenX, y: screenY });
  };

  return (
    <div className="page-screen" id="page-balloons">
      <div className="sky-header">
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: '700', color: 'var(--rose-500)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
          Floating Balloons Sky
        </span>
        <h2 className="sky-title">Bầu Trời Lời Chúc Từ Anh Em</h2>
        <p style={{ color: '#64748B', fontSize: '0.95rem' }}>
          Bóng bay liên tục từ dưới lên tràn ngập bầu trời. Chạm vào bất kỳ quả bóng nào để nổ ra lời chúc! 🎈
        </p>
      </div>

      {/* Floating Canvas Viewport */}
      <div className="sky-viewport">
        {/* Floating Top Controls */}
        <div className="sky-hud">
          <div className="hud-counter-badge">
            Đã mở: <strong style={{ color: 'var(--rose-600)', fontSize: '1.05rem' }}>{openedBalloons.size}</strong> / {wishes.length} lời chúc
          </div>
          <div className="hud-buttons">
            <button onClick={handleRandomPop} className="pill-btn" title="Mở ngẫu nhiên">
              <span>🎲 Mở ngẫu nhiên</span>
            </button>
            <button onClick={() => setIsArchiveOpen(true)} className="pill-btn" title="Xem danh sách">
              <span>📜 Danh sách lời chúc</span>
            </button>
          </div>
        </div>

        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          id="balloons-physics-canvas"
        />
      </div>

      {/* Next Step Banner */}
      <div style={{ marginTop: '28px', textAlign: 'center' }}>
        <button
          onClick={() => navigateWithFlowerTransition('/private')}
          className="btn-rose"
          style={{ background: 'linear-gradient(135deg, #BE123C, #881337)', boxShadow: '0 10px 25px rgba(190, 18, 60, 0.35)', fontSize: '1.05rem' }}
        >
          <span>Bước Tiếp Theo: Hòm Thư Trái Tim Bí Mật 💌</span>
        </button>
      </div>
    </div>
  );
}
