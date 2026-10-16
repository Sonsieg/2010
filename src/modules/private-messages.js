import { fetchPrivateWishes } from '../api.js';

export function initPrivateMessages() {
  const screen = document.getElementById('screen-private-box');
  const pinContainer = document.getElementById('pinBoxContainer');
  const unlockedSection = document.getElementById('unlockedLettersSection');
  const unlockedContainer = document.getElementById('unlockedLettersContainer');
  const unlockedHeader = document.getElementById('unlockedHeaderTitle');
  const errorMsg = document.getElementById('pinErrorMessage');
  const btnUnlock = document.getElementById('btnUnlockPrivateWishes');
  const pinInputs = document.querySelectorAll('.pin-box');

  let currentSister = null;

  // Xử lý auto-advance giữa các ô nhập PIN 4 số
  pinInputs.forEach((input, index) => {
    input.addEventListener('input', () => {
      if (input.value.length === 1 && index < pinInputs.length - 1) {
        pinInputs[index + 1].focus();
      }
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !input.value && index > 0) {
        pinInputs[index - 1].focus();
      }
    });
  });

  function setSister(sister) {
    currentSister = sister;
    if (sister) {
      if (screen) screen.style.display = 'block';
      lock();
    }
  }

  function getEnteredPin() {
    let pin = '';
    pinInputs.forEach(input => (pin += input.value.trim()));
    return pin;
  }

  async function handleVerifyPin() {
    const pin = getEnteredPin();
    if (pin.length < 4) {
      showError('Vui lòng nhập đủ 4 chữ số mã PIN.');
      return;
    }

    if (errorMsg) errorMsg.style.display = 'none';
    if (btnUnlock) {
      btnUnlock.disabled = true;
      btnUnlock.innerHTML = '<span>Đang xác thực hòm thư... ⏳</span>';
    }

    try {
      const sisterId = currentSister ? currentSister.id : 'lan_anh';
      const res = await fetchPrivateWishes(sisterId, pin);

      if (btnUnlock) {
        btnUnlock.disabled = false;
        btnUnlock.innerHTML = '<span>Mở Hòm Thư Bí Mật ✉️</span>';
      }

      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        showUnlocked(res.data, res.recipient_name || (currentSister ? currentSister.name : 'Bạn'));
      } else if (res.success && res.data.length === 0) {
        showError('Chưa có lời nhắn riêng tư nào dành cho bạn.');
      } else {
        showError(res.message || 'Mã PIN không chính xác. Vui lòng kiểm tra lại tin nhắn Zalo.');
      }
    } catch (err) {
      if (btnUnlock) {
        btnUnlock.disabled = false;
        btnUnlock.innerHTML = '<span>Mở Hòm Thư Bí Mật ✉️</span>';
      }
      showError('Không thể kết nối máy chủ. Vui lòng thử lại sau.');
    }
  }

  function showUnlocked(messages, recipientName) {
    if (pinContainer) pinContainer.style.display = 'none';
    if (unlockedSection) unlockedSection.style.display = 'block';
    if (unlockedHeader) {
      unlockedHeader.textContent = `Có ${messages.length} Lời Nhắn Dành Riêng Cho ${recipientName}:`;
    }

    if (unlockedContainer) {
      unlockedContainer.innerHTML = messages.map(msg => `
        <div style="background: rgba(255, 255, 255, 0.08); border: 1px solid var(--champagne-gold); border-radius: 24px; padding: 24px 28px; position: relative;">
          <div style="font-family: var(--font-serif); font-size: 1.15rem; color: var(--champagne-light); font-weight: 700; margin-bottom: 8px;">
            ✉️ Từ: ${msg.from_name}
          </div>
          <p style="font-size: 1.05rem; line-height: 1.85; color: #FFF; font-style: italic;">
            “${msg.text}”
          </p>
        </div>
      `).join('');
    }
  }

  function lock() {
    if (pinContainer) pinContainer.style.display = 'block';
    if (unlockedSection) unlockedSection.style.display = 'none';
    pinInputs.forEach(i => (i.value = ''));
    if (errorMsg) errorMsg.style.display = 'none';
  }

  function showError(msg) {
    if (errorMsg) {
      errorMsg.textContent = msg;
      errorMsg.style.display = 'block';
    }
  }

  if (btnUnlock) {
    btnUnlock.addEventListener('click', handleVerifyPin);
  }

  return { setSister, showScreen: () => { if (screen) screen.style.display = 'block'; } };
}
