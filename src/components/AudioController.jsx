import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext.jsx';
import { playSoftTapSound } from '../utils/soundEffects.js';

export const PLAYLIST = [
  {
    id: 'video2',
    title: 'Until I Found You',
    subtitle: 'Stephen Sanchez',
    src: '/VIDEO2.mp3',
    icon: '💖'
  }
];

export default function AudioController() {
  const {
    isPlayingMusic,
    setIsPlayingMusic,
    setHasConfirmedAudioChoice
  } = useApp();
  // Nhạc mở đầu mặc định của trải nghiệm: Until I Found You.
  const [currentTrackIndex, setCurrentTrackIndex] = useState(() => (
    Math.max(0, PLAYLIST.findIndex((track) => track.id === 'video2'))
  ));
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);
  const [isMusicPromptOpen, setIsMusicPromptOpen] = useState(true);
  const audioRef = useRef(null);
  const dropdownRef = useRef(null);
  const enableMusicButtonRef = useRef(null);

  const currentTrack = PLAYLIST[currentTrackIndex];

  // Chuẩn bị âm thanh. Việc phát nhạc chỉ diễn ra sau lựa chọn rõ ràng của người dùng
  // để tương thích với chính sách autoplay của Safari, Chrome và trình duyệt di động.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = 0;
  }, []);

  // Đưa focus vào lựa chọn chính và cho phép đóng hộp hỏi bằng phím Escape.
  useEffect(() => {
    if (!isMusicPromptOpen) return undefined;

    const focusTimer = window.setTimeout(() => enableMusicButtonRef.current?.focus(), 80);
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsMusicPromptOpen(false);
        setHasConfirmedAudioChoice(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMusicPromptOpen]);

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

  const enableMusicFromPrompt = () => {
    const audio = audioRef.current;
    if (!audio) {
      setIsMusicPromptOpen(false);
      setHasConfirmedAudioChoice(true);
      return;
    }

    audio.play().then(() => {
      setIsPlayingMusic(true);
      setIsMusicPromptOpen(false);
      setHasConfirmedAudioChoice(true);
      fadeVolume(0.48);
    }).catch(() => {
      // Vẫn đóng hộp hỏi nếu thiết bị từ chối; nút nhạc luôn còn ở góc màn hình.
      setIsMusicPromptOpen(false);
      setIsPlayingMusic(false);
      setHasConfirmedAudioChoice(true);
    });
  };

  const continueWithoutMusic = () => {
    setIsMusicPromptOpen(false);
    setHasConfirmedAudioChoice(true);
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
        preload="metadata"
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
              <span>🎵 Nhạc nền</span>
              <span className="playlist-auto-badge">Phát lặp 🔁</span>
            </div>
            <p className="playlist-header-sub">Until I Found You — Stephen Sanchez</p>
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
            <span>💡 Nhạc nền cố định cho trải nghiệm 20/10</span>
          </div>
        </div>
      )}

      {isMusicPromptOpen && createPortal(
        <div className="music-consent-backdrop" role="presentation">
          <section
            className="music-consent-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="music-consent-title"
            aria-describedby="music-consent-description"
          >
            <span className="music-consent-note" aria-hidden="true">♪</span>
            <p className="music-consent-eyebrow">Một chút giai điệu</p>
            <h2 id="music-consent-title">Bạn có muốn bật nhạc không?</h2>
            <p id="music-consent-description">
              Bản nhạc nền sẽ giúp món quà 20/10 trọn vẹn và nhiều cảm xúc hơn.
            </p>
            <div className="music-consent-actions">
              <button
                ref={enableMusicButtonRef}
                type="button"
                className="music-consent-primary"
                onClick={enableMusicFromPrompt}
              >
                <span aria-hidden="true">♫</span>
                Bật nhạc &amp; bắt đầu
              </button>
              <button
                type="button"
                className="music-consent-secondary"
                onClick={continueWithoutMusic}
              >
                Để sau
              </button>
            </div>
            <p className="music-consent-hint">Bạn vẫn có thể bật hoặc tắt nhạc ở góc trên màn hình.</p>
          </section>
        </div>,
        document.body
      )}
    </div>
  );
}
