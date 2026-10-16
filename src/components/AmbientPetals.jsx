import React, { useEffect, useRef } from 'react';

export default function AmbientPetals() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const handleResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const petals = Array.from({ length: 24 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      size: Math.random() * 8 + 6,
      vy: Math.random() * 0.9 + 0.6,
      vx: Math.random() * 0.6 - 0.3,
      angle: Math.random() * Math.PI * 2,
      spin: Math.random() * 0.02 - 0.01,
      color: ['rgba(244, 63, 94, 0.45)', 'rgba(253, 164, 175, 0.55)', 'rgba(245, 158, 11, 0.4)', 'rgba(254, 205, 211, 0.5)'][Math.floor(Math.random() * 4)],
      wobble: Math.random() * Math.PI * 2
    }));

    let animId;
    function loop() {
      ctx.clearRect(0, 0, w, h);

      petals.forEach(p => {
        p.y += p.vy;
        p.wobble += 0.02;
        p.x += Math.sin(p.wobble) * 0.8 + p.vx;
        p.angle += p.spin;

        if (p.y > h + 20) {
          p.y = -20;
          p.x = Math.random() * w;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size, p.size * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      animId = requestAnimationFrame(loop);
    }

    loop();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} id="ambient-petals-canvas" />;
}
