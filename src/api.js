/**
 * API Client & Data Provider cho 20/10 Cinematic Web
 * Tự động đồng bộ với các file Mock chuẩn hóa trong src/data/
 * Khi có dữ liệu thật từ Google Sheet, chỉ cần dán APPS_SCRIPT_URL hoặc sửa file trong src/data/
 */
import sistersData from './data/sisters.json';
import balloonWishesData from './data/balloonWishes.json';
import privateWishesData from './data/privateWishes.json';
import cardWishesData from './data/cardWishes.json';

// Khi deploy Google Apps Script, dán URL Web App vào đây (dạng https://script.google.com/macros/s/.../exec)
// Nếu để rỗng (""), hệ thống sẽ tự động dùng 100% dữ liệu từ các file trong src/data/
export const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwuex0SUfkMbiD6zx0aIsoOyO9kMskPanbVtIbsCg1YQNckoPpwjJdR41_k5TtHMMs/exec"; 

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 phút

/**
 * 1. Lấy 1 lời chúc thiệp ngẫu nhiên trong 50 lời chúc chọn lọc
 */
export function getRandomCardWish(index) {
  let item;
  if (typeof index === 'number' && index >= 0 && index < cardWishesData.length) {
    item = cardWishesData[index];
  } else {
    const randomIndex = Math.floor(Math.random() * cardWishesData.length);
    item = cardWishesData[randomIndex];
  }
  return {
    ...item,
    toString() {
      return `“${item.highlight}”\n\n${item.message}`;
    },
    fullText: `“${item.highlight}”\n\n${item.message}`
  };
}

/**
 * Lấy toàn bộ 50 lời chúc thiệp
 */
export function getAllCardWishes() {
  return cardWishesData;
}

/**
 * Tự động chuẩn hóa link ảnh, đặc biệt là link Google Drive sang định dạng direct CDN
 */
export function normalizePhotoUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  // Chuyển link Google Drive (view/sharing) sang link direct image stream
  const driveMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/) || trimmed.match(/id=([a-zA-Z0-9_-]+)/);
  if (driveMatch && (trimmed.includes('drive.google.com') || trimmed.includes('docs.google.com'))) {
    const fileId = driveMatch[1];
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }

  return trimmed;
}

/**
 * 2. Lấy danh sách chị em (hỗ trợ cả offline data và online Google Sheet)
 */
export async function fetchPeople() {
  const cacheKey = "tribute_people_cache";
  const cached = getCache(cacheKey);
  if (cached) return cached;

  if (!APPS_SCRIPT_URL) {
    return sistersData.map(p => ({
      ...p,
      photo: normalizePhotoUrl(p.photo)
    }));
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

    const res = await fetch(`${APPS_SCRIPT_URL}?action=people`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.success && Array.isArray(data.data) && data.data.length > 0) {
      const sanitizedPeople = data.data.map(p => ({
        ...p,
        photo: normalizePhotoUrl(p.photo)
      }));
      setCache(cacheKey, sanitizedPeople);
      return sanitizedPeople;
    }
    return sistersData.map(p => ({
      ...p,
      photo: normalizePhotoUrl(p.photo)
    }));
  } catch (err) {
    console.warn("[API] fetchPeople dùng local data:", err.message);
    return sistersData.map(p => ({
      ...p,
      photo: normalizePhotoUrl(p.photo)
    }));
  }
}

/**
 * 3. Lấy danh sách lời chúc công khai (bóng bay & biển bảng)
 */
export async function fetchPublicWishes() {
  const cacheKey = "tribute_public_wishes_cache";
  const cached = getCache(cacheKey);
  if (cached) return cached;

  if (!APPS_SCRIPT_URL) {
    return balloonWishesData;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(`${APPS_SCRIPT_URL}?action=public`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.success && Array.isArray(data.data) && data.data.length > 0) {
      const formatted = data.data.map((item, idx) => ({
        id: item.id || idx + 1,
        name: item.from_name || "Đồng nghiệp",
        dept: "Công ty",
        text: item.text,
        color: item.color || "#C9A66B"
      }));
      setCache(cacheKey, formatted);
      return formatted;
    }
    return balloonWishesData;
  } catch (err) {
    console.warn("[API] fetchPublicWishes dùng local data:", err.message);
    return balloonWishesData;
  }
}

/**
 * 4. Lấy lời nhắn riêng tư (Không cần mã PIN)
 */
export async function fetchPrivateWishes(id) {
  const cleanId = String(id || 'lan_anh').trim().toLowerCase();
  const matchedSister = sistersData.find(s => s.id === cleanId) || {
    name: "Chị Lan Anh",
    dept: "Quality Assurance",
    role: "QA Lead"
  };
  const displayName = matchedSister.name;

  if (!APPS_SCRIPT_URL) {
    // Lấy lời chúc riêng theo recipientId từ privateWishes.json
    const sisterWishes = privateWishesData.filter(w => w.recipientId === cleanId);
    if (sisterWishes.length > 0) {
      return {
        success: true,
        recipient_name: displayName,
        data: sisterWishes
      };
    }

    // Nếu chị chưa có lời chúc riêng cụ thể trong file, tự sinh thư chúc ấm áp cá nhân hóa
    return {
      success: true,
      recipient_name: displayName,
      data: [
        {
          id: 1,
          type: "winged_letter",
          badge: "🕊️ Cánh Thư Tri Ân",
          from_name: "Anh em trong team",
          text: `Cảm ơn ${displayName} đã luôn đồng hành, hỗ trợ và mang lại nguồn năng lượng tích cực cho toàn thể anh em. Chúc bạn một ngày 20/10 ngập tràn niềm vui, hoa tươi và những điều ngọt ngào nhất!`
        },
        {
          id: 2,
          type: "heart",
          badge: "💖 Trái Tim Đồng Đội",
          from_name: "Một người đồng nghiệp giấu tên",
          text: `Chúc ${displayName} ngày 20/10 luôn rạng rỡ, công việc hanh thông, vạn sự như ý và mãi là đóa hoa xinh đẹp của công ty!`
        }
      ]
    };
  }

  try {
    const res = await fetch(`${APPS_SCRIPT_URL}?action=private&id=${encodeURIComponent(cleanId)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("[API] fetchPrivateWishes error:", err);
    return {
      success: true,
      recipient_name: displayName,
      data: [
        {
          id: 1,
          from_name: "Đồng nghiệp thân thiết",
          text: `Chúc ${displayName} một ngày 20/10 ngập tràn niềm vui, công việc thuận buồm xuôi gió và luôn tươi cười hạnh phúc!`
        }
      ]
    };
  }
}

/**
 * 5. Gửi lời chúc mới từ Form
 */
export async function submitWish(payload) {
  if (!APPS_SCRIPT_URL) {
    console.log("[Local Mode] Lời chúc đã được ghi nhận:", payload);
    return {
      success: true,
      message: "Cảm ơn bạn! Lời chúc đã được lưu thành công. Khi kết nối Google Apps Script, tin nhắn sẽ tự động gửi vào Google Sheet của ban tổ chức."
    };
  }

  try {
    const res = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(payload)
    });
    return await res.json();
  } catch (err) {
    console.error("[API] submitWish error:", err);
    return { success: false, message: "Gửi lời chúc thất bại, vui lòng kiểm tra kết nối mạng." };
  }
}

// Helpers
function getCache(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { timestamp, data } = JSON.parse(raw);
    if (Date.now() - timestamp < CACHE_TTL_MS) {
      return data;
    }
    localStorage.removeItem(key);
    return null;
  } catch (e) {
    return null;
  }
}

function setCache(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({
      timestamp: Date.now(),
      data
    }));
  } catch (e) {
    // Ignore storage quota
  }
}
