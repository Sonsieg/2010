# Kế Hoạch Triển Khai Chuẩn Xác: React SPA 20/10 (Sweet Rose & Cinematic Transition)

> **Mục tiêu:** Trang web chúc mừng 20/10 viết bằng React (Vite + React Router), chia thành **từng trang/màn hình riêng biệt**, có **hiệu ứng bão hoa bay chuyển cảnh (Floral Curtain Transition)** rực rỡ như trailer phim điện ảnh giữa các màn, bóng bay bay từ đáy tràn ngập màn hình lặp lại liên tục, hòm thư riêng là Trái tim pha lê / Phong bì sáp ánh nến bí mật, và Studio cho anh em tách biệt.

---

## 1. Cấu Trúc Đa Trang (Multi-Page Routes)

| Đường dẫn (HashRoute) | Tên Màn | Trải Nghiệm Tương Tác |
|---|---|---|
| `#/` | **Màn 1: Hộp Quà 3D** | Hộp quà nơ nhung rung rinh, chọn tên thông minh; bấm mở nắp bay lên -> **Bão hoa chuyển cảnh** sang Màn 2 |
| `#/letter` | **Màn 2: Thiệp Tri Ân Khổng Lồ** | Thiệp nền kem viền hoa, con dấu sáp 20/10, hiển thị ảnh / avatar hoa của chị, lời ngỏ từ anh em -> **Bão hoa chuyển cảnh** sang Màn 3 |
| `#/balloons` | **Màn 3: Bầu Trời Bóng Bay** | 56 bóng bay liên tục bay từ đáy lên tràn màn hình; nếu chưa chọc thủng thì bay lại liên tục; chọc nổ hạt hoa; Modal 3D Tilt; Archive Drawer xem lại -> **Bão hoa chuyển cảnh** sang Màn 4 |
| `#/private` | **Màn 4: Vườn Hoa Cổ Tích 3D & Xe Chở Thư** | Thế giới 3D Three.js: Con đường lát đá uốn lượn, vườn 120+ đóa hoa đung đưa, đèn lồng ấm áp, chiếc xe hoa vintage chở đầy giỏ hoa và rương thư. Chạm vào xe hoa để nổ pháo hoa và mở **Hòm thư cổ tích** gồm những **Bức thư có cánh 🕊️** và **Trái tim phát sáng 💖**; bấm vào mở Thư Hoàng Gia Ánh Nến 20/10 -> **Bão hoa chuyển cảnh** sang Màn 5 |
| `#/video` | **Màn 5: Rạp Chiếu Phim Tri Ân** | Khung rạp chiếu phim mini, slideshow các câu trích dẫn ấm áp từ anh em -> **Bão hoa chuyển cảnh** sang Màn 6 |
| `#/party` | **Màn 6: Quà Thật & Tải Thiệp** | Thông tin nhận quà tại Pantry 10:00 Sáng 20/10 (tải file .ics lịch thật); tải thiệp Retina 2x mang tên mình khoe Zalo/FB; thả tim cảm ơn anh em |
| `#/sender` | **Studio Soạn Lời Chúc (Anh Em)** | Trang dành riêng cho anh em trước 20/10: Viết lời chúc chung (bóng bay) hoặc lời nhắn riêng (hòm thư trái tim), chọn màu bóng, đếm ký tự |

---

## 2. Các Cải Tiến Đột Phá

1. **Hiệu ứng bão hoa chuyển cảnh (`FloralTransition.jsx`):** Khi chuyển giữa các trang, màn hình được phủ bởi một cơn bão cánh hoa hồng, hoa anh đào và ánh vàng óng ánh tung bay rực rỡ, kèm biểu tượng và thông điệp chuyển cảnh sang trọng.
2. **Bóng bay bay tràn màn hình (`BalloonsPage.jsx`):** Không đứng im; bóng bay từ đáy trang bay lên liên tục. Khi bay qua đỉnh màn hình mà chưa bị chọc nổ, bóng tự động tái sinh ở dưới đáy với tọa độ ngẫu nhiên.
3. **Thế giới 3D Vườn Hoa & Xe Chở Thư Three.js (`PrivateHeartPage.jsx`):** Khung cảnh 3D sống động như game phiêu lưu nghệ thuật với con đường uốn lượn, đèn đường phát sáng, 120 đóa hoa đung đưa, cây hoa anh đào và chiếc xe hoa vintage. Chạm vào xe hoa bung tỏa những bức thư có cánh và trái tim phát sáng!
4. **Nhật ký xem lại (`ArchiveDrawer.jsx`):** Slide-out drawer lưu lại toàn bộ các lời chúc đã mở, có thanh tìm kiếm nhanh theo tên hoặc phòng ban.
