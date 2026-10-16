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
        className="modal-overlay open"
        onClick={() => setIsArchiveOpen(false)}
        style={{ zIndex: 120 }}
      />
      <aside className="drawer-sheet open" style={{ zIndex: 125 }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--rose-100)', paddingBottom: '16px' }}>
            <div>
              <h3 className="font-serif" style={{ fontSize: '1.5rem', color: 'var(--rose-700)' }}>
                Nhật Ký Lời Chúc 20/10 🌸
              </h3>
              <p style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: '#64748B' }}>
                Đã mở: {openedBalloons.size}/{wishes.length} lời chúc
              </p>
            </div>
            <button
              onClick={() => setIsArchiveOpen(false)}
              className="btn-close-x"
              style={{ position: 'static' }}
            >
              &times;
            </button>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="name-search-input"
              placeholder="🔍 Tìm theo tên người gửi hoặc phòng ban..."
            />
          </div>

          <div style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 220px)', display: 'flex', flexDirection: 'column', gap: '14px', paddingRight: '6px' }}>
            {filtered.map(w => {
              const isOpened = openedBalloons.has(w.id);
              return (
                <div
                  key={w.id}
                  style={{
                    background: isOpened ? '#FFFFFF' : 'var(--rose-50)',
                    border: `1.5px solid ${isOpened ? 'var(--rose-300)' : 'var(--rose-100)'}`,
                    borderRadius: '18px',
                    padding: '16px',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-start',
                    boxShadow: isOpened ? '0 4px 15px rgba(244,63,94,0.08)' : 'none'
                  }}
                >
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '14px',
                      background: w.color || '#F43F5E',
                      color: '#fff',
                      fontFamily: 'var(--font-serif)',
                      fontSize: '1.2rem',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    {w.name.charAt(0)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <strong style={{ color: '#1E293B', fontSize: '0.95rem' }}>{w.name}</strong>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.72rem',
                          color: 'var(--rose-600)',
                          background: '#FFF',
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          border: '1px solid var(--rose-200)'
                        }}
                      >
                        {w.dept || 'Tech'}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.88rem', lineHeight: '1.6', color: '#475569', fontStyle: 'italic' }}>
                      “{w.text}”
                    </p>
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
