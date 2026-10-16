import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext.jsx';

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

export default function App() {
  const navigate = useNavigate();

  return (
    <AppProvider navigate={navigate}>
      <div className="app-container">
        {/* Continuous ambient falling petals */}
        <AmbientPetals />

        {/* Top floating control bar */}
        <TopNav />

        {/* Cinematic floral curtain transition ("1 đống hoa chuyển cảnh") */}
        <FloralTransition />

        {/* Routes */}
        <Routes>
          <Route path="/" element={<GiftPage />} />
          <Route path="/letter" element={<LetterPage />} />
          <Route path="/balloons" element={<BalloonsPage />} />
          <Route path="/private" element={<PrivateHeartPage />} />
          <Route path="/video" element={<VideoPage />} />
          <Route path="/party" element={<PartyPage />} />
          <Route path="/sender" element={<SenderStudioPage />} />
        </Routes>

        {/* Global modals & drawer */}
        <WishModal />
        <ArchiveDrawer />
      </div>
    </AppProvider>
  );
}
