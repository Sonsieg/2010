import html2canvas from 'html2canvas';
import confetti from 'canvas-confetti';

export function initCardExport(showToastCallback) {
  const btnDownloadPng = document.getElementById('btnDownloadCardPng');
  const btnSaveCalendar = document.getElementById('btnSaveRealCalendar');
  const customNameInput = document.getElementById('customExportCardNameInput');
  const printNameEl = document.getElementById('exportRecipientPrintName');
  const exportCardEl = document.getElementById('exportableCardElement');

  // Cập nhật tên thiệp theo thời gian thực
  if (customNameInput && printNameEl) {
    customNameInput.addEventListener('input', () => {
      printNameEl.textContent = customNameInput.value.trim() || 'Chị Em IT';
    });
  }

  // 1. Tải thiệp chúc mừng PNG độ nét cao Retina 2x
  if (btnDownloadPng) {
    btnDownloadPng.addEventListener('click', async () => {
      const recipientName = (customNameInput ? customNameInput.value.trim() : '') || 'Chị Em IT';
      if (printNameEl) printNameEl.textContent = recipientName;

      btnDownloadPng.disabled = true;
      btnDownloadPng.innerHTML = '<span>Đang kết xuất thiệp... ⏳</span>';

      try {
        const canvas = await html2canvas(exportCardEl, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#FFF1F2'
        });

        const link = document.createElement('a');
        link.download = `Thiep-20-10-Tang-${recipientName.replace(/\s+/g, '_')}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();

        btnDownloadPng.disabled = false;
        btnDownloadPng.innerHTML = '<span>Tải Thiệp Về Máy (PNG) 💌</span>';
        if (showToastCallback) {
          showToastCallback('Đã tải thiệp thành công! Hãy chia sẻ khoe cùng bạn bè nhé! 🌸');
        }
      } catch (err) {
        console.error('Lỗi khi tải thiệp:', err);
        btnDownloadPng.disabled = false;
        btnDownloadPng.innerHTML = '<span>Thử lại</span>';
        if (showToastCallback) {
          showToastCallback('Không thể tạo file thiệp. Vui lòng thử lại.');
        }
      }
    });
  }

  // 2. Tải file lịch thật (.ics) nhắc giờ nhận quà thật tại văn phòng (Không dùng alert giả)
  if (btnSaveCalendar) {
    btnSaveCalendar.addEventListener('click', () => {
      generateIcsFile();
      if (showToastCallback) {
        showToastCallback('Đã tải file lịch hẹn (.ics) vào máy của bạn! 📅');
      }
    });
  }

  function generateIcsFile() {
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Tech Team//Vietnamese Womens Day 20-10//VI',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      'UID:wishes-2010-' + Date.now() + '@company.com',
      'DTSTAMP:20261016T080000Z',
      'DTSTART:20261020T030000Z', // 10:00 Sáng VN (UTC+7)
      'DTEND:20261020T043000Z',   // 11:30 Sáng VN
      'SUMMARY:🌸 Nhận Hoa & Quà 20/10 Cùng Anh Em Tech & Product',
      'DESCRIPTION:Thân mời các chị em có mặt tại Pantry để nhận hoa tươi\\, quà kỷ niệm và dự tiệc trà ngọt ngào cùng toàn thể anh em!',
      'LOCATION:Pantry Tầng 8 & Khu Vực Lounge',
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', 'Lich-Nhan-Qua-20-10.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // 3. Tương tác thả tim cảm ơn anh em
  const reactionBtns = document.querySelectorAll('.reaction-emoji-btn');
  const thanksNotice = document.getElementById('reactionThanksNotice');

  reactionBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      confetti({
        particleCount: 25,
        spread: 60,
        origin: { y: 0.85 },
        colors: ['#F43F5E', '#FDA4AF', '#FCD34D', '#FFF1F2']
      });

      if (thanksNotice) {
        thanksNotice.style.display = 'block';
      }
    });
  });
}
