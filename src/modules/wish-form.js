import { submitWish } from '../api.js';

export function initWishForm(peopleList, showToastCallback) {
  const backdrop = document.getElementById('wishDrawerBackdrop');
  const panel = document.getElementById('wishDrawerPanel');
  const btnOpen = document.getElementById('btnOpenWishDrawer');
  const btnClose = document.getElementById('btnCloseDrawer');
  const form = document.getElementById('formSubmitWish');
  const toSelect = document.getElementById('wishToSelect');
  const charCounter = document.getElementById('charCounter');
  const textInput = document.getElementById('wishTextInput');
  const btnSubmit = document.getElementById('btnSubmitWishForm');

  // Đổ danh sách chị em vào select 'Gửi tặng đến'
  if (toSelect) {
    peopleList.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = `Riêng chị: ${p.name} (Hòm thư riêng ✉️)`;
      toSelect.appendChild(opt);
    });
  }

  function openDrawer() {
    backdrop.classList.add('open');
    panel.classList.add('open');
  }

  function closeDrawer() {
    backdrop.classList.remove('open');
    panel.classList.remove('open');
  }

  if (btnOpen) btnOpen.addEventListener('click', openDrawer);
  if (btnClose) btnClose.addEventListener('click', closeDrawer);
  if (backdrop) backdrop.addEventListener('click', closeDrawer);

  // Bộ đếm ký tự
  if (textInput && charCounter) {
    textInput.addEventListener('input', () => {
      const len = textInput.value.length;
      charCounter.textContent = `${len}/250`;
    });
  }

  // Submit form
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const honeypot = document.getElementById('honeypotField').value;
      const to = toSelect.value;
      const from_name = document.getElementById('wishFromNameInput').value.trim();
      const anonymous = document.getElementById('wishAnonymousCheck').checked;
      const text = textInput.value.trim();

      if (!text) {
        if (showToastCallback) showToastCallback('Vui lòng nhập nội dung lời chúc.');
        return;
      }

      btnSubmit.disabled = true;
      btnSubmit.innerHTML = '<span>Đang gửi lời chúc... ⏳</span>';

      const payload = {
        honeypot,
        to,
        from_name: from_name || 'Anh Em',
        anonymous,
        text
      };

      const result = await submitWish(payload);

      btnSubmit.disabled = false;
      btnSubmit.innerHTML = '<span>Gửi Lời Chúc Ngay 🚀</span>';

      if (result.success) {
        if (showToastCallback) {
          showToastCallback(result.message || 'Lời chúc đã được gửi thành công!');
        }
        form.reset();
        if (charCounter) charCounter.textContent = '0/250';
        closeDrawer();
      } else {
        if (showToastCallback) {
          showToastCallback(result.message || 'Gửi thất bại, thử lại sau.');
        }
      }
    });
  }

  return { openDrawer, closeDrawer };
}
