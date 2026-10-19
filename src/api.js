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

const CACHE_TTL_MS = 45 * 1000; // 45 giây (tự động đồng bộ nhanh khi admin duyệt sheet)

const LOVE_WISHES = [
  'Em yêu Vân Anh (Anh Tỏm), chúc em một ngày 20/10 thật dịu dàng. Anh Són yêu em rất nhiều và mong nụ cười của em luôn rạng rỡ.',
  'Vân Anh của anh, cảm ơn em vì đã bước vào cuộc đời anh. Chúc em 20/10 ngọt ngào, bình yên và luôn được anh yêu thương thật nhiều.',
  'Gửi em yêu Anh Tỏm: em là điều đáng yêu nhất trong ngày của anh. Chúc em luôn vui, luôn hạnh phúc và biết rằng Anh Són luôn ở bên em.',
  'Chúc Vân Anh một ngày 20/10 tràn đầy hoa, nắng và những cái ôm của anh. Anh yêu sự dịu dàng, mạnh mẽ và đáng yêu của em mỗi ngày.',
  'Em yêu hãy luôn tin vào chính mình nhé. Với Anh Són, em luôn là cô gái đặc biệt nhất, xinh đẹp nhất và xứng đáng với mọi điều ngọt ngào.',
  '20/10 này Anh Són chỉ muốn nói: yêu em, thương em và muốn cùng em lưu giữ thật nhiều kỷ niệm đẹp. Vân Anh hãy luôn hạnh phúc nhé!',
  'Anh Tỏm à, mỗi lần nghĩ về em là lòng anh lại thấy bình yên. Chúc em luôn được nâng niu, che chở và mỉm cười thật nhiều.',
  'Vân Anh yêu, em chính là món quà dịu dàng nhất mà cuộc sống dành cho Anh Són. Chúc em một ngày 20/10 ngập tràn yêu thương.',
  'Anh mong mọi điều tốt đẹp nhất sẽ đến với em, từ những niềm vui nhỏ bé đến những ước mơ lớn lao. Anh Són sẽ luôn đồng hành cùng em.',
  'Gửi cô gái anh thương: em không cần phải hoàn hảo, vì trong mắt anh em đã luôn tuyệt vời theo cách riêng của mình rồi. Yêu em, Anh Tỏm nhé!',
  'Chúc em yêu ngủ thật ngon, thức dậy thật vui và mỗi ngày đều cảm nhận được tình yêu Anh Són dành cho em nhiều đến nhường nào.',
  'Vân Anh là nơi trái tim anh muốn trở về sau mọi ngày dài. 20/10 thật ngọt ngào nhé em, anh thương em hơn mọi lời chúc có thể nói.',
  'Anh yêu em vì sự đáng yêu, ấm áp và cả những điều rất riêng chỉ Vân Anh mới có. Mong em luôn hạnh phúc bên Anh Són.',
  'Nếu có một điều ước trong ngày 20/10, Anh Són chỉ ước được nắm tay em thật lâu và cùng em đi qua thật nhiều mùa yêu thương.',
  'Em yêu Anh Tỏm, cảm ơn em vì đã làm cho những ngày bình thường của anh trở nên đặc biệt. Chúc em luôn rạng rỡ và an yên.',
  'Anh không cần điều gì quá lớn lao, chỉ cần Vân Anh luôn vui và ở bên anh. Chúc em 20/10 thật hạnh phúc, người anh yêu nhất.'
];

function loveWish(index = 0) {
  return LOVE_WISHES[Math.abs(Number(index) || 0) % LOVE_WISHES.length];
}

function personalizePublicWishes(items) {
  const count = Math.max(items.length, LOVE_WISHES.length);
  return Array.from({ length: count }, (_, index) => {
    const item = items[index % items.length] || {};
    return {
      ...item,
      id: item.id || index + 1,
      name: 'Anh Són',
      from_name: 'Anh Són',
      dept: 'Strongest',
      text: loveWish(index)
    };
  });
}

function personalizeCardWish(item, index = 0) {
  const text = loveWish(index);
  return {
    ...item,
    highlight: text,
    message: `${text} Nhân ngày 20/10, anh muốn dành tặng em yêu Vân Anh những lời chúc đẹp nhất và một tình yêu thật dịu dàng. ❤️`,
    from_name: 'Anh Són',
    dept: 'Strongest'
  };
}

function personalizePrivateWishes(data) {
  return data.map((item, index) => ({
    ...item,
    from_name: 'Anh Són',
    text: loveWish(index)
  }));
}

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
  const personalized = personalizeCardWish(item, item.id || 0);
  return {
    ...personalized,
    toString() {
      return `“${personalized.highlight}”\n\n${personalized.message}`;
    },
    fullText: `“${personalized.highlight}”\n\n${personalized.message}`
  };
}

/**
 * Lấy toàn bộ 50 lời chúc thiệp
 */
export function getAllCardWishes() {
  return cardWishesData.map((item, index) => personalizeCardWish(item, index));
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
  // Chương 3 — Thung lũng bóng bay dùng hoàn toàn local data.
  // Không đọc wishes từ Google Sheet/API để nội dung chỉ dành riêng cho Vân Anh.
  return personalizePublicWishes(balloonWishesData);
}

/**
 * 4. Lấy lời nhắn riêng tư (Không cần mã PIN)
 */
export async function fetchPrivateWishes(id) {
  const cleanId = String(id || 'lan_anh').trim().toLowerCase();
  const matchedSister = sistersData.find(s => s.id === cleanId) || {
    name: "Vân Anh (Clouda)",
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
        data: personalizePrivateWishes(sisterWishes)
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
          from_name: "Anh Són",
          text: loveWish(0)
        },
        {
          id: 2,
          type: "heart",
          badge: "💖 Trái Tim Đồng Đội",
          from_name: "Anh Són",
          text: loveWish(1)
        }
      ]
    };
  }

  try {
    const res = await fetch(`${APPS_SCRIPT_URL}?action=private&id=${encodeURIComponent(cleanId)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.success && Array.isArray(data.data) && data.data.length > 0) {
      return { ...data, data: personalizePrivateWishes(data.data) };
    }
    // Nếu chưa có lời chúc riêng gửi đích danh trong sheet, tự động sinh thư chúc ấm áp
    return {
      success: true,
      recipient_name: (data && data.recipient_name) || displayName,
      data: [
        {
          id: 1,
          type: "winged_letter",
          badge: "🕊️ Cánh Thư Tri Ân",
          from_name: "Anh Són",
          text: loveWish(0)
        },
        {
          id: 2,
          type: "heart",
          badge: "💖 Trái Tim Đồng Đội",
          from_name: "Anh Són",
          text: loveWish(1)
        }
      ]
    };
  } catch (err) {
    console.error("[API] fetchPrivateWishes error:", err);
    return {
      success: true,
      recipient_name: displayName,
      data: [
        {
          id: 1,
          type: "winged_letter",
          badge: "🕊️ Cánh Thư Tri Ân",
          from_name: "Anh Són",
          text: loveWish(2)
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
    const result = await res.json();
    if (result && result.success) {
      try {
        localStorage.removeItem("tribute_public_wishes_cache");
      } catch (e) {}
    }
    return result;
  } catch (err) {
    console.error("[API] submitWish error:", err);
    return { success: false, message: "Gửi lời chúc thất bại, vui lòng kiểm tra kết nối mạng." };
  }
}

function getCache(key) {
  try {
    // Nếu có tham số ?refresh=1 trên URL, xóa cache để luôn kéo data mới nhất từ Sheet
    if (typeof window !== 'undefined' && window.location.search.includes('refresh=1')) {
      try { localStorage.removeItem(key); } catch (e) {}
      return null;
    }

    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { timestamp, data, url } = JSON.parse(raw);
    if (url !== APPS_SCRIPT_URL) {
      localStorage.removeItem(key);
      return null;
    }

    // Ở môi trường local dev (localhost / 127.0.0.1), giảm cache TTL xuống 5 giây để test thay đổi từ Sheet gần như tức thì
    const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const effectiveTTL = isLocalhost ? 5000 : CACHE_TTL_MS;

    if (Date.now() - timestamp < effectiveTTL) {
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
      url: APPS_SCRIPT_URL,
      data
    }));
  } catch (e) {
    // Ignore storage quota
  }
}
