import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchPeople, fetchPublicWishes } from '../api.js';
import confetti from 'canvas-confetti';

const AppContext = createContext();

export function AppProvider({ children, navigate }) {
  const [people, setPeople] = useState([]);
  const [wishes, setWishes] = useState([]);
  const [selectedSister, setSelectedSister] = useState(null);
  const [openedBalloons, setOpenedBalloons] = useState(new Set());
  const [activeModalWish, setActiveModalWish] = useState(null);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Audio state
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);

  // Nạp dữ liệu ban đầu
  useEffect(() => {
    async function loadData() {
      const [peopleData, wishesData] = await Promise.all([
        fetchPeople(),
        fetchPublicWishes()
      ]);
      setPeople(peopleData);
      setWishes(wishesData);

      // Kiểm tra URL param (?to= hoặc ?id=)
      const params = new URLSearchParams(window.location.search);
      const toParam = (params.get('to') || params.get('id') || '').toLowerCase().trim();
      if (toParam) {
        const found = peopleData.find(
          p => p.id === toParam || p.name.toLowerCase().includes(toParam)
        );
        if (found) {
          setSelectedSister(found);
        }
      }
    }
    loadData();
  }, []);

  // Hàm chuyển trang kèm hiệu ứng Bão Cánh Hoa Điện Ảnh (Cinematic Floral Wipe)
  const navigateWithFlowerTransition = (targetPath) => {
    setIsTransitioning(true);

    // Kích hoạt pháo hoa cánh hoa tung bay toàn màn hình
    confetti({
      particleCount: 70,
      spread: 120,
      origin: { y: 0.5 },
      colors: ['#F43F5E', '#FDA4AF', '#FCD34D', '#FFF1F2', '#FECDD3']
    });

    setTimeout(() => {
      if (navigate) {
        navigate(targetPath);
      } else {
        window.location.hash = targetPath;
      }
    }, 450);

    setTimeout(() => {
      setIsTransitioning(false);
    }, 1100);
  };

  // Nổ bóng
  const popBalloon = (wish, coords) => {
    setOpenedBalloons(prev => new Set([...prev, wish.id]));
    setActiveModalWish(wish);

    // Bắn hạt cánh hoa tại tọa độ bóng
    const origin = coords || { x: 0.5, y: 0.5 };
    confetti({
      particleCount: 35,
      spread: 80,
      origin,
      colors: [wish.color || '#F43F5E', '#FDA4AF', '#FCD34D', '#FFFFFF', '#FECDD3']
    });
  };

  return (
    <AppContext.Provider value={{
      people,
      wishes,
      selectedSister,
      setSelectedSister,
      openedBalloons,
      popBalloon,
      activeModalWish,
      setActiveModalWish,
      isArchiveOpen,
      setIsArchiveOpen,
      isTransitioning,
      navigateWithFlowerTransition,
      isPlayingMusic,
      setIsPlayingMusic
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
