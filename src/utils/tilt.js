/**
 * 3D Tilt Card Effect for Desktop (Mouse) and Mobile (Touch / Orientation)
 */
export function initCardTilt(containerEl, innerCardEl) {
  if (!containerEl || !innerCardEl) return;

  function handleMove(clientX, clientY) {
    const rect = innerCardEl.getBoundingClientRect();
    const x = clientX - rect.left - rect.width / 2;
    const y = clientY - rect.top - rect.height / 2;

    const rotateX = (-y / 18).toFixed(2);
    const rotateY = (x / 18).toFixed(2);

    innerCardEl.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
  }

  function handleReset() {
    innerCardEl.style.transform = 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
  }

  // Mouse events
  containerEl.addEventListener('mousemove', (e) => {
    handleMove(e.clientX, e.clientY);
  });

  containerEl.addEventListener('mouseleave', handleReset);

  // Touch events for mobile
  containerEl.addEventListener('touchmove', (e) => {
    if (e.touches && e.touches[0]) {
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: true });

  containerEl.addEventListener('touchend', handleReset);
}
