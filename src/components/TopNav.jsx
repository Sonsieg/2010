import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import AudioController from './AudioController.jsx';

import { NAV_STAGES } from '../config/routes.config.js';

export default function TopNav() {
  const { 
    setIsArchiveOpen, 
    openedBalloons, 
    experienceMode, 
    updateExperienceMode,
    navigateWithFlowerTransition
  } = useApp();
  const location = useLocation();

  // Ẩn top nav nếu đang ở trang Sender Studio
  if (location.pathname === '/sender') return null;

  const stages = NAV_STAGES.map(s => {
    if (s.path === '/private') {
      return { ...s, label: experienceMode === '3d' ? 'Xe Hoa 3D' : 'Xe Thư 2D', icon: experienceMode === '3d' ? '🚐' : '🌸' };
    }
    return s;
  });

  const is3D = location.pathname === '/3d';

  const handleToggleMode = () => {
    if (is3D) {
      updateExperienceMode('2d');
    } else {
      updateExperienceMode('3d');
    }
  };

  return (
    <nav className="royal-top-nav" aria-label="Điều khiển đầu trang">
      {/* 1. Toggle Mode 2D / 3D */}
      <button
        onClick={handleToggleMode}
        className={`royal-nav-pill mode-switch-pill ${is3D ? 'mode-3d-active' : 'mode-2d-active'}`}
        title={`Đang xem chế độ ${is3D ? '3D Điện Ảnh' : '2D Cổ Tích'} - Nhấn để đổi sang ${is3D ? '2D Cổ Tích' : '3D Điện Ảnh'}`}
      >
        <span className="mode-badge-dot"></span>
        <span className="mode-icon">{is3D ? '✨ 3D' : '🌸 2D'}</span>
        <span className="btn-label mode-text-label">
          {is3D ? '3D Điện Ảnh' : '2D Cổ Tích'}
        </span>
      </button>

      {/* 2. Quick Demo Stages Navigator (Hiển thị ở chế độ 2D Editorial) */}
      {!is3D && (
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

