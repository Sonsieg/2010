import React from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import AudioController from './AudioController.jsx';

import { NAV_STAGES } from '../config/routes.config.js';

export default function TopNav() {
  const { 
    navigateWithFlowerTransition
  } = useApp();
  const location = useLocation();

  // Ẩn top nav nếu đang ở trang Sender Studio
  if (location.pathname === '/sender') return null;

  const is3D = location.pathname === '/3d';
  const stages = NAV_STAGES;

  return (
    <nav className="royal-top-nav" aria-label="Điều khiển đầu trang">
      {/* Điều hướng các màn phụ, ẩn trong trải nghiệm 3D chính */}
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

      {/* Nút Gửi Lời Chúc Dành Cho Anh Em */}

      {/* Audio Controller */}
      <AudioController />
    </nav>
  );
}

