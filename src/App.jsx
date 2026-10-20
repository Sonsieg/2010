import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext.jsx';

import AmbientPetals from './components/AmbientPetals.jsx';
import FloralTransition from './components/FloralTransition.jsx';
import TopNav from './components/TopNav.jsx';
import WishModal from './components/WishModal.jsx';
import ArchiveDrawer from './components/ArchiveDrawer.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import PageLoader from './components/PageLoader.jsx';

// Enterprise Code-Splitting: Lazy-load route pages to keep initial bundle tiny
const World3DExperience = lazy(() => import('./pages/World3DExperience.jsx'));
const SenderStudioPage = lazy(() => import('./pages/SenderStudioPage.jsx'));

function MainAppContent() {
  const location = useLocation();
  const { hasConfirmedAudioChoice } = useApp();

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
    // Không tải/khởi tạo Three.js phía sau modal hỏi nhạc. Cách này giữ màn chào
    // phản hồi tức thì và tránh tranh CPU, GPU, mạng trong những giây đầu tiên.
    if (!hasConfirmedAudioChoice) return <PageLoader />;

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
        {/* Trải nghiệm 3D là màn chính của app. */}
        <Route path="/" element={<Navigate to="/3d" replace />} />
        <Route path="/3d" element={<World3DExperience />} />
        {/* Bản 2D đã tắt: giữ URL cũ nhưng đưa người dùng về trải nghiệm chính. */}
        <Route path="/letter" element={<Navigate to="/3d" replace />} />
        <Route path="/balloons" element={<Navigate to="/3d" replace />} />
        <Route path="/private" element={<Navigate to="/3d" replace />} />
        <Route path="/video" element={<Navigate to="/3d" replace />} />
        <Route path="/slideshow" element={<Navigate to="/3d" replace />} />
        <Route path="/party" element={<Navigate to="/3d" replace />} />
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
