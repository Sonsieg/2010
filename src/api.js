/**
 * API Client kết nối Google Apps Script với cơ chế Cache & Fallback an toàn
 */
import fallbackPeople from './data/people.fallback.json';
import fallbackWishes from './data/wishes.fallback.json';

// Khi deploy Google Apps Script, dán URL Web App vào đây (dạng https://script.google.com/macros/s/.../exec)
export const APPS_SCRIPT_URL = ""; 

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 phút

/**
 * 1. Lấy danh sách chị em (có cache localStorage + fallback)
 */
export async function fetchPeople() {
  const cacheKey = "tribute_people_cache";
  const cached = getCache(cacheKey);
  if (cached) return cached;

  if (!APPS_SCRIPT_URL) {
    return fallbackPeople;
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
      setCache(cacheKey, data.data);
      return data.data;
    }
    return fallbackPeople;
  } catch (err) {
    console.warn("[API] fetchPeople dùng fallback data:", err.message);
    return fallbackPeople;
  }
}

/**
 * 2. Lấy danh sách lời chúc công khai (bóng bay)
 */
export async function fetchPublicWishes() {
  const cacheKey = "tribute_public_wishes_cache";
  const cached = getCache(cacheKey);
  if (cached) return cached;

  if (!APPS_SCRIPT_URL) {
    return fallbackWishes;
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
    return fallbackWishes;
  } catch (err) {
    console.warn("[API] fetchPublicWishes dùng fallback data:", err.message);
    return fallbackWishes;
  }
}

/**
 * 3. Lấy lời nhắn riêng tư (Cá nhân hóa theo tên chị em)
 */
export async function fetchPrivateWishes(id, pin) {
  // Tìm thông tin chị em tương ứng
  const matchedPerson = fallbackPeople.find(p => p.id === id) || {
    name: "Chị Lan Anh",
    dept: "Công ty"
  };
  const displayName = matchedPerson.name;

  if (!APPS_SCRIPT_URL) {
    // Chế độ Demo / Local: Mở ngay các bức thư riêng ấm áp cá nhân hóa theo đúng tên chị!
    return {
      success: true,
      recipient_name: displayName,
      data: [
        {
          id: 1,
          type: "winged_letter",
          badge: "🕊️ Cánh Thư Tri Ân",
          title: "Thư từ người em cùng dự án",
          from_name: "Một người em trong team",
          text: `Cảm ơn chị ${displayName} đã luôn là người chỉ dẫn tận tình, kiên nhẫn đồng hành và gỡ rối cho em từ những ngày đầu bỡ ngỡ vào công ty. Chúc chị 20/10 luôn tràn đầy năng lượng, xinh đẹp rạng rỡ và luôn hạnh phúc với mọi lựa chọn của mình!`
        },
        {
          id: 2,
          type: "heart",
          badge: "💖 Trái Tim Đồng Đội",
          title: "Lời nhắn gửi từ hậu phương IT",
          from_name: "Đồng nghiệp giấu tên",
          text: `Mỗi đợt release căng thẳng hay dự án cam go, chỉ cần có chị ${displayName} cùng sát cánh là cả team kỹ thuật luôn thấy an tâm và tràn đầy năng lượng tích cực. Chúc chị một ngày 20/10 ngập tràn hoa tươi, quà xinh và nụ cười rạng rỡ!`
        },
        {
          id: 3,
          type: "winged_letter",
          badge: "🕊️ Cánh Thư Nắng Mai",
          title: "Bức thư từ người bạn cùng bàn",
          from_name: "Người bạn cùng bàn",
          text: `Gửi chị ${displayName}: Cảm ơn chị vì những cốc trà sữa chia ngọt sẻ bùi và những tràng cười sảng khoái xua tan áp lực deadline. Chúc chị tuổi mới, ngày lễ 20/10 mọi sự hanh thông, công việc thăng hoa và luôn là bông hoa tỏa sáng nhất!`
        },
        {
          id: 4,
          type: "heart",
          badge: "💖 Trái Tim Chân Tình",
          title: "Gửi tặng người chị truyền cảm hứng",
          from_name: "Anh em phòng Kỹ thuật",
          text: `Sự chu đáo, tinh tế và năng lực xuất sắc của chị ${displayName} luôn là nguồn cảm hứng lớn cho tất cả anh em. Chúc chị ngày Phụ nữ Việt Nam 20/10 thật trọn vẹn, ấm áp bên gia đình và những người thân yêu!`
        },
        {
          id: 5,
          type: "winged_letter",
          badge: "🕊️ Cánh Thư Ước Mơ",
          title: "Thư chúc mừng tương lai rạng ngời",
          from_name: "Nhóm dự án thân thương",
          text: `Chúc chị ${displayName} luôn giữ trọn niềm đam mê và nụ cười ngọt ngào. Mong rằng mọi dự định của chị trong năm nay đều cán đích xuất sắc vượt mong đợi. Chúc chị 20/10 hạnh phúc ngọt ngào như những đóa hồng!`
        }
      ]
    };
  }

  try {
    const res = await fetch(`${APPS_SCRIPT_URL}?action=private&id=${encodeURIComponent(id)}&pin=${encodeURIComponent(pin || "2010")}`);
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
          text: `Chúc chị ${displayName} một ngày 20/10 ngập tràn niềm vui, công việc thuận buồm xuôi gió và luôn tươi cười hạnh phúc!`
        }
      ]
    };
  }
}

/**
 * 4. Gửi lời chúc mới từ Form
 */
export async function submitWish(payload) {
  if (!APPS_SCRIPT_URL) {
    console.log("[Demo Mode] Giả lập gửi lời chúc thành công:", payload);
    return {
      success: true,
      message: "Cảm ơn bạn! Lời chúc đã được gửi (chế độ demo). Khi kết nối Google Apps Script, tin nhắn sẽ tự động gửi vào Sheet để duyệt."
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
