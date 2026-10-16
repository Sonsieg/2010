import React, { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';

export default function ArchiveDrawer() {
  const { isArchiveOpen, setIsArchiveOpen, wishes, openedBalloons } = useApp();
  const [search, setSearch] = useState('');

  if (!isArchiveOpen) return null;

  const filtered = wishes.filter(w =>
    w.name.toLowerCase().includes(search.toLowerCase().trim()) ||
    (w.dept && w.dept.toLowerCase().includes(search.toLowerCase().trim())) ||
    w.text.toLowerCase().includes(search.toLowerCase().trim())
  );

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
              return (
                <div
                  key={w.id}
                  className={`royal-archive-item ${isOpened ? 'item-opened' : 'item-locked'}`}
                >
                  <div className="archive-avatar">
                    {w.name.charAt(0)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="archive-item-top">
                      <strong className="archive-sender-name">{w.name}</strong>
                      <span className="archive-dept-badge">
                        {w.dept || 'Tech Team'}
                      </span>
                    </div>
                    <p className="archive-quote-text">
                      “{w.text}”
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

