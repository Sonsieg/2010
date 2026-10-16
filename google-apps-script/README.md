# Hướng Dẫn Cài Đặt Google Sheet & Deploy Google Apps Script (5 Phút)

Hệ thống cho phép lưu trữ và duyệt lời chúc tự động mà không cần máy chủ riêng (hoàn toàn miễn phí).

---

## Bước 1: Tạo Google Sheet

1. Truy cập [sheets.new](https://sheets.new) để tạo một bảng tính mới. Đặt tên: **Wishes_2010_IT**.
2. Đổi tên tab mặc định thành **`people`**, tạo dòng tiêu đề (Dòng 1):
   - **Cột A:** `id` (Mã định danh viết thường, ví dụ: `lan_anh`, `thu_trang`)
   - **Cột B:** `name` (Họ và tên: `Nguyễn Lan Anh`, `Vũ Thu Trang`)
   - **Cột C:** `dept` (Phòng ban: `QA & Testing`, `Product Design`)
   - **Cột D:** `role` (Vai trò: `QA Lead`, `UI/UX Designer`)
   - **Cột E:** `photo` (Đường dẫn ảnh WebP hoặc link ảnh nội bộ)
   - **Cột F:** `pin` (Mã PIN 4 số bí mật gửi riêng cho chị qua Zalo, ví dụ: `2010`, `8866`)
   - **Cột G:** `has_consent` (Điền `TRUE` nếu chị đồng ý hiện ảnh; `FALSE` nếu dùng avatar minh họa)

3. Tạo tab thứ hai đặt tên là **`wishes`**, tạo dòng tiêu đề (Dòng 1):
   - **Cột A:** `timestamp` (Thời gian)
   - **Cột B:** `from_name` (Người gửi)
   - **Cột C:** `anonymous` (`TRUE` hoặc `FALSE`)
   - **Cột D:** `to` (Điền `ALL` nếu là lời chúc chung, hoặc điền `id` của chị em trong tab `people`)
   - **Cột E:** `text` (Nội dung lời chúc)
   - **Cột F:** `status` (Điền `approved` để hiển thị trên web, hoặc `pending`/`rejected`)
   - **Cột G:** `color` (Mã màu HEX cho quả bóng, ví dụ: `#8C2F4B`, `#C9A66B`)

---

## Bước 2: Dán Code vào Apps Script

1. Trong Google Sheet, chọn menu **Tiện ích mở rộng (Extensions)** > **Apps Script**.
2. Xóa toàn bộ mã mặc định và copy toàn bộ nội dung từ file [`google-apps-script/Code.gs`](./Code.gs) dán vào.
3. Thay giá trị `SPREADSHEET_ID` bằng ID bảng tính của bạn (chuỗi nằm giữa `/d/` và `/edit` trên thanh URL), hoặc để trống nếu script nằm cùng file Sheet.
4. Nhấn biểu tượng **Lưu (Save)** (Ctrl+S hoặc Cmd+S).

---

## Bước 3: Triển Khai Web App (Deploy)

1. Nhấn nút xanh **Triển khai (Deploy)** ở góc trên bên phải > **Tùy chọn triển khai mới (New deployment)**.
2. Chọn loại: **Ứng dụng web (Web app)**:
   - **Mô tả:** `Web chúc mừng 20/10 v2`
   - **Thực thi dưới dạng (Execute as):** `Tôi (Me)`
   - **Người có quyền truy cập (Who has access):** `Bất kỳ ai (Anyone)` *(Quan trọng!)*
3. Nhấn **Triển khai (Deploy)**. Nếu Google hỏi cấp quyền (Review Permissions), chọn tài khoản của bạn > Nâng cao (Advanced) > Đến dự án (Go to project unsafe) > Cho phép (Allow).
4. Sao chép đường dẫn **URL ứng dụng web** (có dạng `https://script.google.com/macros/s/AKfycb.../exec`).
5. Dán URL này vào biến `APPS_SCRIPT_URL` trong file `src/api.js`.

---

## Quy Trình Duyệt Lời Chúc Của Admin

1. Khi anh em gửi lời chúc mới qua Form trên web, một dòng mới tự động thêm vào tab `wishes` với `status: pending`.
2. Admin mở Google Sheet, kiểm tra nội dung:
   - Nếu lời chúc văn minh, ấm áp: Đổi cột `status` từ `pending` thành **`approved`**.
   - Nếu không phù hợp: Đổi thành `rejected`.
3. Trang web sẽ tự động cập nhật lời chúc mới trong lần tải tiếp theo!
