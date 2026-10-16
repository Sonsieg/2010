---
name: tribute-2010
description: Cẩm nang kỹ thuật, kiến trúc và quy trình triển khai web chúc mừng 20/10 phong cách Cinematic Editorial (Vite, Matter.js, GSAP, Google Apps Script, Lenis).
---

# Skill: Triển Khai Trang Web 20/10 Cinematic Editorial

Tài liệu hướng dẫn kỹ thuật chuyên sâu dành cho nhà phát triển để triển khai dự án web chúc mừng 20/10.

---

## 1. Cấu Trúc Thư Mục Dự Án (Standard Project Layout)

```
DEMO/
├── index.html                   # HTML chính, semantic SEO, preload fonts & poster
├── package.json                 # Cấu hình npm & dependencies
├── vite.config.js               # Cấu hình Vite build
├── google-apps-script/
│   ├── Code.gs                  # Toàn bộ mã nguồn backend Google Apps Script
│   └── README.md                # Hướng dẫn tạo Google Sheet & deploy Web App
├── src/
│   ├── main.js                  # Entry point, khởi tạo Lenis, GSAP, Router/Screens
│   ├── style.css                # Toàn bộ Design Tokens, Typography, Layout, Themes
│   ├── api.js                   # Client gọi Apps Script, cache localStorage & fallback
│   ├── data/
│   │   ├── people.fallback.json # Danh sách chị em dự phòng (kèm vai trò, ảnh)
│   │   └── wishes.fallback.json # 56 lời chúc chọn lọc, chuẩn mực từ anh em
│   ├── modules/
│   │   ├── lenis-scroll.js      # Đồng bộ cuộn mượt Lenis + GSAP ScrollTrigger
│   │   ├── audio-player.js      # Quản lý nhạc nền, fade-in, unlock touch iOS
│   │   ├── identity-modal.js    # Màn 0: "Bạn là ai?" + URL param ?id=
│   │   ├── gallery.js           # Màn 3: Gallery chân dung các chị em
│   │   ├── balloon-engine.js    # Màn 4: Matter.js vật lý bóng bay & nổ cánh hoa
│   │   ├── private-messages.js  # Màn 5: Lời nhắn riêng tư với mã PIN
│   │   ├── wish-form.js         # Drawer form gửi lời chúc mới (anh em)
│   │   └── card-export.js       # Màn 7: Xuất thiệp chúc mừng bằng html2canvas
│   └── utils/
│       ├── confetti-petals.js   # Canvas hạt hoa & ánh kim
│       └── tilt.js              # Hiệu ứng nghiêng 3D cho thẻ (chuột + cảm ứng)
```

---

## 2. Kiến Trúc Backend: Google Apps Script & Google Sheet

### 2.1 Cấu Trúc 2 Bảng Tính (Tabs)
1. **Tab `people`:**
   - Cột A: `id` (chuỗi duy nhất viết thường, ví dụ: `lan_anh`, `trang_pm`)
   - Cột B: `name` (Họ và tên hiển thị: "Lan Anh", "Thùy Trang")
   - Cột C: `dept` (Phòng ban: "QA Lead", "Frontend Engineer")
   - Cột D: `role` (Mô tả ngắn vai trò)
   - Cột E: `photo` (Đường dẫn ảnh chân dung hoặc URL ảnh nội bộ)
   - Cột F: `pin` (Mã bí mật 4 chữ số, admin cung cấp cho chị)
   - Cột G: `has_consent` (`TRUE` hoặc `FALSE`, quyền hiển thị ảnh)

2. **Tab `wishes`:**
   - Cột A: `timestamp` (Thời gian gửi)
   - Cột B: `from_name` (Tên người gửi)
   - Cột C: `anonymous` (`TRUE` nếu tick ẩn danh)
   - Cột D: `to` (`ALL` nếu gửi chung, hoặc `id` của chị em trong bảng `people`)
   - Cột E: `text` (Nội dung lời chúc)
   - Cột F: `status` (`pending`, `approved`, hoặc `rejected`)

### 2.2 Mã Nguồn Apps Script (`Code.gs`)
```javascript
const SPREADSHEET_ID = "YOUR_SPREADSHEET_ID_HERE";

function doGet(e) {
  const action = e.parameter.action;
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  if (action === "people") {
    const sheet = ss.getSheetByName("people");
    const data = sheet.getDataRange().getValues();
    const rows = data.slice(1);
    const people = rows.map(r => ({
      id: String(r[0]),
      name: String(r[1]),
      dept: String(r[2]),
      role: String(r[3]),
      photo: r[6] ? String(r[4]) : "", // Chỉ trả ảnh khi has_consent = true
      has_consent: Boolean(r[6])
    }));
    return createJsonResponse({ success: true, data: people });
  }

  if (action === "public") {
    const sheet = ss.getSheetByName("wishes");
    const data = sheet.getDataRange().getValues();
    const rows = data.slice(1);
    const publicWishes = rows
      .filter(r => String(r[3]).toUpperCase() === "ALL" && String(r[5]) === "approved")
      .map((r, idx) => ({
        id: idx + 1,
        from_name: r[2] ? "Đồng nghiệp ẩn danh" : String(r[1]),
        text: String(r[4]),
        timestamp: r[0]
      }));
    return createJsonResponse({ success: true, data: publicWishes });
  }

  if (action === "private") {
    const id = String(e.parameter.id || "").toLowerCase();
    const pin = String(e.parameter.pin || "").trim();
    if (!id || !pin) return createJsonResponse({ success: false, message: "Missing id or pin" });

    const pSheet = ss.getSheetByName("people");
    const pData = pSheet.getDataRange().getValues().slice(1);
    const person = pData.find(r => String(r[0]).toLowerCase() === id && String(r[5]).trim() === pin);

    if (!person) {
      return createJsonResponse({ success: false, message: "Invalid PIN or ID" });
    }

    const wSheet = ss.getSheetByName("wishes");
    const wData = wSheet.getDataRange().getValues().slice(1);
    const privateWishes = wData
      .filter(r => String(r[3]).toLowerCase() === id && String(r[5]) === "approved")
      .map((r, idx) => ({
        id: idx + 1,
        from_name: r[2] ? "Đồng nghiệp ẩn danh" : String(r[1]),
        text: String(r[4]),
        timestamp: r[0]
      }));

    return createJsonResponse({ success: true, data: privateWishes });
  }

  return createJsonResponse({ success: false, message: "Unknown action" });
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    if (body.honeypot) {
      return createJsonResponse({ success: true, message: "OK" }); // Chặn bot âm thầm
    }
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName("wishes");
    sheet.appendRow([
      new Date(),
      body.from_name || "Ẩn danh",
      Boolean(body.anonymous),
      body.to || "ALL",
      String(body.text).substring(0, 300),
      "pending" // Luôn cần duyệt
    ]);
    return createJsonResponse({ success: true, message: "Submitted for moderation" });
  } catch (err) {
    return createJsonResponse({ success: false, message: err.toString() });
  }
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
```

---

## 3. Kiến Trúc Vật Lý Bóng Bay (Matter.js)

```javascript
import Matter from 'matter-js';

export function createBalloonsWorld(canvasEl, wishesList, onPopCallback) {
  const { Engine, Render, Runner, Bodies, Composite, Events, Mouse, MouseConstraint, Vector } = Matter;
  
  const width = canvasEl.clientWidth;
  const height = canvasEl.clientHeight;

  const engine = Engine.create({
    gravity: { x: 0, y: -0.05 } // Lực đẩy Archimedes nhẹ hướng lên
  });

  const render = Render.create({
    element: canvasEl,
    engine: engine,
    options: {
      width,
      height,
      wireframes: false,
      background: 'transparent'
    }
  });

  // Tường giới hạn trái, phải, trần, sàn
  const wallOptions = { isStatic: true, render: { visible: false } };
  const ceiling = Bodies.rectangle(width / 2, -50, width * 2, 100, wallOptions);
  const floor = Bodies.rectangle(width / 2, height + 80, width * 2, 100, wallOptions);
  const leftWall = Bodies.rectangle(-30, height / 2, 60, height * 2, wallOptions);
  const rightWall = Bodies.rectangle(width + 30, height / 2, 60, height * 2, wallOptions);
  Composite.add(engine.world, [ceiling, floor, leftWall, rightWall]);

  // Tạo các quả bóng tròn mềm
  const balloons = wishesList.map((wish, i) => {
    const radius = Math.min(38, Math.max(28, width / 24));
    const x = (width * 0.15) + (Math.random() * (width * 0.7));
    const y = height + 50 + (i * 25); // Bay dần từ dưới lên

    const body = Bodies.circle(x, y, radius, {
      restitution: 0.85,  // Độ nảy mềm mại
      frictionAir: 0.04,   // Cản không khí để không bay vọt
      render: {
        fillStyle: wish.color || '#C9A66B',
        strokeStyle: '#FAF3EA',
        lineWidth: 1
      }
    });
    body.wishData = wish;
    return body;
  });

  Composite.add(engine.world, balloons);

  // Runner
  const runner = Runner.create();
  Runner.run(runner, engine);
  Render.run(render);

  return { engine, render, runner };
}
```

---

## 4. Đồng Bộ Lenis và GSAP ScrollTrigger

```javascript
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initSmoothScroll() {
  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    touchMultiplier: 1.5,
  });

  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });

  gsap.ticker.lagSmoothing(0);
  return lenis;
}
```

---

## 5. Quy Chuẩn Kiểm Tra (Testing Checklist Trước Khi Bàn Giao)
- [ ] Chạy `npm run build` không có lỗi hay warning.
- [ ] Mở trình duyệt giả lập Mobile (iPhone 13, 375x812) và Desktop (1440x900).
- [ ] Kiểm tra API fallback: Tắt mạng hoặc ngắt URL Apps Script, dữ liệu `wishes.fallback.json` vẫn hiển thị trơn tru không lỗi trắng trang.
- [ ] Kiểm tra quyền riêng tư: DevTools Network không được thấy lời nhắn riêng tư khi chưa nhập đúng PIN.
- [ ] Kiểm tra tải thiệp: Click tải thiệp và mở file ảnh PNG đã tải, chữ sắc nét, căn giữa cân đối.
