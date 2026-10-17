import React, { Suspense, lazy } from 'react';
import { useApp } from '../context/AppContext.jsx';
import PrivateGarden2D from '../components/PrivateGarden2D.jsx';
import PageLoader from '../components/PageLoader.jsx';

// Lazy-load the heavy 3D WebGL scene so 2D users don't download Three.js
const PrivateGarden3D = lazy(() => import('../components/PrivateGarden3D.jsx'));

/**
 * Màn 4: Thư Riêng Tư & Xe Giao Hoa
 * - Chế độ 2D: Cỗ xe hoa phong cách cổ tích, rương bưu phẩm, thư bay (nhẹ, mượt)
 * - Chế độ 3D: Khu vườn Three.js hoàng hôn (nạp khi người dùng chọn 3D)
 */
export default function PrivateHeartPage() {
  const { experienceMode } = useApp();

  if (experienceMode === '2d') {
    return <PrivateGarden2D />;
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <PrivateGarden3D />
    </Suspense>
  );
}