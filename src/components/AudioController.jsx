import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { playSoftTapSound } from '../utils/soundEffects.js';

export const PLAYLIST = [
  {
    id: 'rmpiano1',
    title: 'Piano 01',
    subtitle: 'Piano sâu lắng ngọt ngào',
    src: '/RMPIANO1.mp3',
    icon: '🎹'
  },
  {
    id: 'rmpiano2',
    title: 'Piano 02',
    subtitle: 'Piano lãng mạn bay bổng',
    src: '/RMPIANO2.mp3',
    icon: '🎼'
  },
  {
    id: 'rmpiano3',
    title: 'Piano 03',
    subtitle: 'Piano trữ tình êm dịu',
    src: '/RMPIANO3.mp3',
    icon: '✨'
  },
  {
    id: 'video1',
    title: 'Sandwich & Story',
    subtitle: 'Mono',
    src: '/VIDEO1.mp3',
    icon: '🎬'
  },
  {
    id: 'video2',
    title: 'Until I Found You',
    subtitle: 'Stephen Sanchez',
    src: '/VIDEO2.mp3',
    icon: '💖'
  },
  {
    id: 'piano_moment',
    title: 'Piano Moment (Dự phòng)',
    subtitle: 'Bản piano acoustic Pixabay',
    src: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=piano-moment-9835.mp3',
    icon: '🕊️'
  }
];

export default function AudioController() {
  const { isPlayingMusic, setIsPlayingMusic } = useApp();
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);
  const audioRef = useRef(null);
  const dropdownRef = useRef(null);

  const currentTrack = PLAYLIST[currentTrackIndex];

  // Khởi tạo và mở khóa âm thanh trên tương tác đầu tiên của người dùng
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = 0;

    const handleFirstTouch = () => {
      audio.play().then(() => {
        setIsPlayingMusic(true);
        fadeVolume(0.48);
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

  // Đổi bài: load và phát bài mới nếu đang ở trạng thái phát
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlayingMusic) {
      audio.load();
      audio.play().then(() => {
        fadeVolume(0.48);
      }).catch(() => {});
    }
  }, [currentTrackIndex]);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsPlaylistOpen(false);
      }
    };
    if (isPlaylistOpen) {
      document.addEventListener('pointerdown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
    };
  }, [isPlaylistOpen]);

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

  const toggleAudio = (e) => {
    if (e) e.stopPropagation();
    playSoftTapSound();
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlayingMusic) {
      audio.pause();
      setIsPlayingMusic(false);
    } else {
      audio.play().then(() => {
        setIsPlayingMusic(true);
        fadeVolume(0.48);
      }).catch(() => {});
    }
  };

  const togglePlaylist = (e) => {
    if (e) e.stopPropagation();
    playSoftTapSound();
    setIsPlaylistOpen((prev) => !prev);
  };

  const selectTrack = (index) => {
    playSoftTapSound();
    setCurrentTrackIndex(index);
    if (!isPlayingMusic) {
      setIsPlayingMusic(true);
    }
    setIsPlaylistOpen(false);
  };

  // Tự động chuyển sang bài tiếp theo khi bài hiện tại kết thúc
  const handleTrackEnded = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % PLAYLIST.length);
  };

  const handleAudioError = () => {
    // Nếu xảy ra lỗi với bài hiện tại, tự động chuyển sang bài kế tiếp
    setCurrentTrackIndex((prev) => (prev + 1) % PLAYLIST.length);
  };

  return (
    <div className="audio-controller-wrapper" ref={dropdownRef}>
      <audio
        ref={audioRef}
        preload="auto"
        src={currentTrack.src}
        onEnded={handleTrackEnded}
        onError={handleAudioError}
      />

      {/* Nút 1: Bật / Tắt Phát Nhạc */}
      <button
        onClick={toggleAudio}
        className={`pill-btn ${isPlayingMusic ? 'active' : ''}`}
        title={`Click để ${isPlayingMusic ? 'tạm dừng' : 'phát'}: ${currentTrack.title}`}
      >
        <div className={`sound-bars ${isPlayingMusic ? '' : 'paused'}`}>
          <span></span><span></span><span></span>
        </div>
        <span className="audio-track-label">{isPlayingMusic ? currentTrack.title : 'Bật nhạc'}</span>
      </button>

      {/* Nút 2: Mở Menu Chọn Bài Hát */}
      <button
        onClick={togglePlaylist}
        className={`pill-btn playlist-toggle-btn ${isPlaylistOpen ? 'active' : ''}`}
        title="Danh sách chọn bài hát 20/10"
        aria-expanded={isPlaylistOpen}
      >
        <span className="playlist-icon">🎶</span>
        <span className="playlist-chevron">{isPlaylistOpen ? '▲' : '▼'}</span>
      </button>

      {/* Menu Dropdown Chọn Nhạc (Frosted Glass & Champagne) */}
      {isPlaylistOpen && (
        <div className="music-playlist-dropdown">
          <div className="playlist-header">
            <div className="playlist-header-title">
              <span>🎵 Danh Sách Nhạc 20/10</span>
              <span className="playlist-auto-badge">Auto Next 🔁</span>
            </div>
            <p className="playlist-header-sub">Hết bài sẽ tự động phát tiếp bài sau</p>
          </div>

          <div className="playlist-track-list">
            {PLAYLIST.map((track, idx) => {
              const isActive = idx === currentTrackIndex;
              return (
                <button
                  key={track.id}
                  onClick={() => selectTrack(idx)}
                  className={`playlist-track-item ${isActive ? 'active' : ''}`}
                >
                  <div className="track-left">
                    <span className="track-icon">{track.icon}</span>
                    <div className="track-info">
                      <span className="track-name">{track.title}</span>
                      <span className="track-sub">{track.subtitle}</span>
                    </div>
                  </div>

                  <div className="track-right">
                    {isActive ? (
                      <span className="track-active-badge">
                        {isPlayingMusic ? '▶ Đang phát' : '⏸ Đã chọn'}
                      </span>
                    ) : (
                      <span className="track-play-hover-hint">Chọn ➔</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="playlist-footer">
            <span>💡 Nhấn vào bài hát bất kỳ để chuyển ngay lập tức</span>
          </div>
        </div>
      )}
    </div>
  );
}
