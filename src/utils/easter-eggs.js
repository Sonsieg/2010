import confetti from 'canvas-confetti';

export function initEasterEggs(showToastCallback) {
  // 1. Console DevTools Art
  console.log(
    `%c
   🌸 20/10 • CHÚC MỪNG TOÀN THỂ CHỊ EM CÔNG NGHỆ 🌸
   -------------------------------------------------
   Bạn đang soi DevTools đúng không? 😄
   Hệ thống được viết bởi toàn thể anh em Dev, Tech & Product
   với 100% sự kính trọng, yêu mến và không có bug!
   
   Tip: Thử nhập mã Konami: ↑ ↑ ↓ ↓ ← → ← → B A để xem pháo hoa!
    `,
    'color: #C9A66B; font-size: 13px; font-weight: bold; background: #1E0F18; padding: 12px; border-radius: 8px;'
  );

  // 2. Tab Title Blur / Focus
  const originalTitle = document.title;
  window.addEventListener('blur', () => {
    document.title = 'Quay lại đi mà chị em ơi 🥺❤️';
  });
  window.addEventListener('focus', () => {
    document.title = originalTitle;
  });

  // 3. Konami Code (↑ ↑ ↓ ↓ ← → ← → B A)
  const konamiPattern = [
    'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
    'b', 'a'
  ];
  let konamiIndex = 0;

  window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    const expected = konamiPattern[konamiIndex].toLowerCase();

    if (key === expected) {
      konamiIndex++;
      if (konamiIndex === konamiPattern.length) {
        triggerGrandFireworks(showToastCallback);
        konamiIndex = 0;
      }
    } else {
      konamiIndex = 0;
    }
  });
}

function triggerGrandFireworks(showToast) {
  if (showToast) {
    showToast('✨ Bạn đã mở khóa Easter Egg: Đại tiệc pháo hoa rực rỡ dành tặng chị em! 🎆');
  }

  const duration = 5 * 1000;
  const end = Date.now() + duration;

  const interval = setInterval(() => {
    if (Date.now() > end) {
      return clearInterval(interval);
    }

    confetti({
      startVelocity: 35,
      spread: 360,
      ticks: 70,
      origin: { x: Math.random(), y: Math.random() - 0.2 },
      colors: ['#8C2F4B', '#C9A66B', '#E5CDA2', '#FFFFFF', '#FA7298']
    });
  }, 250);
}
