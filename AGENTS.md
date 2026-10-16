# Hướng Dẫn Phát Triển Dự Án: 20/10 Cinematic Web

Dự án trang web chúc mừng ngày Phụ nữ Việt Nam 20/10 phong cách **Cinematic Editorial** dành tặng chị em công ty IT.

## Ngữ Cảnh Chung Cho Tất Cả Các Task
- **Công nghệ cố định:** Vite + Vanilla JS (ES Modules), GSAP + ScrollTrigger, Lenis, Matter.js, canvas-confetti, html2canvas. Dữ liệu qua Google Apps Script Web App. Không cài thêm framework nặng (React, Vue, Tailwind CDN, v.v.).
- **Phong cách nghệ thuật:** Cinematic Editorial. Gam màu kem ngà (`#FAF3EA`), đỏ rượu vang (`#8C2F4B`), vàng champagne (`#C9A66B`), nền mận tối (`#1E0F18`). Typography: Playfair Display / Cormorant Garamond kết hợp Be Vietnam Pro.
- **Ràng buộc di động:** Mobile-first, `100dvh`, không chặn zoom (`user-scalable=yes`), tôn trọng `prefers-reduced-motion`. Mọi hiệu ứng phải chạy mượt ≥ 50fps trên thiết bị di động tầm trung.
- **Bảo mật & Tôn trọng:**
  1. Tuyệt đối không nhúng lời nhắn riêng hoặc mã PIN vào bundle tĩnh. Phải lấy qua API với cặp `{ id, pin }`.
  2. Lời chúc ẩn danh chỉ ẩn với người xem; admin vẫn duyệt trong Google Sheet.
  3. Lời chúc mẫu & thu thập phải trang trọng, trân trọng năng lực và sự đồng hành; loại bỏ hoàn toàn các câu đùa ngoại hình hay tình duyên.
  4. Ảnh chân dung các chị em cần có cờ `has_consent: true`.

## Danh Sách 8 Màn Chính
- **Màn 0:** Hộp chọn danh tính ("Bạn là ai?": Chị em chọn tên / "Tôi là anh em" / "Xem tự do").
- **Màn 1:** Intro Cinematic với hoa nền, ánh kim, tiêu đề 20.10 xuất hiện kiểu mask reveal, âm thanh fade-in.
- **Màn 2:** Thư ngỏ từ anh em (nền kem, con dấu sáp vàng, chữ hiện từng dòng).
- **Màn 3:** Gallery chân dung các chị em (pinned scroll hoặc carrousel Ken Burns thanh lịch; tự động cuộn đến ảnh chị nếu đã chọn tên ở Màn 0).
- **Màn 4:** Bầu trời bóng bay vật lý (Matter.js 2D physics, chạm nổ ra cánh hoa & thẻ lời chúc 3D tilt hỗ trợ cả chuột lẫn cảm biến điện thoại).
- **Màn 5:** Lời nhắn riêng tư (Chỉ mở khi đúng `{ id, pin }` và có lời nhắn đã duyệt; giao diện phong bì ánh nến ấm áp).
- **Màn 6:** Video / Slideshow tri ân từ anh em (tích hợp player nhẹ, poster nét, không autoplay ép buộc).
- **Màn 7:** Màn kết (Thông tin nhận quà thật ngoài đời, nút tải thiệp cá nhân hóa chất lượng cao 2x retina qua html2canvas).
- **Drawer / Modal Form:** Nút cố định góc màn hình cho phép anh em gửi thêm lời chúc mới (ghi tên hoặc ẩn danh, gửi chung hoặc gửi riêng).
