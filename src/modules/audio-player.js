/**
 * Audio Controller với Auto-Unlock lần chạm đầu và Smooth Volume Fade-in
 */
export function initAudioPlayer() {
  const audio = document.getElementById('bgMusicAudio');
  const toggleBtn = document.getElementById('btnMusicToggle');
  const soundBars = document.getElementById('soundBars');
  const musicText = document.getElementById('musicText');

  if (!audio || !toggleBtn) return { play: () => {}, pause: () => {}, isPlaying: () => false };

  audio.volume = 0; // Khởi đầu 0 để fade-in êm ái
  let isPlaying = false;
  let userUnlocked = false;

  function fadeVolume(targetVolume, durationMs = 1200) {
    const startVolume = audio.volume;
    const startTime = performance.now();

    function step(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      audio.volume = startVolume + (targetVolume - startVolume) * progress;

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }
    requestAnimationFrame(step);
  }

  function playAudio() {
    audio.play().then(() => {
      isPlaying = true;
      fadeVolume(0.5);
      if (soundBars) soundBars.classList.remove('paused');
      if (musicText) musicText.textContent = 'Đang phát';
      toggleBtn.classList.add('active');
    }).catch(err => {
      console.warn('[Audio] Autoplay bị chặn bởi trình duyệt trước tương tác:', err.message);
    });
  }

  function pauseAudio() {
    fadeVolume(0, 400);
    setTimeout(() => {
      audio.pause();
      isPlaying = false;
      if (soundBars) soundBars.classList.add('paused');
      if (musicText) musicText.textContent = 'Bật nhạc';
      toggleBtn.classList.remove('active');
    }, 400);
  }

  function toggleAudio() {
    if (isPlaying) {
      pauseAudio();
    } else {
      playAudio();
    }
  }

  toggleBtn.addEventListener('click', toggleAudio);

  // Mở khóa âm thanh lần chạm đầu (Safari iOS & Chrome)
  function handleFirstUnlock() {
    if (!userUnlocked) {
      userUnlocked = true;
      playAudio();
      window.removeEventListener('click', handleFirstUnlock);
      window.removeEventListener('touchstart', handleFirstUnlock);
    }
  }

  window.addEventListener('click', handleFirstUnlock, { once: true });
  window.addEventListener('touchstart', handleFirstUnlock, { once: true });

  return {
    play: playAudio,
    pause: pauseAudio,
    isPlaying: () => isPlaying
  };
}
