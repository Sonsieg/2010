/**
 * Màn 0: Quản Lý Danh Tính Người Dùng ("Bạn Là Ai?") & Cá Nhân Hóa
 */
export function initIdentityModal(peopleList, onSelectCallback) {
  const modal = document.getElementById('identityModal');
  const select = document.getElementById('selectSister');
  const btnOpen = document.getElementById('btnOpenIdentityModal');
  const btnConfirm = document.getElementById('btnConfirmSister');
  const btnBrother = document.getElementById('btnIAmBrother');
  const btnSkip = document.getElementById('btnSkipIdentity');
  const labelText = document.getElementById('identityBtnLabel');

  let currentIdentity = null;

  // 1. Đổ dữ liệu chị em vào dropdown
  select.innerHTML = '<option value="">-- Chọn tên của bạn --</option>';
  peopleList.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = `${p.name} (${p.dept || p.role})`;
    select.appendChild(opt);
  });

  function openModal() {
    modal.classList.add('open');
  }

  function closeModal() {
    modal.classList.remove('open');
  }

  // 2. Xử lý URL param (?id= hoặc ?to=)
  const urlParams = new URLSearchParams(window.location.search);
  const paramId = (urlParams.get('id') || urlParams.get('to') || '').toLowerCase().trim();

  if (paramId) {
    const matched = peopleList.find(p => p.id === paramId || p.name.toLowerCase().includes(paramId));
    if (matched) {
      applyIdentity(matched);
    }
  } else {
    // Mở modal nếu chưa có danh tính trong session
    const savedId = sessionStorage.getItem('tribute_user_id');
    if (savedId) {
      const savedPerson = peopleList.find(p => p.id === savedId);
      if (savedPerson) applyIdentity(savedPerson);
    } else {
      setTimeout(() => openModal(), 400);
    }
  }

  function applyIdentity(person) {
    currentIdentity = person;
    sessionStorage.setItem('tribute_user_id', person.id);

    // Cập nhật giao diện
    if (labelText) {
      labelText.textContent = `Gửi tặng: ${person.name} 🌸`;
    }

    // Màn 2: Thư ngỏ
    const greetingEl = document.getElementById('letterGreeting');
    if (greetingEl) {
      greetingEl.textContent = `Thân gửi ${person.name} quý mến,`;
    }

    // Màn 7: Thiệp cá nhân
    const recipientInput = document.getElementById('exportCardRecipientInput');
    const exportCardName = document.getElementById('exportCardRecipientName');
    if (recipientInput) recipientInput.value = person.name;
    if (exportCardName) exportCardName.textContent = person.name;

    // Kích hoạt callback (để bật màn lời nhắn riêng, highlight gallery, v.v.)
    if (onSelectCallback) {
      onSelectCallback(person);
    }
    closeModal();
  }

  btnOpen.addEventListener('click', openModal);

  btnConfirm.addEventListener('click', () => {
    const selectedId = select.value;
    if (!selectedId) return;
    const person = peopleList.find(p => p.id === selectedId);
    if (person) applyIdentity(person);
  });

  btnBrother.addEventListener('click', () => {
    currentIdentity = { isBrother: true };
    if (labelText) labelText.textContent = 'Chế độ Anh Em 👨‍💻';
    closeModal();
    if (onSelectCallback) onSelectCallback(currentIdentity);
  });

  btnSkip.addEventListener('click', () => {
    closeModal();
  });

  return {
    getCurrentIdentity: () => currentIdentity,
    openModal
  };
}
