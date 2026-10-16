import React, { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext.jsx';

export default function FloralTransition() {
  const { isTransitioning } = useApp();
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!isTransitioning) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    // Tạo cơn bão hoa bay chuyển cảnh (Floral Storm Wipe)
    const petals = Array.from({ length: 65 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h - 100,
      size: Math.random() * 16 + 10,
      vx: (Math.random() - 0.5) * 8 + 3,
      vy: Math.random() * 8 + 6,
      rot: Math.random() * 360,
      vrot: Math.random() * 8 - 4,
      color: ['#F43F5E', '#FDA4AF', '#FCD34D', '#FFF1F2', '#FECDD3', '#E11D48'][Math.floor(Math.random() * 6)],
      alpha: Math.random() * 0.5 + 0.5
    }));

    let animId;
    function render() {
      ctx.clearRect(0, 0, w, h);

      // Nền ánh hồng mờ phủ qua
      ctx.fillStyle = 'rgba(255, 241, 242, 0.45)';
      ctx.fillRect(0, 0, w, h);

      petals.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vrot;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size, p.size * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      animId = requestAnimationFrame(render);
    }

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isTransitioning]);

  if (!isTransitioning) return null;

  return (
    <div className="floral-transition-curtain">
      <canvas ref={canvasRef} className="floral-transition-canvas" />
      <div className="floral-transition-banner">
        <span className="banner-icon">🌸</span>
        <h3 className="banner-text">Mở Ra Khoảnh Khắc Tiếp Theo...</h3>
      </div>
    </div>
  );
}
