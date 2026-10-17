/**
 * 3D World Constants: Stations & Camera Presets
 */

// Camera presets cho xe hoa khi bám theo xe (chỉ giữ các góc bám xe)
export const VAN_PRESETS = {
  chase: { rel: true, cam: [4.6, 2.9, -9.5], tgt: [0, 1.5, 2.5] },
  close: { rel: true, cam: [3.8, 1.6, -4.8], tgt: [0, 1.3, 0.2] },
  side: { rel: true, cam: [8.8, 2.1, 0.6], tgt: [0, 1.3, 0.2] },
  top: { rel: true, cam: [0, 16, -6], tgt: [0, 0, 1.5] }
};

// 6 Master 3D Stations along the scenic flower road
export const STATIONS = [
  {
    id: 'gift',
    u: 0.02,
    name: 'Hộp Quà Hoàng Gia',
    subtitle: 'Chạm Hộp Quà Mở Bung Nắp, Thả Bướm & Bong Bóng 20.10',
    icon: '🎁'
  },
  {
    id: 'letter',
    u: 0.18,
    name: 'Đại Điện Thư Ngỏ',
    subtitle: 'Tấm Thiệp Bifold Khổng Lồ Dát Vàng & Chân Dung Tri Ân',
    icon: '💌'
  },
  {
    id: 'balloons',
    u: 0.35,
    name: 'Thung Lũng Bóng Bay',
    subtitle: 'Chạm Nổ Bóng Nhận Ngay Những Lời Chúc May Mắn Ngọt Ngào',
    icon: '🎈'
  },
  {
    id: 'courier',
    u: 0.52,
    name: 'Đại Lộ Xe Hoa 20/10',
    subtitle: 'Chuyến Xe Hoa Cổ Điển Rực Rỡ & Hòm Thư Bưu Kiện Riêng',
    icon: '🚐'
  },
  {
    id: 'video',
    u: 0.70,
    name: 'Rạp Chiếu Điện Ảnh',
    subtitle: 'Khán Đài Hoàng Hôn & Thước Phim Tri Ân Phái Đẹp',
    icon: '🎬'
  },
  {
    id: 'party',
    u: 0.88,
    name: 'Lâu Đài Tiệc Mừng',
    subtitle: 'Cung Điện Tiệc Hoàng Gia & Tải Thiệp Kỷ Niệm 2x Retina',
    icon: '💐'
  }
];
