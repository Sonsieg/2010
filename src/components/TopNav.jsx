import React from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import AudioController from './AudioController.jsx';

export default function TopNav() {
  const { setIsArchiveOpen, openedBalloons } = useApp();
  const location = useLocation();

  // Ẩn top nav nếu đang ở trang Sender Studio
  if (location.pathname === '/sender') return null;

  return (
    <nav className="top-nav" aria-label="Điều khiển đầu trang">
      <button
        onClick={() => setIsArchiveOpen(true)}
        className="pill-btn"
        title="Xem lại các lời chúc đã mở"
      >
        <span>📜</span>
        <span className="btn-label">
          Đã mở ({openedBalloons.size})
        </span>
      </button>

      <AudioController />
    </nav>
  );
}
