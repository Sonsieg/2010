import { submitWish } from '../api.js';

export function initSenderStudio(peopleList, showToastCallback) {
  const urlParams = new URLSearchParams(window.location.search);
  const isSenderMode = urlParams.get('mode') === 'sender' || urlParams.get('role') === 'brother';

  const sisterApp = document.getElementById('main-sister-experience');
  const studioApp = document.getElementById('mode-sender-studio');
  const form = document.getElementById('senderStudioForm');
  const toSelect = document.getElementById('studioToSelect');
  const charCounter = document.getElementById('studioCharCounter');
  const textInput = document.getElementById('studioTextInput');
  const fromNameInput = document.getElementById('studioFromNameInput');
  const anonymousCheck = document.getElementById('studioAnonymousCheck');
  const btnSubmit = document.getElementById('btnSubmitStudioWish');

  if (isSenderMode) {
    if (sisterApp) sisterApp.style.display = 'none';
    if (studioApp) studioApp.style.display = 'block';
    document.title = 'Tribute Writer Studio 👨‍💻 • Soạn Lời Chúc 20/10';
  } else {
    if (studioApp) studioApp.style.display = 'none';
    if (sisterApp) sisterApp.style.display = 'block';
  }

  // Đổ danh sách chị em vào select
  if (toSelect && peopleList) {
    peopleList.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = `💌 Gửi riêng chị: ${p.name} (${p.dept || p.role})`;
      toSelect.appendChild(opt);
    });
  }

  // Bộ đếm ký tự
  if (textInput && charCounter) {
    textInput.addEventListener('input', () => {
      charCounter.textContent = `${textInput.value.length}/250`;
    });
  }

  // Xử lý gửi lời chúc từ Studio
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const text = textInput.value.trim();
      if (!text) {
        if (showToastCallback) showToastCallback('Vui lòng nhập nội dung lời chúc!');
        return;
      }

      const selectedColor = document.querySelector('input[name="balloonColor"]:checked')?.value || '#F43F5E';
      const to = toSelect.value;
      const from_name = fromNameInput.value.trim() || 'Một người anh em';
      const anonymous = anonymousCheck.checked;
      const honeypot = document.getElementById('studioHoneypot')?.value || '';

      btnSubmit.disabled = true;
      btnSubmit.innerHTML = '<span>Đang gửi lời chúc vào hệ thống... ⏳</span>';

      const res = await submitWish({
        to,
        from_name,
        anonymous,
        text,
        color: selectedColor,
        honeypot
      });

      btnSubmit.disabled = false;
      btnSubmit.innerHTML = '<span>Gửi Lời Chúc Vào Hệ Thống 🚀</span>';

      if (res.success) {
        if (showToastCallback) {
          showToastCallback('Gửi lời chúc thành công! Cảm ơn bạn rất nhiều! 🎉');
        }
        form.reset();
        if (charCounter) charCounter.textContent = '0/250';
      } else {
        if (showToastCallback) {
          showToastCallback(res.message || 'Lỗi gửi lời chúc, vui lòng thử lại.');
        }
      }
    });
  }

  return { isSenderMode };
}
