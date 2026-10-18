import React, { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';

export default function IdentitySelector({ onOpenGift }) {
  const { people, selectedSister, setSelectedSister, navigateWithFlowerTransition } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [isChanging, setIsChanging] = useState(!selectedSister);

  const filteredPeople = people.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
    (p.dept && p.dept.toLowerCase().includes(searchTerm.toLowerCase().trim())) ||
    (p.role && p.role.toLowerCase().includes(searchTerm.toLowerCase().trim()))
  );

  const handleSelect = (person) => {
    setSelectedSister(person);
    setIsChanging(false);
  };

  const handleQuickSelectDropdown = (e) => {
    const val = e.target.value;
    if (val === 'GUEST') {
      setSelectedSister({ name: 'Chị Em IT Toàn Thể', dept: 'Toàn thể các đóa hoa công ty' });
      setIsChanging(false);
    } else {
      const found = people.find(p => p.id === val);
      if (found) {
        setSelectedSister(found);
        setIsChanging(false);
      }
    }
  };

  return (
    <div className="identity-selector-box">
      <div className="identity-header">
        <span className="identity-title-label">
          <span>🌸</span>
          <span>Bạn là ai nè? (Chọn tên để cá nhân hóa)</span>
        </span>
      </div>

      {/* Đã chọn một chị */}
      {selectedSister && !isChanging ? (
        <div>
          <div className="identity-selected-pill">
            <div className="selected-sister-info">
              <div className="selected-avatar-mini">
                {(selectedSister?.name || 'Chị Em').trim().split(' ').slice(-1)[0].charAt(0)}
              </div>
              <div>
                <div className="selected-sister-name">Chị {selectedSister.name}</div>
                <div className="selected-sister-dept">{selectedSister.dept || selectedSister.role || 'Thành Viên Yêu Quý'}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsChanging(true)}
              className="btn-change-identity"
              title="Chọn người nhận khác"
            >
              Đổi tên ▾
            </button>
          </div>
        </div>
      ) : (
        /* Form Chọn Tên: Select Dropdown + Gõ Tìm Kiếm */
        <div>
          {/* 1. Quick Dropdown Select */}
          <select
            value={selectedSister ? selectedSister.id : ''}
            onChange={handleQuickSelectDropdown}
            className="identity-dropdown-select"
          >
            <option value="" disabled>-- 👑 Chạm để chọn tên chị em từ danh sách --</option>
            <option value="GUEST">🌸 Xem với tư cách Khách Quý / Đại diện chị em</option>
            {people.map(p => (
              <option key={p.id} value={p.id}>
                👩 Chị {p.name} ({p.dept || p.role})
              </option>
            ))}
          </select>

          {/* 2. Search Input */}
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="identity-search-input"
            placeholder="🔍 Hoặc gõ tên bạn để tìm nhanh..."
          />

          {/* 3. Danh sách gợi ý */}
          {searchTerm.trim() && (
            <div className="identity-options-list">
              {filteredPeople.length > 0 ? (
                filteredPeople.map(p => (
                  <div
                    key={p.id}
                    className="identity-option-row"
                    onClick={() => handleSelect(p)}
                  >
                    <div>
                      <strong>{p.name}</strong>
                      <small>({p.dept || p.role})</small>
                    </div>
                    <span>🌸 Chọn</span>
                  </div>
                ))
              ) : (
                <div style={{ padding: '8px 12px', fontSize: '0.82rem', color: '#94A3B8' }}>
                  Không tìm thấy tên. Bạn có thể chọn ở menu dropdown phía trên nhé!
                </div>
              )}
            </div>
          )}

          {/* 4. Footer Links */}
          <div className="identity-footer-links">
            <button
              type="button"
              onClick={() => {
                setSelectedSister({ name: 'Chị Em IT Toàn Thể', dept: 'Toàn thể các đóa hoa công ty' });
                setIsChanging(false);
              }}
              className="link-guest-mode"
            >
              🌸 Xem với tư cách Khách Quý
            </button>

            <button
              type="button"
              onClick={() => navigateWithFlowerTransition('/sender')}
              className="link-sender-mode"
            >
              ✍️ Studio Anh Em gửi lời chúc →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
