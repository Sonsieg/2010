/**
 * Centralized Route Definitions & Navigation Stages
 */

export const NAV_STAGES = [
  { path: '/', label: 'Hộp Quà', icon: '🎁', isMainStage: true },
  { path: '/letter', label: 'Thư Ngỏ', icon: '💌', isMainStage: true },
  { path: '/balloons', label: 'Bóng Bay', icon: '🎈', isMainStage: true },
  { path: '/private', label: 'Xe Thư 2D', icon: '🌸', isMainStage: true },
  { path: '/video', label: 'Phim Tri Ân', icon: '🎬', isMainStage: true },
  { path: '/party', label: 'Màn Kết', icon: '💐', isMainStage: true }
];

export const SPECIAL_ROUTES = {
  SENDER: '/sender',
  THREE_D: '/3d'
};
