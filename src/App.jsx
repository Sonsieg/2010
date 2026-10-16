import React from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext.jsx';

import AmbientPetals from './components/AmbientPetals.jsx';
import FloralTransition from './components/FloralTransition.jsx';
import TopNav from './components/TopNav.jsx';
import WishModal from './components/WishModal.jsx';
import ArchiveDrawer from './components/ArchiveDrawer.jsx';

import GiftPage from './pages/GiftPage.jsx';
import LetterPage from './pages/LetterPage.jsx';
import BalloonsPage from './pages/BalloonsPage.jsx';
import PrivateHeartPage from './pages/PrivateHeartPage.jsx';
import VideoPage from './pages/VideoPage.jsx';
import PartyPage from './pages/PartyPage.jsx';
import SenderStudioPage from './pages/SenderStudioPage.jsx';
import World3DExperience from './pages/World3DExperience.jsx';

function MainAppContent() {
  const { experienceMode } = useApp();
  const location = useLocation();

  // Trang soạn thảo của anh em luôn mở trực tiếp
  if (location.pathname === '/sender') {
    return (
      <Routes>
        <Route path="/sender" element={<SenderStudioPage />} />
      </Routes>
    );
  }

  // Kịch bản 1: THẾ GIỚI 3D LIỀN MẠCH (Unified 3D World Journey)
  if (experienceMode === '3d') {
    return <World3DExperience />;
  }

  // Kịch bản 2: TẠP CHÍ 2D CỔ TÍCH (Cinematic Editorial 2D Pages)
  return (
    <Routes>
      <Route path="/" element={<GiftPage />} />
      <Route path="/letter" element={<LetterPage />} />
      <Route path="/balloons" element={<BalloonsPage />} />
      <Route path="/private" element={<PrivateHeartPage />} />
      <Route path="/video" element={<VideoPage />} />
      <Route path="/party" element={<PartyPage />} />
      <Route path="/sender" element={<SenderStudioPage />} />
    </Routes>
  );
}

export default function App() {
  const navigate = useNavigate();

  return (
    <AppProvider navigate={navigate}>
      <div className="app-container">
        {/* Continuous ambient falling petals */}
        <AmbientPetals />

        {/* Top floating control bar */}
        <TopNav />

        {/* Cinematic floral curtain transition */}
        <FloralTransition />

        {/* Main Application: 3D Unified World vs 2D Editorial Pages */}
        <MainAppContent />

        {/* Global modals & drawer */}
        <WishModal />
        <ArchiveDrawer />
      </div>
    </AppProvider>
  );
}
