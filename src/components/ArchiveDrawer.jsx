import React, { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';

export default function ArchiveDrawer() {
  const { isArchiveOpen, setIsArchiveOpen, wishes, openedBalloons } = useApp();
  const [search, setSearch] = useState('');

  if (!isArchiveOpen) return null;

  const filtered = wishes.filter(w => {
    const sName = (w && (w.from_name || w.name || w.sender)) || '';
    const sDept = (w && (w.dept || w.role)) || '';
    const sText = (w && (w.text || w.message)) || '';
    const term = search.toLowerCase().trim();
    return (
      sName.toLowerCase().includes(term) ||
      sDept.toLowerCase().includes(term) ||
      sText.toLowerCase().includes(term)
    );
  });

  return (
    <>
      <div
        className="royal-modal-overlay open"
        onClick={() => setIsArchiveOpen(false)}
        style={{ zIndex: 140 }}
      />
      <aside className="royal-drawer-sheet open" style={{ zIndex: 145 }}>
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Header Sổ Lưu Niệm */}
          <div className="royal-drawer-header">
            <div>
              <div className="drawer-eyebrow">ROYAL ARCHIVE • SỔ LƯU NIỆM</div>
              <h3 className="drawer-title">
                Nhật Ký Tâm Tình 20/10 🌸
              </h3>
              <p className="drawer-counter">
                Đã khám phá: <strong>{openedBalloons.size}</strong> / {wishes.length} lời chúc từ anh em
              </p>
            </div>
            <button
              onClick={() => setIsArchiveOpen(false)}
              className="royal-btn-close"
              style={{ position: 'static' }}
              title="Đóng ngăn kéo"
            >
              ✕
            </button>
          </div>

          {/* Ô Tìm Kiếm */}
          <div style={{ marginBottom: '18px' }}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="royal-search-input"
              placeholder="🔍 Tìm người gửi hoặc lời chúc..."
            />
          </div>

          {/* Danh Sách Lời Chúc Trong Sổ */}
          <div className="royal-drawer-scroll-list">
            {filtered.map(w => {
              const isOpened = openedBalloons.has(w.id);
              const senderName = w.from_name || w.name || w.sender || 'Tech Team';
              const initial = String(senderName).trim().charAt(0) || '🌸';
              const senderDept = w.dept || w.role || 'Tech & Product Team';
              const wishText = w.text || w.message || '';

              return (
                <div
                  key={w.id}
                  className={`royal-archive-item ${isOpened ? 'item-opened' : 'item-locked'}`}
                >
                  <div className="archive-avatar">
                    {initial}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="archive-item-top">
                      <strong className="archive-sender-name">{senderName}</strong>
                      <span className="archive-dept-badge">
                        {senderDept}
                      </span>
                    </div>
                    <p className="archive-quote-text">
                      “{wishText}”
                    </p>
                    {isOpened && (
                      <span className="archive-opened-indicator">
                        ✦ Đã đón nhận
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </aside>
    </>
  );
}

