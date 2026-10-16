# Bộ Prompt Chi Tiết Từng Giai Đoạn (Chuẩn React SPA Đa Màn & Bão Hoa Chuyển Cảnh)

Tài liệu này chứa bộ 6 prompt độc lập dành cho ứng dụng React SPA đa trang, chia từng màn riêng biệt, hiệu ứng chuyển cảnh bão hoa điện ảnh, bóng bay bay từ đáy lên liên tục và hòm thư trái tim pha lê bí mật.

---

## 📌 Khối Ngữ Cảnh Dùng Chung (Context Header)

```text
Dự án: Web chúc mừng ngày Phụ nữ Việt Nam 20/10 viết bằng React (Vite + React Router).
Stack: React 19, React Router (HashRouter), canvas-confetti, html2canvas, Google Apps Script API.
Phong cách: Sweet Rose & Champagne Editorial (tone màu ngọt ngào #FFF1F2, #FFE4E6, #F43F5E, #E11D48, #C9A66B).
Kiến trúc đa trang (Multi-page SPA): Mỗi màn là một Route riêng biệt, bấm chuyển màn sẽ kích hoạt cơn bão hoa bay chuyển cảnh (Floral Curtain Transition) rực rỡ như trailer phim.
Bóng bay: Bay từ đáy trang lên tràn màn hình, lặp lại liên tục nếu chưa bị chọc nổ.
Thư riêng: Trái tim pha lê đập nhịp & Phong bì sáp ánh nến bí mật với mã PIN 4 số (demo: 2010).
Chế độ Anh Em: Tách biệt tại route `#/sender` để anh em viết lời chúc trước 20/10.
```

---

## 🚀 Giai Đoạn 1: Setup React SPA & Màn 1 (Hộp Quà 3D Nắp Bung)

### Prompt GĐ 1:
```text
[BỐI CẢNH REACT SPA 20/10]
Bạn đang thực hiện Giai Đoạn 1.
MỤC TIÊU: Thiết lập dự án React (Vite + React Router + AppContext), cấu hình bảng màu Sweet Rose, và hoàn thiện Màn 1 Hộp quà 3D nắp bật mở & bộ nhận diện tên thông minh (`#/`).

CÁC BƯỚC THỰC HIỆN:
1. Kiểm tra `package.json` đảm bảo có `react`, `react-dom`, `react-router-dom`, `@vitejs/plugin-react`.
2. Tạo `src/context/AppContext.jsx` quản lý danh tính chị em, nạp dữ liệu, và hàm `navigateWithFlowerTransition(path)` kích hoạt hiệu ứng bão hoa bay chuyển cảnh.
3. Hoàn thiện `src/pages/GiftPage.jsx`:
   - Hộp quà 3D nơ nhung rung rinh.
   - Nhận diện thông minh: Nếu URL có `?to=lan_anh`, tự động hiện "Gửi riêng tặng: Chị Lan Anh 🌸"; nếu chưa có, hiển thị ô tìm kiếm lọc nhanh.
   - Khi bấm vào hộp quà: Nắp hộp bật mở nghiêng 25 độ, bùng nổ 90 hạt cánh hoa + confetti, âm thanh piano bắt đầu phát, kích hoạt bão hoa chuyển cảnh sang `#/letter`.

TIÊU CHÍ TỰ KIỂM TRA (SELF-CHECK CHECKLIST):
- [ ] Chạy `npm run build` thành công, 0 lỗi.
- [ ] Truy cập `http://localhost:3000/#/`: Mở hộp quà nắp bung lên đẹp mắt, bão hoa bung tỏa toàn màn hình và tự chuyển sang Màn 2 (`#/letter`).

Sau khi hoàn thành và vượt qua tất cả tiêu chí trên, hãy dừng lại và báo cáo kết quả.
```

---

## 🚀 Giai Đoạn 2: Màn 2 - Thiệp Tri Ân Khổng Lồ Viền Hoa (`#/letter`)

### Prompt GĐ 2:
```text
[BỐI CẢNH REACT SPA 20/10]
Bạn đang thực hiện Giai Đoạn 2.
MỤC TIÊU: Xây dựng Màn 2 (`#/letter`) – Tấm thiệp tri ân khổng lồ, trang nhã, lãng mạn viền hoa với con dấu sáp vàng 20/10 và avatar của chị.

CÁC BƯỚC THỰC HIỆN:
1. Hoàn thiện `src/pages/LetterPage.jsx`:
   - Con dấu sáp đỏ rượu vang 20.10.
   - Avatar tròn xinh xắn: Ảnh chân dung của chị (nếu has_consent=true) hoặc chữ cái đầu cách điệu.
   - Lời tri ân thấu cảm từ toàn thể anh em.
   - Nút hành động "Khám Phá Bầu Trời Bóng Bay 🎈" kích hoạt bão hoa chuyển cảnh sang `#/balloons`.

TIÊU CHÍ TỰ KIỂM TRA (SELF-CHECK CHECKLIST):
- [ ] Màn 2 hiển thị đúng tên và avatar của chị đã chọn ở Màn 1.
- [ ] Bấm nút khám phá bóng bay: Kích hoạt hiệu ứng bão hoa và chuyển sang `#/balloons`.

Sau khi hoàn thành và vượt qua tất cả tiêu chí trên, hãy dừng lại và báo cáo kết quả.
```

---

## 🚀 Giai Đoạn 3: Màn 3 - Bầu Trời Bóng Bay Bay Tràn Màn Hình Liên Tục (`#/balloons`)

### Prompt GĐ 3:
```text
[BỐI CẢNH REACT SPA 20/10]
Bạn đang thực hiện Giai Đoạn 3.
MỤC TIÊU: Xây dựng Màn 3 (`#/balloons`) – 56 bóng bay liên tục bay từ đáy lên tràn ngập màn hình, lặp lại liên tục nếu chưa bị chọc nổ, chọc nổ cánh hoa, Modal 3D Tilt và Archive Drawer xem lại lời chúc.

CÁC BƯỚC THỰC HIỆN:
1. Hoàn thiện `src/pages/BalloonsPage.jsx`:
   - Canvas bóng bay bay từ đáy lên (`y -= speedY`), dập dềnh sóng gió (`Math.sin(wobble)`).
   - Khi một quả bóng bay vượt qua trần màn hình mà chưa bị chọc nổ, nó tự động tái sinh ở dưới đáy với tọa độ X ngẫu nhiên.
   - Chạm/click vào bóng: Nổ "Pop!" ra chùm cánh hoa & confetti, mở Modal 3D Tilt đọc lời chúc (`src/components/WishModal.jsx`).
2. Tích hợp `src/components/ArchiveDrawer.jsx`:
   - Nút "📜 Danh sách lời chúc" mở Drawer trượt từ bên phải, tìm kiếm nhanh và xem lại toàn bộ lời chúc.
3. Nút chuyển tiếp "Bước Tiếp Theo: Hòm Thư Trái Tim Bí Mật 💌" kích hoạt bão hoa chuyển cảnh sang `#/private`.

TIÊU CHÍ TỰ KIỂM TRA (SELF-CHECK CHECKLIST):
- [ ] Bóng bay liên tục bay từ dưới lên, dập dềnh tự nhiên, không bị dừng hay đứng im.
- [ ] Chạm vào bóng: Nổ cánh hoa rực rỡ và mở Modal 3D Tilt xoay theo ngón tay/chuột.
- [ ] Bấm nút chuyển tiếp: Chuyển sang `#/private` kèm bão hoa điện ảnh.

Sau khi hoàn thành và vượt qua tất cả tiêu chí trên, hãy dừng lại và báo cáo kết quả.
```

---

## 🚀 Giai Đoạn 4: Màn 4 - Trái Tim Pha Lê & Thư Sáp Ánh Nến Bí Mật (`#/private`)

### Prompt GĐ 4:
```text
[BỐI CẢNH REACT SPA 20/10]
Bạn đang thực hiện Giai Đoạn 4.
MỤC TIÊU: Xây dựng Màn 4 (`#/private`) – Hòm thư trái tim pha lê đập nhịp và phong bì sáp ánh nến bí mật với mã PIN 4 số.

CÁC BƯỚC THỰC HIỆN:
1. Hoàn thiện `src/pages/PrivateHeartPage.jsx`:
   - Biểu tượng Trái tim pha lê phát sáng nhịp đập (`heart-pulse-glow`) và phong bì niêm phong sáp trong không gian ấm áp ánh nến.
   - 4 ô nhập PIN tự động nhảy con trỏ.
   - Nhập mã PIN demo `2010`: Con dấu bung nở ánh sáng và mở ra những bức thư riêng tư ấm áp.
   - Nhập sai PIN: Báo lỗi nhã nhặn, không lộ bất kỳ dữ liệu nào.
2. Nút chuyển tiếp "Bước Tiếp Theo: Rạp Chiếu Phim Tri Ân 🎬" kích hoạt bão hoa chuyển cảnh sang `#/video`.

TIÊU CHÍ TỰ KIỂM TRA (SELF-CHECK CHECKLIST):
- [ ] Giao diện ánh nến lãng mạn, trái tim đập nhịp lung linh.
- [ ] Nhập PIN 2010: Mở khóa các bức thư riêng thành công.
- [ ] Bấm nút chuyển tiếp: Chuyển sang `#/video` kèm bão hoa bay.

Sau khi hoàn thành và vượt qua tất cả tiêu chí trên, hãy dừng lại và báo cáo kết quả.
```

---

## 🚀 Giai Đoạn 5: Màn 5 (Video/Slideshow Tri Ân) & Màn 6 (Quà Thật + Tải Thiệp Retina)

### Prompt GĐ 5:
```text
[BỐI CẢNH REACT SPA 20/10]
Bạn đang thực hiện Giai Đoạn 5.
MỤC TIÊU: Hoàn thiện Màn 5 Rạp chiếu phim tri ân (`#/video`) và Màn 6 Màn kết quà thật + Tải thiệp Retina 2x (`#/party`).

CÁC BƯỚC THỰC HIỆN:
1. Hoàn thiện `src/pages/VideoPage.jsx`:
   - Khung rạp chiếu phim mini, slideshow các câu chúc từ anh em, nút tự động chạy.
   - Nút chuyển tiếp sang Màn kết `#/party`.
2. Hoàn thiện `src/pages/PartyPage.jsx`:
   - Thông tin nhận quà thật: Pantry 10:00 Sáng Thứ Ba 20/10 + nút tải file `.ics` lịch thật (KHÔNG DÙNG ALERT GIẢ).
   - Nút tải thiệp kỷ niệm cá nhân hóa độ nét cao Retina 2x (PNG) qua `html2canvas`.
   - Dãy nút thả tim cảm ơn anh em.

TIÊU CHÍ TỰ KIỂM TRA (SELF-CHECK CHECKLIST):
- [ ] Bấm tải thiệp: File PNG tải về máy cực nét mang tên chị.
- [ ] Bấm thêm vào lịch: File `.ics` tải về mở được trên Apple/Google Calendar.

Sau khi hoàn thành và vượt qua tất cả tiêu chí trên, hãy dừng lại và báo cáo kết quả.
```

---

## 🚀 Giai Đoạn 6: Chế Độ Anh Em (Sender Studio `#/sender`) & Nghiệm Thu Toàn Ứng Dụng

### Prompt GĐ 6:
```text
[BỐI CẢNH REACT SPA 20/10]
Bạn đang thực hiện Giai Đoạn 6 – Nghiệm thu sản phẩm hoàn chỉnh.
MỤC TIÊU: Hoàn thiện Chế độ Anh Em (`#/sender`) và nghiệm thu toàn diện toàn bộ các luồng ứng dụng.

CÁC BƯỚC THỰC HIỆN:
1. Hoàn thiện `src/pages/SenderStudioPage.jsx`:
   - Soạn lời chúc gửi tới Tất cả chị em (Bóng bay) hoặc Gửi riêng (Hòm thư trái tim).
   - Tùy chọn ẩn danh, chọn màu bóng bay, bộ đếm ký tự `X/250`.
   - Nút "Xem thử trang Chị Em 🌸" dẫn về `#/`.
2. Kiểm tra toàn bộ luồng chuyển trang từ `#/` -> `#/letter` -> `#/balloons` -> `#/private` -> `#/video` -> `#/party`.
3. Kiểm tra tính mượt mà của hiệu ứng bão hoa chuyển cảnh (`FloralTransition`).

TIÊU CHÍ TỰ KIỂM TRA (SELF-CHECK CHECKLIST - SẴN SÀNG GỬI LINK):
- [ ] Chạy `npm run build`: Thành công trong < 150ms.
- [ ] Trải nghiệm toàn bộ 6 màn hình riêng biệt: Mỗi lần chuyển màn đều có bão cánh hoa bay rực rỡ như trailer phim.
- [ ] Bóng bay bay từ đáy lên tràn ngập màn hình và bay lại liên tục nếu chưa chọc thủng.
- [ ] Thư riêng là Trái tim pha lê bí mật mở bằng mã PIN 2010.
- [ ] Trang của Anh Em (`#/sender`) hoàn toàn tách biệt.

Hoàn tất xuất sắc và sẵn sàng gửi link lúc 8h sáng ngày 20/10! 🎉
```
