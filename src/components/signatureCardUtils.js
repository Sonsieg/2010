/**
 * Signature Card Utilities & 2D Canvas Generator
 * Dành cho trường hợp chị em chưa kịp có ảnh chân dung:
 * Tạo thẻ chữ ký nghệ thuật phong cách thư pháp Vintage / Cinematic (theo chuẩn Ảnh 2)
 * Thiết kế nền màu nước ấm mềm mại, không bị chói lóa, bố cục tràn viền đầy đặn.
 */

export const SIGNATURE_STYLES = [
  {
    id: 1,
    title: 'Chữ ký đơn giản + hoa lá',
    font: '"Great Vibes", cursive',
    quote: 'Luôn xinh đẹp, hạnh phúc và tỏa sáng theo cách riêng của mình!',
    theme: {
      bgStart: '#FDF1F4',
      bgEnd: '#F9DCE3',
      splash: 'rgba(244, 63, 94, 0.28)',
      border: '#E6A7B8',
      text: '#881337',
      accent: '#B45309',
      emblem: 'flower'
    }
  },
  {
    id: 2,
    title: 'Chữ ký bay bổng + vương miện',
    font: '"Alex Brush", cursive',
    quote: 'Luôn rạng rỡ, tự tin và gặt hái thật nhiều thành công rực rỡ!',
    theme: {
      bgStart: '#FAF2E6',
      bgEnd: '#F3E4D0',
      splash: 'rgba(217, 119, 6, 0.22)',
      border: '#D4AF37',
      text: '#78350F',
      accent: '#C9A66B',
      emblem: 'crown'
    }
  },
  {
    id: 3,
    title: 'Chữ ký kèm sakura hoa lá',
    font: '"Great Vibes", cursive',
    quote: 'Chúc chị luôn tươi tắn, dịu dàng và được yêu thương thật nhiều!',
    theme: {
      bgStart: '#FFF0F5',
      bgEnd: '#FAD8E2',
      splash: 'rgba(236, 72, 153, 0.26)',
      border: '#F472B6',
      text: '#9D174D',
      accent: '#E11D48',
      emblem: 'sakura'
    }
  },
  {
    id: 4,
    title: 'Chữ ký quý phái + ánh sao',
    font: '"Dancing Script", cursive',
    quote: 'Mong chị mỗi ngày đều ngập tràn niềm vui và bình an trong tâm hồn!',
    theme: {
      bgStart: '#FDF5E8',
      bgEnd: '#F6E4C8',
      splash: 'rgba(245, 158, 11, 0.24)',
      border: '#E2B876',
      text: '#713F12',
      accent: '#D97706',
      emblem: 'stars'
    }
  },
  {
    id: 5,
    title: 'Chữ ký tối giản & tinh tế',
    font: '"Great Vibes", cursive',
    quote: 'Luôn mạnh khỏe, bình an và ngập tràn hạnh phúc mỗi ngày!',
    theme: {
      bgStart: '#FAF3EB',
      bgEnd: '#F4E5D4',
      splash: 'rgba(168, 85, 247, 0.22)',
      border: '#C084FC',
      text: '#581C87',
      accent: '#9333EA',
      emblem: 'minimal'
    }
  }
];

export function getSignatureStyleForName(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % SIGNATURE_STYLES.length;
  return SIGNATURE_STYLES[index];
}

/**
 * Tạo canvas 2D thẻ chữ ký nghệ thuật chất lượng cao (dùng cho Three.js Texture hoặc xuất ảnh)
 * Tone màu nước pastel ấm, có vệt cọ nghệ thuật nâng đỡ tên, hoa lá tràn viền, chống lóa sáng tuyệt đối.
 */
export function createSignatureCardCanvas(name = 'Lan Anh', customQuote = '', width = 800, height = 1060) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const style = getSignatureStyleForName(name);

  // 1. Nền màu nước pastel dịu nhẹ (chống lóa sáng trong 3D)
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, style.theme.bgStart);
  bgGrad.addColorStop(0.45, style.theme.bgEnd);
  bgGrad.addColorStop(1, style.theme.bgStart);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Vệt màu nước tròn loang nhẹ ở 2 góc
  const cornerGrad1 = ctx.createRadialGradient(80, 80, 10, 80, 80, 260);
  cornerGrad1.addColorStop(0, style.theme.splash);
  cornerGrad1.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = cornerGrad1;
  ctx.fillRect(0, 0, 360, 360);

  const cornerGrad2 = ctx.createRadialGradient(width - 80, height - 80, 10, width - 80, height - 80, 260);
  cornerGrad2.addColorStop(0, style.theme.splash);
  cornerGrad2.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = cornerGrad2;
  ctx.fillRect(width - 360, height - 360, 360, 360);

  // 2. Viền đôi mỹ thuật mạ vàng / hồng pastel
  ctx.strokeStyle = style.theme.border;
  ctx.lineWidth = 4;
  ctx.strokeRect(26, 26, width - 52, height - 52);

  ctx.strokeStyle = 'rgba(201, 166, 107, 0.55)';
  ctx.lineWidth = 1.8;
  ctx.strokeRect(38, 38, width - 76, height - 76);

  // 4 Hoa văn Baroque ở góc ❧ ☙
  ctx.fillStyle = style.theme.accent;
  ctx.font = '24px serif';
  ctx.fillText('❧', 48, 68);
  ctx.fillText('☙', width - 72, 68);
  ctx.fillText('❧', 48, height - 48);
  ctx.fillText('☙', width - 72, height - 48);

  // 3. Header: WITH LOVE • 20.10
  ctx.textAlign = 'center';
  ctx.fillStyle = style.theme.text;
  ctx.font = '700 16px "Be Vietnam Pro", sans-serif';
  ctx.letterSpacing = '4px';
  ctx.fillText('WITH LOVE • 20.10', width / 2, 108);
  ctx.letterSpacing = '0px';

  // 4. Biểu tượng đồ họa / Giàn hoa Botanical
  if (style.theme.emblem === 'crown') {
    ctx.font = '46px serif';
    ctx.fillText('👑', width / 2, 185);
    ctx.fillStyle = style.theme.accent;
    ctx.font = '18px serif';
    ctx.fillText('✦  ✧  ✦', width / 2, 220);
  } else if (style.theme.emblem === 'stars') {
    ctx.font = '36px serif';
    ctx.fillStyle = style.theme.accent;
    ctx.fillText('✨  ✦  👑  ✦  ✨', width / 2, 190);
  } else {
    // Giàn cành hoa uốn lượn phong cách Botanical (Style 1 & 4)
    ctx.save();
    ctx.strokeStyle = style.theme.accent;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(width / 2 - 130, 195);
    ctx.bezierCurveTo(width / 2 - 60, 170, width / 2 + 60, 220, width / 2 + 130, 192);
    ctx.stroke();

    // Những đóa hoa hồng / hoa đào tươi thắm
    [-100, -50, 0, 50, 100].forEach((ox, i) => {
      ctx.fillStyle = i % 2 === 0 ? '#BE123C' : '#F43F5E';
      ctx.beginPath();
      ctx.arc(width / 2 + ox, 192 + (i % 2 === 0 ? -6 : 6), 6.5, 0, Math.PI * 2);
      ctx.fill();

      // Lá xanh mướt
      ctx.fillStyle = '#15803D';
      ctx.beginPath();
      ctx.ellipse(width / 2 + ox + 8, 192 + (i % 2 === 0 ? -2 : 10), 7, 3, Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  // 5. [VỆT MÀU NƯỚC NGHỆ THUẬT NÂNG ĐỠ CHỮ KÝ] (Style 7 & 9 trong mẫu)
  ctx.save();
  ctx.translate(width / 2, 360);
  ctx.rotate(-0.02);

  // Lớp vệt cọ màu nước loang tự nhiên
  const brushGrad = ctx.createLinearGradient(-width * 0.42, 0, width * 0.42, 0);
  brushGrad.addColorStop(0, 'rgba(251, 113, 133, 0.0)');
  brushGrad.addColorStop(0.12, 'rgba(251, 113, 133, 0.35)');
  brushGrad.addColorStop(0.35, 'rgba(244, 63, 94, 0.45)');
  brushGrad.addColorStop(0.65, 'rgba(251, 113, 133, 0.48)');
  brushGrad.addColorStop(0.88, 'rgba(244, 63, 94, 0.32)');
  brushGrad.addColorStop(1, 'rgba(251, 113, 133, 0.0)');
  ctx.fillStyle = brushGrad;

  // Vẽ hình cọ quét màu nước mềm mại có texture lượn sóng
  ctx.beginPath();
  ctx.ellipse(0, 0, width * 0.44, 72, 0, 0, Math.PI * 2);
  ctx.fill();

  // Lớp cọ thứ hai điểm xuyết tạo chiều sâu nghệ thuật
  ctx.fillStyle = 'rgba(254, 205, 211, 0.6)';
  ctx.beginPath();
  ctx.ellipse(-15, 8, width * 0.38, 52, 0.02, 0, Math.PI * 2);
  ctx.fill();

  // Điểm xuyết vài chấm mực nước hồng rơi lãng mạn
  [[-180, -32], [210, 28], [-140, 36], [170, -30]].forEach(([dx, dy]) => {
    ctx.fillStyle = 'rgba(244, 63, 94, 0.35)';
    ctx.beginPath();
    ctx.arc(dx, dy, 4.5, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();

  // 6. Tên chữ ký nghệ thuật (Calligraphy lớn, cực kỳ nổi bật trên vệt cọ)
  const displayName = name.replace(/^(Chị\s+|Em\s+)/i, '').trim() || 'Lan Anh';
  ctx.fillStyle = '#881337';
  ctx.font = 'italic 700 96px "Great Vibes", "Alex Brush", cursive';
  ctx.shadowColor = 'rgba(136, 19, 55, 0.3)';
  ctx.shadowBlur = 12;
  ctx.fillText(`${displayName} ♡`, width / 2, 388);
  ctx.shadowBlur = 0; // reset shadow

  // Nét gạch ký tên uốn lượn nghệ thuật dưới chân
  ctx.strokeStyle = style.theme.border;
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 200, 432);
  ctx.quadraticCurveTo(width / 2, 465, width / 2 + 200, 426);
  ctx.stroke();

  // 7. Lời chúc ngọt ngào (Typography lớn 25px, màu than đậm dễ đọc)
  const wish = customQuote || style.quote;
  ctx.fillStyle = '#1E293B';
  ctx.font = '500 25px "Be Vietnam Pro", sans-serif';

  const words = wish.split(' ');
  let line = '';
  let curY = 540;
  const maxWidth = width - 170;
  const lineHeight = 44;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line, width / 2, curY);
      line = words[n] + ' ';
      curY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, width / 2, curY);

  // 8. Trái tim nghệ thuật đỏ thắm ở đáy thẻ
  ctx.font = '42px serif';
  ctx.fillStyle = '#BE123C';
  ctx.fillText('♥', width / 2, height - 150);

  // 9. Dòng chữ vinh danh chân thành
  ctx.fillStyle = style.theme.accent;
  ctx.font = '700 16px "Be Vietnam Pro", sans-serif';
  ctx.letterSpacing = '2.5px';
  ctx.fillText('✦ TECH & PRODUCT TRIBUTE 20.10 ✦', width / 2, height - 105);
  ctx.letterSpacing = '0px';

  return canvas;
}
