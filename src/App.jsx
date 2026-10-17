import React, { Suspense, lazy } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext.jsx';

import AmbientPetals from './components/AmbientPetals.jsx';
import FloralTransition from './components/FloralTransition.jsx';
import TopNav from './components/TopNav.jsx';
import WishModal from './components/WishModal.jsx';
import ArchiveDrawer from './components/ArchiveDrawer.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import PageLoader from './components/PageLoader.jsx';

// Direct import for instantaneous initial landing render
import GiftPage from './pages/GiftPage.jsx';

// Enterprise Code-Splitting: Lazy-load route pages to keep initial bundle tiny
const World3DExperience = lazy(() => import('./pages/World3DExperience.jsx'));
const LetterPage = lazy(() => import('./pages/LetterPage.jsx'));
const BalloonsPage = lazy(() => import('./pages/BalloonsPage.jsx'));
const PrivateHeartPage = lazy(() => import('./pages/PrivateHeartPage.jsx'));
const VideoPage = lazy(() => import('./pages/VideoPage.jsx'));
const PartyPage = lazy(() => import('./pages/PartyPage.jsx'));
const SenderStudioPage = lazy(() => import('./pages/SenderStudioPage.jsx'));

function MainAppContent() {
  const { experienceMode } = useApp();
  const location = useLocation();

  // Khi người dùng vào trang chủ (/), dọn dẹp cờ cũ để không bị kẹt ở chế độ 3D
  React.useEffect(() => {
    if (location.pathname === '/' && experienceMode === '3d') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('mode') !== '3d') {
        try {
          localStorage.removeItem('tribute_mode');
        } catch (e) {}
      }
    }
  }, [location.pathname, experienceMode]);

  // Trang soạn thảo của anh em luôn mở trực tiếp
  if (location.pathname === '/sender') {
    return (
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/sender" element={<SenderStudioPage />} />
        </Routes>
      </Suspense>
    );
  }

  // Kịch bản 1: THẾ GIỚI 3D LIỀN MẠCH (Chỉ render khi người dùng đang ở route /3d)
  if (location.pathname === '/3d') {
    return (
      <Suspense fallback={<PageLoader />}>
        <World3DExperience />
      </Suspense>
    );
  }

  // Kịch bản 2: TẠP CHÍ 2D CỔ TÍCH (Cinematic Editorial 2D Pages)
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<GiftPage />} />
        <Route path="/3d" element={<World3DExperience />} />
        <Route path="/letter" element={<LetterPage />} />
        <Route path="/balloons" element={<BalloonsPage />} />
        <Route path="/private" element={<PrivateHeartPage />} />
        <Route path="/video" element={<VideoPage />} />
        <Route path="/slideshow" element={<VideoPage />} />
        <Route path="/party" element={<PartyPage />} />
        <Route path="/sender" element={<SenderStudioPage />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  const navigate = useNavigate();

  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
}
