import React, { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext.jsx';

export default function AudioController() {
  const { isPlayingMusic, setIsPlayingMusic } = useApp();
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = 0;

    const handleFirstTouch = () => {
      audio.play().then(() => {
        setIsPlayingMusic(true);
        fadeVolume(0.45);
      }).catch(() => {});
      window.removeEventListener('click', handleFirstTouch);
      window.removeEventListener('touchstart', handleFirstTouch);
    };

    window.addEventListener('click', handleFirstTouch, { once: true });
    window.addEventListener('touchstart', handleFirstTouch, { once: true });

    return () => {
      window.removeEventListener('click', handleFirstTouch);
      window.removeEventListener('touchstart', handleFirstTouch);
    };
  }, []);

  function fadeVolume(targetVol) {
    const audio = audioRef.current;
    if (!audio) return;
    const start = audio.volume;
    let step = 0;
    const interval = setInterval(() => {
      step += 0.05;
      audio.volume = Math.min(1, start + (targetVol - start) * step);
      if (step >= 1) clearInterval(interval);
    }, 40);
  }

  const toggleAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlayingMusic) {
      audio.pause();
      setIsPlayingMusic(false);
    } else {
      audio.play().then(() => {
        setIsPlayingMusic(true);
        fadeVolume(0.45);
      }).catch(() => {});
    }
  };

  return (
    <>
      <audio
        ref={audioRef}
        loop
        preload="auto"
        src="https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=piano-moment-9835.mp3"
      />
      <button
        onClick={toggleAudio}
        className={`pill-btn ${isPlayingMusic ? 'active' : ''}`}
        title={isPlayingMusic ? 'Tắt nhạc' : 'Bật nhạc'}
      >
        <div className={`sound-bars ${isPlayingMusic ? '' : 'paused'}`}>
          <span></span><span></span><span></span>
        </div>
        <span>{isPlayingMusic ? 'Đang phát' : 'Bật nhạc'}</span>
      </button>
    </>
  );
}
