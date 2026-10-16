# Quy Tắc Dự Án: Web Chúc Mừng 20/10 (Sweet Rose & Champagne Editorial)

Tài liệu này áp dụng cho toàn bộ quá trình phát triển trang web chúc mừng 20/10 dành cho chị em công ty IT.

---

## 1. Công Nghệ & Ràng Buộc Kỹ Thuật (Tech Stack)
- **Framework:** Vite + Vanilla JavaScript (ES Modules).
- **Styling:** CSS hiện đại, semantic classes. Không dùng Tailwind CDN runtime hay FontAwesome CDN nặng.
- **Thư viện chính:**
  - `matter-js`: Vật lý bóng bay 2D lơ lửng bồng bềnh liên tục (buoyancy floating physics), chạm nổ particle.
  - `canvas-confetti`: Hiệu ứng nổ cánh hoa hồng, hoa anh đào & pháo giấy ánh kim rực rỡ.
  - `html2canvas`: Xuất thiệp chúc mừng độ nét cao (Retina 2x) tải về máy.
  - Google Apps Script (Web App) kết nối Google Sheet với cache localStorage 10 phút và fallback JSON.

---

## 2. Chuẩn Thẩm Mỹ & Tone Màu
- **Phong cách:** *Sweet Rose & Champagne Editorial* – Xinh xắn, ấm áp, rực rỡ và lãng mạn như bản gốc `base.html`, kết hợp nét trang trọng của nghệ thuật tạp chí:
  - Hồng ngọt ngào (Sweet Rose / Pink): `#FFF1F2`, `#FFE4E6`, `#FDA4AF`, `#F43F5E`, `#E11D48`.
  - Vàng Champagne & Hổ phách: `#C9A66B`, `#F59E0B`, `#FCD34D`.
  - Kem ngà giấy thư: `#FFFDF9`.
- **Typography:** *Playfair Display* (tiêu đề serif lãng mạn, nghiêng) + *Be Vietnam Pro* (nội dung rõ nét, hiện đại).

---

## 3. Ràng Buộc Phân Quyền & Chế Độ (Bảo Vệ Trải Nghiệm)
1. **Trang Chính Chị Em (Mặc Định):**
   - **TUYỆT ĐỐI KHÔNG CÓ** nút "Tôi là anh em" hay form gửi thư lộ liễu làm mất tính bất ngờ.
   - Luồng trải nghiệm tuần tự 6 màn:
     - Màn 0: Hộp quà 3D nắp bật mở + Nhận diện tên thông minh (`?to=lan_anh` hoặc ô lọc nhanh).
     - Màn 1: Thiệp chúc mừng lãng mạn có ảnh / avatar hoa của chị.
     - Màn 2: Bầu trời bóng bay thực sự lơ lửng, chọc nổ hạt hoa, Popup 3D Tilt xoay theo tay, và Archive Drawer xem lại lời chúc.
     - Màn 3: Hòm thư bí mật bảo mật bằng mã PIN 4 số (chỉ mở khi chị có thư riêng).
     - Màn 4: Slideshow tri ân từ anh em.
     - Màn 5: Quà thật tại Pantry (tải file .ics lịch thật) + Tải thiệp Retina 2x + Thả tim cảm ơn.
2. **Chế Độ Anh Em (Sender Studio):**
   - Chỉ kích hoạt qua URL riêng: `?mode=sender` (dành cho anh em gửi lời chúc trước ngày 20/10).
   - Tập trung 100% vào việc soạn thảo, chọn gửi công khai / gửi riêng, chọn màu bóng và xem thử giao diện.

---

## 4. Bảo Mật & Chuẩn Mực Nội Dung
- **Không nhúng tin nhắn riêng:** Lời nhắn riêng tư tuyệt đối không nhúng trong file JS tĩnh; chỉ nạp qua API khi có cặp `{ id, pin }`.
- **Chuẩn mực văn hóa:** Loại bỏ hoàn toàn các câu đùa về ngoại hình (cân nặng, tuổi tác) hay hôn nhân; chỉ tập trung vào sự trân trọng, năng lực, phẩm chất và lòng biết ơn chân thành.
- **Không dùng alert() giả:** Nút nhắc lịch phải tạo file `.ics` chuẩn; thông báo dùng Custom Toast sang trọng.
