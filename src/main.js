/**
 * Main Application Orchestrator (20/10 Sweet Rose Edition)
 */
import { fetchPeople, fetchPublicWishes } from './api.js';
import { initAudioPlayer } from './modules/audio-player.js';
import { initBalloonEngine } from './modules/balloon-engine.js';
import { initPrivateMessages } from './modules/private-messages.js';
import { initCardExport } from './modules/card-export.js';
import { initSenderStudio } from './modules/sender-studio.js';
import { initAmbientPetals } from './utils/petals.js';
import { initCardTilt } from './utils/tilt.js';
import { initEasterEggs } from './utils/easter-eggs.js';
import confetti from 'canvas-confetti';

// Toast Notification Helper
function showToast(message, durationMs = 3500) {
  const toastEl = document.getElementById('sweetToastNotice');
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.classList.add('show');
  setTimeout(() => {
    toastEl.classList.remove('show');
  }, durationMs);
}

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Tải dữ liệu ban đầu
  const [people, wishes] = await Promise.all([
    fetchPeople(),
    fetchPublicWishes()
  ]);

  // 2. Kiểm tra chế độ Anh Em (?mode=sender)
  const studio = initSenderStudio(people, showToast);
  if (studio.isSenderMode) {
    // Nếu là chế độ Anh Em, chỉ chạy studio rồi dừng
    return;
  }

  // 3. Khởi tạo hiệu ứng nền, nhạc & Easter eggs
  initAmbientPetals('petals-canvas');
  initEasterEggs(showToast);
  const audio = initAudioPlayer();
  const privateModule = initPrivateMessages();
  initCardExport(showToast);

  // 4. Màn 0: Hộp quà bí mật & Nhận diện thông minh
  let selectedSister = null;
  const giftBoxTrigger = document.getElementById('giftBoxTrigger');
  const btnOpenGift = document.getElementById('btnOpenGiftDirectly');
  const giftBadgeText = document.getElementById('giftBadgeText');
  const smartPickerCard = document.getElementById('smartNamePickerCard');
  const nameSearchInput = document.getElementById('nameSearchInput');
  const nameDropdownList = document.getElementById('nameDropdownList');

  // Màn 1 Elements
  const letterTitle = document.getElementById('letterPersonalizedTitle');
  const sisterAvatar = document.getElementById('sisterCardAvatar');
  const customExportNameInput = document.getElementById('customExportCardNameInput');
  const exportRecipientPrintName = document.getElementById('exportRecipientPrintName');

  function renderNameDropdown(filterText = '') {
    if (!nameDropdownList) return;
    const q = filterText.toLowerCase().trim();
    const filtered = people.filter(p => p.name.toLowerCase().includes(q) || (p.dept && p.dept.toLowerCase().includes(q)));
    
    nameDropdownList.innerHTML = filtered.map(p => `
      <div class="name-option-item ${selectedSister && selectedSister.id === p.id ? 'selected' : ''}" data-id="${p.id}">
        <span><strong>${p.name}</strong> <small style="color: #94A3B8;">(${p.dept || p.role})</small></span>
        <span>🌸</span>
      </div>
    `).join('');

    nameDropdownList.querySelectorAll('.name-option-item').forEach(item => {
      item.addEventListener('click', () => {
        const pId = item.getAttribute('data-id');
        const matched = people.find(p => p.id === pId);
        if (matched) applySisterSelection(matched, true);
      });
    });
  }

  function applySisterSelection(sister, autoOpenBox = false) {
    selectedSister = sister;
    sessionStorage.setItem('selected_sister_id', sister.id);

    // Cập nhật Màn 0
    if (giftBadgeText) giftBadgeText.textContent = `Gửi riêng tặng: Chị ${sister.name} 🌸`;
    if (smartPickerCard) smartPickerCard.style.display = 'none';

    // Cập nhật Màn 1 (Thiệp)
    if (letterTitle) letterTitle.textContent = `Thân Gửi Chị ${sister.name} Quý Mến,`;
    if (sisterAvatar) {
      if (sister.has_consent && sister.photo) {
        sisterAvatar.innerHTML = `<img src="${sister.photo}" alt="${sister.name}">`;
      } else {
        const initials = sister.name.split(' ').slice(-2).map(n => n[0]).join('');
        sisterAvatar.textContent = initials || '🌸';
      }
    }

    // Cập nhật Màn 5 (Xuất thiệp)
    if (customExportNameInput) customExportNameInput.value = sister.name;
    if (exportRecipientPrintName) exportRecipientPrintName.textContent = sister.name;

    // Kích hoạt hòm thư riêng Màn 3
    privateModule.setSister(sister);

    if (autoOpenBox) {
      triggerOpenGiftBox();
    }
  }

  // Kiểm tra URL param (?to= hoặc ?id=)
  const urlParams = new URLSearchParams(window.location.search);
  const toParam = (urlParams.get('to') || urlParams.get('id') || '').toLowerCase().trim();
  if (toParam) {
    const matched = people.find(p => p.id === toParam || p.name.toLowerCase().includes(toParam));
    if (matched) {
      applySisterSelection(matched, false);
    }
  } else {
    // Đổ danh sách vào picker
    renderNameDropdown();
    if (nameSearchInput) {
      nameSearchInput.addEventListener('input', (e) => {
        renderNameDropdown(e.target.value);
      });
    }
  }

  // Tương tác Mở Hộp Quà
  let isGiftOpened = false;
  function triggerOpenGiftBox() {
    if (isGiftOpened) return;
    isGiftOpened = true;

    // Hiệu ứng nắp bay lên
    if (giftBoxTrigger) {
      giftBoxTrigger.classList.remove('gift-wobble');
      giftBoxTrigger.classList.add('gift-opened');
    }

    // Nổ confetti hoa hồng và ánh vàng rực rỡ
    confetti({
      particleCount: 85,
      spread: 90,
      origin: { y: 0.6 },
      colors: ['#F43F5E', '#FDA4AF', '#FCD34D', '#FFF1F2', '#FECDD3']
    });

    // Mở khóa âm thanh
    audio.play();

    // Cuộn mượt vào Màn 1 sau 600ms
    setTimeout(() => {
      const letterCard = document.getElementById('screen-letter-card');
      if (letterCard) {
        letterCard.scrollIntoView({ behavior: 'smooth' });
      }
    }, 600);
  }

  if (giftBoxTrigger) giftBoxTrigger.addEventListener('click', triggerOpenGiftBox);
  if (btnOpenGift) btnOpenGift.addEventListener('click', triggerOpenGiftBox);

  // 5. Màn 2: Bầu Trời Bóng Bay Vật Lý
  let currentModalWishIndex = 0;
  const wishModal = document.getElementById('wishModalOverlay');
  const tiltCardInner = document.getElementById('tiltCardContent');
  const modalAvatar = document.getElementById('modalSenderAvatarBox');
  const modalName = document.getElementById('modalSenderFullName');
  const modalDept = document.getElementById('modalSenderDepartment');
  const modalText = document.getElementById('modalWishMessageText');
  const btnCloseWish = document.getElementById('btnCloseWishModal');
  const btnNextWish = document.getElementById('btnNextWishPopup');

  // Gắn hiệu ứng 3D Tilt
  initCardTilt(wishModal, tiltCardInner);

  function openWishPopup(wish) {
    currentModalWishIndex = wishes.findIndex(w => w.id === wish.id);
    if (modalAvatar) {
      modalAvatar.textContent = wish.name.charAt(0);
      modalAvatar.style.backgroundColor = wish.color || 'var(--rose-500)';
    }
    if (modalName) modalName.textContent = wish.name;
    if (modalDept) modalDept.textContent = wish.dept || 'Tech & Product';
    if (modalText) modalText.textContent = `“${wish.text}”`;

    wishModal.classList.add('open');
  }

  function closeWishPopup() {
    wishModal.classList.remove('open');
  }

  if (btnCloseWish) btnCloseWish.addEventListener('click', closeWishPopup);
  if (wishModal) {
    wishModal.addEventListener('click', (e) => {
      if (e.target === wishModal) closeWishPopup();
    });
  }

  if (btnNextWish) {
    btnNextWish.addEventListener('click', () => {
      currentModalWishIndex = (currentModalWishIndex + 1) % wishes.length;
      openWishPopup(wishes[currentModalWishIndex]);
    });
  }

  // Khởi động Bầu trời bóng bay
  const balloonEngine = initBalloonEngine(wishes, (wish) => {
    openWishPopup(wish);
  }, (openedCount, totalCount) => {
    // Cập nhật drawer archive mỗi khi có bóng mới nổ
    renderArchiveList();
  });

  // 6. Archive Drawer: Xem lại các lời chúc
  const btnOpenArchive = document.getElementById('btnOpenArchiveDrawer');
  const btnOpenArchiveFromSky = document.getElementById('btnOpenListFromSky');
  const btnCloseArchive = document.getElementById('btnCloseArchiveDrawer');
  const archiveDrawer = document.getElementById('archiveDrawerSheet');
  const archiveBackdrop = document.getElementById('archiveDrawerBackdrop');
  const archiveContainer = document.getElementById('archiveWishesListContainer');
  const archiveSearchInput = document.getElementById('archiveSearchInput');

  function openArchive() {
    renderArchiveList();
    archiveDrawer.classList.add('open');
    archiveBackdrop.classList.add('open');
  }

  function closeArchive() {
    archiveDrawer.classList.remove('open');
    archiveBackdrop.classList.remove('open');
  }

  function renderArchiveList(filterText = '') {
    if (!archiveContainer) return;
    const q = filterText.toLowerCase().trim();
    // Chị em có thể xem toàn bộ hoặc các lời chúc đã mở
    const listToRender = wishes.filter(w =>
      w.name.toLowerCase().includes(q) ||
      (w.dept && w.dept.toLowerCase().includes(q)) ||
      w.text.toLowerCase().includes(q)
    );

    archiveContainer.innerHTML = listToRender.map(w => `
      <div style="background: var(--rose-50); border: 1px solid var(--rose-200); border-radius: 18px; padding: 16px; display: flex; gap: 12px; align-items: flex-start;">
        <div style="width: 42px; height: 42px; border-radius: 14px; background: ${w.color || '#F43F5E'}; color: #fff; font-family: var(--font-serif); font-size: 1.2rem; font-weight: bold; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
          ${w.name.charAt(0)}
        </div>
        <div style="flex: 1;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <strong style="color: #1E293B; font-size: 0.95rem;">${w.name}</strong>
            <span style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--rose-600); background: #FFF; padding: 2px 8px; border-radius: 9999px; border: 1px solid var(--rose-200);">${w.dept || 'Tech'}</span>
          </div>
          <p style="font-size: 0.88rem; line-height: 1.6; color: #475569; font-style: italic;">“${w.text}”</p>
        </div>
      </div>
    `).join('');
  }

  if (btnOpenArchive) btnOpenArchive.addEventListener('click', openArchive);
  if (btnOpenArchiveFromSky) btnOpenArchiveFromSky.addEventListener('click', openArchive);
  if (btnCloseArchive) btnCloseArchive.addEventListener('click', closeArchive);
  if (archiveBackdrop) archiveBackdrop.addEventListener('click', closeArchive);

  if (archiveSearchInput) {
    archiveSearchInput.addEventListener('input', (e) => {
      renderArchiveList(e.target.value);
    });
  }

  // 7. Màn 4: Slideshow Tri Ân
  const quotesList = [
    { text: "“Cảm ơn vì đã luôn làm cho công ty này rực rỡ, vui vẻ và có nhiều điều đáng nhớ hơn mỗi ngày!”", author: "Toàn thể anh em Tech & Product" },
    { text: "“Mọi sprint release căng thẳng đều trở nên êm đềm hơn nhờ nụ cười và sự thấu cảm của các chị em!”", author: "Engineering & QA Family" },
    { text: "“Chúc các đóa hoa IT luôn tự tin, kiên cường, hạnh phúc và luôn là chính mình!”", author: "From Brothers with Love" }
  ];
  let quoteIndex = 0;
  let quoteTimer = null;
  const quoteHeading = document.getElementById('slideQuoteHeading');
  const quoteAuthor = document.getElementById('slideAuthorName');
  const btnPrevQuote = document.getElementById('btnPrevSlideQuote');
  const btnNextQuote = document.getElementById('btnNextSlideQuote');
  const btnAutoQuote = document.getElementById('btnToggleSlideAuto');

  function renderQuote(idx) {
    quoteIndex = (idx + quotesList.length) % quotesList.length;
    if (quoteHeading && quoteAuthor) {
      quoteHeading.style.opacity = '0';
      setTimeout(() => {
        quoteHeading.textContent = quotesList[quoteIndex].text;
        quoteAuthor.textContent = `— ${quotesList[quoteIndex].author}`;
        quoteHeading.style.opacity = '1';
      }, 200);
    }
  }

  if (btnNextQuote) btnNextQuote.addEventListener('click', () => renderQuote(quoteIndex + 1));
  if (btnPrevQuote) btnPrevQuote.addEventListener('click', () => renderQuote(quoteIndex - 1));

  if (btnAutoQuote) {
    btnAutoQuote.addEventListener('click', () => {
      if (quoteTimer) {
        clearInterval(quoteTimer);
        quoteTimer = null;
        btnAutoQuote.textContent = 'Tự động chạy';
      } else {
        quoteTimer = setInterval(() => renderQuote(quoteIndex + 1), 3500);
        btnAutoQuote.textContent = 'Tạm dừng ⏸';
      }
    });
  }
});
