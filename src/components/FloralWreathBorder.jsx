import React from 'react';

/**
 * FloralWreathBorder — Giàn hoa Botanical hoàng gia uốn lượn mềm mại bọc quanh khung ảnh
 * Thiết kế theo phong cách thiệp cưới / thiệp tri ân Editorial cao cấp:
 * Cành dây leo uốn lượn cong mềm chữ S, nhiều đóa hoa hồng nhung nhiều lớp cánh xoắn,
 * hoa mẫu đơn, búp hoa e ấp, lá xanh có gân lá thanh thoát và chùm hạt quả mọng.
 */
export default function FloralWreathBorder() {
  return (
    <svg
      className="floral-wreath-svg"
      viewBox="0 0 380 440"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        {/* Gradient màu hoa hồng phớt */}
        <linearGradient id="rose-blush-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFF5F7" />
          <stop offset="40%" stopColor="#FDA4AF" />
          <stop offset="85%" stopColor="#F43F5E" />
          <stop offset="100%" stopColor="#BE123C" />
        </linearGradient>

        {/* Gradient hoa hồng nhung đỏ rượu vang */}
        <linearGradient id="rose-velvet-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#BE123C" />
          <stop offset="50%" stopColor="#8C2F4B" />
          <stop offset="100%" stopColor="#4A0E1C" />
        </linearGradient>

        {/* Gradient vàng champagne mạ kim */}
        <linearGradient id="gold-leaf-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFFBEB" />
          <stop offset="50%" stopColor="#E5C388" />
          <stop offset="100%" stopColor="#C9A66B" />
        </linearGradient>

        <linearGradient id="emerald-leaf-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4ADE80" />
          <stop offset="50%" stopColor="#166534" />
          <stop offset="100%" stopColor="#0F3F22" />
        </linearGradient>

        {/* Đổ bóng mềm tạo chiều sâu 3D */}
        <filter id="botanical-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="5" stdDeviation="4.5" floodColor="#3A0B18" floodOpacity="0.38" />
        </filter>
      </defs>

      {/* =========================================================
          KHUNG VIỀN MẠ KIM ĐÔI DÁT VÀNG ÔM KHUNG ẢNH
          ========================================================= */}
      <rect
        x="20"
        y="20"
        width="340"
        height="400"
        rx="22"
        fill="none"
        stroke="url(#gold-leaf-grad)"
        strokeWidth="1.8"
        strokeDasharray="16 8"
        opacity="0.85"
      />
      <rect
        x="25"
        y="25"
        width="330"
        height="390"
        rx="18"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="1.2"
        opacity="0.95"
      />

      {/* 4 NGÀM CÀI ẢNH KIM LOẠI MẠ VÀNG Ở 4 GÓC (VINTAGE PHOTO CORNERS) */}
      <g stroke="url(#gold-leaf-grad)" strokeWidth="2.5" fill="none">
        <path d="M16,36 L16,16 L36,16" />
        <path d="M364,36 L364,16 L344,16" />
        <path d="M16,404 L16,424 L36,424" />
        <path d="M364,404 L364,424 L344,424" />
      </g>

      {/* =========================================================
          CÁC CÀNH DÂY LEO UỐN LƯỢN MỀM MẠI (FLOWING S-CURVE VINES)
          ========================================================= */}
      {/* Cành chính góc trên-trái lượn sóng chữ S */}
      <path
        d="M24,130 C10,75 25,32 75,22 C120,14 150,28 175,22"
        stroke="#1E3A5F"
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M20,150 C5,100 16,55 48,35 C70,22 100,24 125,28"
        stroke="#2D6A4F"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />

      {/* Cành chính góc trên-phải */}
      <path
        d="M205,22 C240,28 300,16 335,42 C365,65 370,115 365,160"
        stroke="#1E3A5F"
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M260,26 C300,24 330,35 350,60 C370,90 366,130 362,175"
        stroke="#2D6A4F"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />

      {/* Cành chính góc dưới-trái */}
      <path
        d="M25,300 C12,350 22,398 62,416 C105,432 155,420 185,424"
        stroke="#1E3A5F"
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
      />

      {/* Cành chính góc dưới-phải */}
      <path
        d="M195,424 C240,420 295,432 335,406 C368,382 372,335 362,290"
        stroke="#1E3A5F"
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
      />

      {/* =========================================================
          GÓC TRÊN - TRÁI: CỤM HOA HỒNG BOTANICAL NHIỀU TẦNG CÁNH XOẮN
          ========================================================= */}
      <g className="cluster-top-left" filter="url(#botanical-shadow)">
        {/* Tán lá xanh navy & lá ngọc uốn lượn có gân */}
        <path d="M40,58 C18,48 10,30 22,14 C36,16 42,32 40,58 Z" fill="#1E3A5F" />
        <path d="M22,14 Q32,30 40,58" stroke="#7DD3FC" strokeWidth="0.8" fill="none" />

        <path d="M64,34 C50,16 34,10 20,20 C22,34 38,38 64,34 Z" fill="url(#emerald-leaf-grad)" />
        <path d="M20,20 Q36,24 64,34" stroke="#86EFAC" strokeWidth="0.7" fill="none" />

        <path d="M80,28 C70,10 52,4 38,14 C42,26 60,28 80,28 Z" fill="#2A4B7C" />

        {/* Nhánh quả mọng vươn dài ra ngoài góc */}
        <line x1="36" y1="42" x2="6" y2="22" stroke="#1E3A5F" strokeWidth="1.3" />
        <circle cx="5" cy="21" r="3.8" fill="#BE123C" stroke="#FFF" strokeWidth="0.5" />
        <circle cx="12" cy="14" r="3.2" fill="#1E3A5F" />
        <circle cx="1" cy="30" r="3" fill="#F43F5E" />
        <circle cx="16" cy="8" r="2.6" fill="#FDE68A" />

        {/* Búp hoa hồng e ấp vươn cong */}
        <g transform="translate(64, 16) rotate(-22)">
          <path d="M-5,4 C-9,12 -3,18 3,16 C10,12 8,5 1,2 Z" fill="#15803D" />
          <path d="M-4,2 C-7,-5 -2,-11 3,-9 C7,-5 7,-1 1,2 Z" fill="url(#rose-blush-grad)" stroke="#FFF" strokeWidth="0.4" />
          <path d="M0,0 C-2,-5 1,-7 3,-3 Z" fill="#BE123C" />
        </g>

        {/* ĐÓA HOA HỒNG BOTANICAL LỚN NỞ BUNG Ở GÓC TRÊN-TRÁI */}
        <g transform="translate(50, 48)">
          {/* Cánh ngoài xòe rộng */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <path
              key={deg}
              d="M0,0 C-9,-11 -11,-20 0,-22 C11,-20 9,-11 0,0 Z"
              fill="url(#rose-blush-grad)"
              stroke="#FFF1F2"
              strokeWidth="0.6"
              transform={`rotate(${deg})`}
            />
          ))}
          {/* Cánh giữa ôm tròn so le */}
          {[22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5].map((deg) => (
            <path
              key={`mid-${deg}`}
              d="M0,0 C-6,-7 -7,-14 0,-15 C7,-14 6,-7 0,0 Z"
              fill="#E11D48"
              stroke="#FDA4AF"
              strokeWidth="0.5"
              transform={`rotate(${deg})`}
            />
          ))}
          {/* Tâm nụ hoa cuộn xoắn nghệ thuật */}
          <circle cx="0" cy="0" r="7" fill="#8C2F4B" />
          <path d="M-2.5,-2.5 C-1,-5 2.5,-5 3.5,-1.5 C3.5,2.5 0,3.5 -2.5,1.5" stroke="#FDE68A" strokeWidth="1.2" strokeLinecap="round" fill="none" />
          <circle cx="0.5" cy="-0.5" r="1.3" fill="#FDE68A" />
        </g>

        {/* Đóa hoa anh đào 5 cánh nở nghiêng xinh xắn */}
        <g transform="translate(90, 36) rotate(18)">
          {[0, 72, 144, 216, 288].map((deg) => (
            <path
              key={deg}
              d="M0,0 C-3.5,-5 -5,-10 0,-11 C5,-10 3.5,-5 0,0 Z"
              fill="#FFF1F2"
              stroke="#FDA4AF"
              strokeWidth="0.5"
              transform={`rotate(${deg})`}
            />
          ))}
          <circle cx="0" cy="0" r="2.8" fill="#FDE68A" />
        </g>
      </g>

      {/* =========================================================
          GÓC TRÊN - PHẢI: CỤM HOA MẪU ĐƠN & HOA CÚC HOÀNG GIA
          ========================================================= */}
      <g className="cluster-top-right" filter="url(#botanical-shadow)">
        <path d="M340,58 C362,48 370,30 358,14 C344,16 338,32 340,58 Z" fill="#1E3A5F" />
        <path d="M358,14 Q348,30 340,58" stroke="#7DD3FC" strokeWidth="0.8" fill="none" />

        <path d="M316,34 C330,16 346,10 360,20 C358,34 342,38 316,34 Z" fill="url(#emerald-leaf-grad)" />
        <path d="M300,28 C310,10 328,4 342,14 C338,26 320,28 300,28 Z" fill="#2A4B7C" />

        {/* Quả mọng góc trên phải */}
        <line x1="344" y1="42" x2="374" y2="22" stroke="#1E3A5F" strokeWidth="1.3" />
        <circle cx="375" cy="21" r="3.8" fill="#BE123C" stroke="#FFF" strokeWidth="0.5" />
        <circle cx="368" cy="14" r="3.2" fill="#1E3A5F" />
        <circle cx="379" cy="30" r="3" fill="#F43F5E" />

        {/* ĐÓA HOA CÚC MẪU ĐƠN NHIỀU CÁNH Ở GÓC TRÊN-PHẢI */}
        <g transform="translate(330, 48)">
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
            <ellipse
              key={deg}
              cx="0"
              cy="-15"
              rx="5"
              ry="10"
              fill="url(#rose-velvet-grad)"
              stroke="#FECDD3"
              strokeWidth="0.5"
              transform={`rotate(${deg})`}
            />
          ))}
          {[15, 45, 75, 105, 135, 165, 195, 225, 255, 285, 315, 345].map((deg) => (
            <ellipse
              key={`in-${deg}`}
              cx="0"
              cy="-9"
              rx="3.6"
              ry="7"
              fill="#BE123C"
              stroke="#FFF1F2"
              strokeWidth="0.5"
              transform={`rotate(${deg})`}
            />
          ))}
          <circle cx="0" cy="0" r="7" fill="#C9A66B" stroke="#FFFBEB" strokeWidth="1" />
          <circle cx="0" cy="0" r="4.5" fill="#FDE68A" />
        </g>
      </g>

      {/* =========================================================
          CỤM HOA DỌC 2 BÊN SƯỜN (SIDE ACCENT FLOWERS)
          ========================================================= */}
      {/* Sườn trái */}
      <g transform="translate(22, 220)" filter="url(#botanical-shadow)">
        <path d="M4,-16 C-8,-28 -16,-20 -12,-6 C-3,-6 -1,-11 4,-16 Z" fill="#1E3A5F" />
        <path d="M4,16 C-8,28 -16,20 -12,6 C-3,6 -1,11 4,16 Z" fill="#166534" />
        <line x1="2" y1="-3" x2="-20" y2="-12" stroke="#1E3A5F" strokeWidth="1.2" />
        <circle cx="-21" cy="-13" r="3" fill="#BE123C" />
        <circle cx="-15" cy="-19" r="2.5" fill="#1E3A5F" />

        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
          <ellipse
            key={deg}
            cx="0"
            cy="-8"
            rx="3.8"
            ry="6.8"
            fill="url(#rose-blush-grad)"
            stroke="#FFF"
            strokeWidth="0.4"
            transform={`rotate(${deg})`}
          />
        ))}
        <circle cx="0" cy="0" r="3.8" fill="#FDE68A" />
      </g>

      {/* Sườn phải */}
      <g transform="translate(358, 235)" filter="url(#botanical-shadow)">
        <path d="M-4,-16 C8,-28 16,-20 12,-6 C3,-6 1,-11 -4,-16 Z" fill="#1E3A5F" />
        <path d="M-4,16 C8,28 16,20 12,6 C3,6 1,11 -4,16 Z" fill="#166534" />

        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
          <ellipse
            key={deg}
            cx="0"
            cy="-7.5"
            rx="3.5"
            ry="6.5"
            fill="#FB7185"
            stroke="#FFF"
            strokeWidth="0.4"
            transform={`rotate(${deg})`}
          />
        ))}
        <circle cx="0" cy="0" r="3.6" fill="#FDE68A" />
      </g>

      {/* =========================================================
          GÓC DƯỚI - TRÁI: HOA CÚC VÀ CÀNH LÁ UỐN CONG
          ========================================================= */}
      <g className="cluster-bottom-left" filter="url(#botanical-shadow)">
        <path d="M40,382 C18,392 10,410 22,426 C36,424 42,408 40,382 Z" fill="#1E3A5F" />
        <path d="M64,406 C50,424 34,430 20,420 C22,406 38,402 64,406 Z" fill="url(#emerald-leaf-grad)" />

        <line x1="36" y1="398" x2="6" y2="418" stroke="#1E3A5F" strokeWidth="1.3" />
        <circle cx="5" cy="419" r="3.8" fill="#BE123C" stroke="#FFF" strokeWidth="0.5" />
        <circle cx="12" cy="426" r="3.2" fill="#1E3A5F" />
        <circle cx="1" cy="410" r="3" fill="#F43F5E" />

        {/* ĐÓA HOA CÚC 10 CÁNH NỞ RỘ */}
        <g transform="translate(52, 392)">
          {[0, 36, 72, 108, 144, 180, 216, 252, 288, 324].map((deg) => (
            <ellipse
              key={deg}
              cx="0"
              cy="-14"
              rx="5.5"
              ry="9.5"
              fill="url(#rose-blush-grad)"
              stroke="#FFF1F2"
              strokeWidth="0.5"
              transform={`rotate(${deg})`}
            />
          ))}
          <circle cx="0" cy="0" r="6.8" fill="#E11D48" stroke="#FDE68A" strokeWidth="1" />
          <circle cx="0" cy="0" r="4.5" fill="#FDE68A" />
        </g>
      </g>

      {/* =========================================================
          GÓC DƯỚI - PHẢI: ĐÓA HOA HỒNG NHUNG ĐẠI ĐÓA & DÂY LEO
          ========================================================= */}
      <g className="cluster-bottom-right" filter="url(#botanical-shadow)">
        <path d="M340,382 C362,392 370,410 358,426 C344,424 338,408 340,382 Z" fill="#1E3A5F" />
        <path d="M358,426 Q348,410 340,382" stroke="#7DD3FC" strokeWidth="0.8" fill="none" />

        <path d="M316,406 C330,424 346,430 360,420 C358,406 342,402 316,406 Z" fill="url(#emerald-leaf-grad)" />

        <line x1="344" y1="398" x2="374" y2="418" stroke="#1E3A5F" strokeWidth="1.3" />
        <circle cx="375" cy="419" r="3.8" fill="#BE123C" stroke="#FFF" strokeWidth="0.5" />
        <circle cx="368" cy="426" r="3.2" fill="#1E3A5F" />
        <circle cx="379" cy="410" r="3" fill="#F43F5E" />

        {/* ĐÓA HOA HỒNG NHUNG ĐẠI ĐÓA */}
        <g transform="translate(328, 390)">
          {[0, 22.5, 45, 67.5, 90, 112.5, 135, 157.5, 180, 202.5, 225, 247.5, 270, 292.5, 315, 337.5].map(
            (deg) => (
              <ellipse
                key={deg}
                cx="0"
                cy="-16"
                rx="5"
                ry="10.5"
                fill="url(#rose-velvet-grad)"
                stroke="#FECDD3"
                strokeWidth="0.5"
                transform={`rotate(${deg})`}
              />
            )
          )}
          {[11, 33, 56, 78, 101, 123, 146, 168, 191, 213, 236, 258, 281, 303, 326, 348].map((deg) => (
            <ellipse
              key={`br-in-${deg}`}
              cx="0"
              cy="-10"
              rx="4"
              ry="7.5"
              fill="#BE123C"
              stroke="#FFF"
              strokeWidth="0.5"
              transform={`rotate(${deg})`}
            />
          ))}
          <circle cx="0" cy="0" r="7.2" fill="#C9A66B" stroke="#FFFBEB" strokeWidth="1" />
          <circle cx="0" cy="0" r="4.8" fill="#FDE68A" />
        </g>
      </g>

      {/* CÁNH HOA BAY LẢ TẢ TỰ NHIÊN XUNG QUANH */}
      <path d="M140,16 C145,8 155,12 153,18 C148,22 138,20 140,16 Z" fill="#FDA4AF" opacity="0.85" />
      <path d="M230,18 C236,10 246,14 244,20 C238,24 228,22 230,18 Z" fill="#F43F5E" opacity="0.85" />
      <path d="M10,180 C6,172 16,168 20,174 C22,182 14,186 10,180 Z" fill="#FDA4AF" opacity="0.8" />
      <path d="M370,185 C376,179 384,185 380,191 C374,197 366,191 370,185 Z" fill="#FDA4AF" opacity="0.8" />
      <path d="M140,424 C146,416 156,420 154,426 C148,430 138,428 140,424 Z" fill="#FDA4AF" opacity="0.85" />
      <path d="M240,422 C246,414 256,418 254,424 C248,428 238,426 240,422 Z" fill="#F43F5E" opacity="0.85" />
    </svg>
  );
}
