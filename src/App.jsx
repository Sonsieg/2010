import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext.jsx';

import AmbientPetals from './components/AmbientPetals.jsx';
import FloralTransition from './components/FloralTransition.jsx';
import TopNav from './components/TopNav.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import PageLoader from './components/PageLoader.jsx';

// Enterprise Code-Splitting: Lazy-load route pages to keep initial bundle tiny
const World3DExperience = lazy(() => import('./pages/World3DExperience.jsx'));
const SenderStudioPage = lazy(() => import('./pages/SenderStudioPage.jsx'));
const WishModal = lazy(() => import('./components/WishModal.jsx'));
const ArchiveDrawer = lazy(() => import('./components/ArchiveDrawer.jsx'));

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
  const location = useLocation();
  const is3DRoute = location.pathname === '/3d' || location.pathname === '/';
  const isSenderRoute = location.pathname === '/sender';

  return (
    <ErrorBoundary>
      <AppProvider navigate={navigate}>
        <div className="app-container">
          {/* Route 3D đã có particle riêng; không chạy thêm canvas 2D tranh CPU/GPU. */}
          {!is3DRoute && !isSenderRoute && <AmbientPetals />}

          {/* Top floating control bar */}
          <TopNav />

          {/* Cinematic floral curtain transition */}
          <FloralTransition />

          {/* Main Application: 3D Unified World vs 2D Editorial Pages */}
          <MainAppContent />

          {/* Modal 2D chỉ nạp khi thật sự cần, tránh tăng bundle/DOM cho thế giới 3D. */}
          {!is3DRoute && !isSenderRoute && (
            <Suspense fallback={null}>
              <WishModal />
              <ArchiveDrawer />
            </Suspense>
          )}
        </div>
      </AppProvider>
    </ErrorBoundary>
  );
}
