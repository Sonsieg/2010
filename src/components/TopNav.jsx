import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import AudioController from './AudioController.jsx';

export default function TopNav() {
  const { 
    setIsArchiveOpen, 
    openedBalloons, 
    experienceMode, 
    toggleExperienceMode,
    navigateWithFlowerTransition
  } = useApp();
  const location = useLocation();

  // Ẩn top nav nếu đang ở trang Sender Studio
  if (location.pathname === '/sender') return null;

  const stages = [
    { path: '/', label: 'Hộp Quà', icon: '🎁' },
    { path: '/letter', label: 'Thư Ngỏ', icon: '💌' },
    { path: '/balloons', label: 'Bóng Bay', icon: '🎈' },
    { path: '/private', label: experienceMode === '3d' ? 'Xe Hoa 3D' : 'Xe Thư 2D', icon: experienceMode === '3d' ? '🚐' : '🌸' },
    { path: '/video', label: 'Phim Tri Ân', icon: '🎬' },
    { path: '/party', label: 'Màn Kết', icon: '💐' }
  ];

  return (
    <nav className="royal-top-nav" aria-label="Điều khiển đầu trang">
      {/* 1. Toggle Mode 2D / 3D */}
      <button
        onClick={toggleExperienceMode}
        className={`royal-nav-pill mode-switch-pill ${experienceMode === '3d' ? 'mode-3d-active' : 'mode-2d-active'}`}
        title={`Đang xem chế độ ${experienceMode.toUpperCase()} - Nhấn để đổi sang ${experienceMode === '3d' ? '2D Cổ Tích' : '3D Điện Ảnh'}`}
      >
        <span className="mode-badge-dot"></span>
        <span className="mode-icon">{experienceMode === '3d' ? '✨ 3D' : '🌸 2D'}</span>
        <span className="btn-label mode-text-label">
          {experienceMode === '3d' ? '3D Điện Ảnh' : '2D Cổ Tích'}
        </span>
      </button>

      {/* 2. Quick Demo Stages Navigator (Hiển thị ở chế độ 2D Editorial) */}
      {experienceMode !== '3d' && (
        <div className="royal-stages-pill-group">
          {stages.map((st) => {
            const isActive = location.pathname === st.path;
            return (
              <button
                key={st.path}
                onClick={() => navigateWithFlowerTransition(st.path)}
                className={`royal-stage-btn ${isActive ? 'active' : ''}`}
                title={`Nhảy nhanh tới màn: ${st.label}`}
              >
                <span className="stage-icon">{st.icon}</span>
                <span className="stage-text">{st.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* 3. Lời chúc đã mở */}
      <button
        onClick={() => setIsArchiveOpen(true)}
        className="royal-nav-pill"
        title="Xem lại các lời chúc đã mở"
      >
        <span>📜</span>
        <span className="btn-label">
          Đã mở ({openedBalloons.size})
        </span>
      </button>

      {/* 4. Audio Controller */}
      <AudioController />
    </nav>
  );
}

