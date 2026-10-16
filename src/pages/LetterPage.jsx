import React from 'react';
import { useApp } from '../context/AppContext.jsx';
import FloralWreathBorder from '../components/FloralWreathBorder.jsx';
import defaultSisterPhoto from '../assets/images.jpg';

export default function LetterPage() {
  const { selectedSister, navigateWithFlowerTransition } = useApp();

  // Thông tin chị em được vinh danh (ưu tiên dữ liệu từ context)
  const sisterName = selectedSister ? selectedSister.name : 'Nguyễn Thị Lan Anh';
  const roleText = (selectedSister && (selectedSister.role || selectedSister.dept)) || 'PRODUCT MANAGER';
  
  // Mock ảnh chân dung người thật: Ưu tiên ảnh của chị nếu có consent, mặc định là images.jpg người dùng vừa tải về!
  const photoUrl = (selectedSister && selectedSister.has_consent && selectedSister.photo)
    ? selectedSister.photo
    : defaultSisterPhoto;

  // Câu quote vinh danh ấm áp
  const sisterQuote = selectedSister?.quote || '“Nụ cười của bạn là ánh sáng của cả văn phòng”';

  return (
    <div className="page-screen letter-page-screen" id="page-letter">
      {/* KHÔNG GIAN BỐI CẢNH HOÀNG GIA: TẤM THIỆP ĐÔI 3D ĐANG MỞ RỘNG */}
      <div className="bifold-scene-container">
        <div className="bifold-booklet">
          {/* CON DẤU SÁP HOÀNG GIA 20.10 ĐÍNH TRANG TRỌNG TRÊN GÁY THIỆP */}
          <div className="royal-wax-seal" title="Dấu sáp niêm phong hoàng gia 20/10">
            <span className="wax-number">20.10</span>
          </div>

          {/* =========================================================
              TRANG BÊN TRÁI (LEFT PAGE): KHUNG ẢNH CHÂN DUNG & THÔNG TIN BÊN DƯỚI
              ========================================================= */}
          <div className="bifold-page bifold-page-left">
            <div className="page-inner-content">
              {/* Dải danh xưng kiêu sa trên đầu trang */}
              <div className="muse-crown-ribbon">
                👑 NÀNG THƠ TECHCORP
              </div>

              {/* KHUNG ẢNH CHÂN DUNG BỌC GIÀN HOA BOTANICAL UỐN LƯỢN */}
              <div className="portrait-botanical-wrapper">
                {/* GIÀN CÀNH HOA UỐN LƯỢN CỰC ĐẸP BỌC XUNG QUANH */}
                <FloralWreathBorder />

                {/* KHUNG ẢNH CHÂN DUNG THỰC TẾ (SẠCH SẼ, KHÔNG BỊ CHỮ ĐÈ LÊN MẶT) */}
                <div className="portrait-display-frame">
                  <img
                    src={photoUrl}
                    alt={sisterName}
                    className="portrait-display-img"
                    onError={(e) => {
                      e.currentTarget.src = '/images.jpg';
                    }}
                  />
                  {/* Viền sáng bóng kính mờ nhẹ */}
                  <div className="portrait-glass-shine"></div>
                </div>
              </div>

              {/* KHỐI THÔNG TIN VINH DANH: ĐẶT BÊN DƯỚI ẢNH (BÊN NGOÀI ẢNH) */}
              <div className="portrait-below-details">
                {/* Tag chức danh màu đỏ nhung viền vàng */}
                <div className="portrait-badge-role">
                  {roleText}
                </div>

                {/* Tên chị em to, sắc nét, màu đỏ rượu vang quý phái */}
                <h2 className="portrait-full-name">
                  {sisterName}
                </h2>

                {/* Câu trích dẫn tri ân ngọt ngào */}
                <p className="portrait-quote-italic">
                  {sisterQuote}
                </p>
              </div>
            </div>
          </div>

          {/* ĐƯỜNG NẾP GẤP VÀ BÓNG ĐỔ SÂU 3D Ở GÁY THIỆP (CARD CREASE DEPTH SHADOW) */}
          <div className="bifold-crease-divider">
            <div className="crease-shadow-left"></div>
            <div className="crease-center-line"></div>
            <div className="crease-shadow-right"></div>
          </div>

          {/* =========================================================
              TRANG BÊN PHẢI (RIGHT PAGE): BỨC THƯ TRI ÂN VIẾT TAY TỪ CÁNH NAM IT
              ========================================================= */}
          <div className="bifold-page bifold-page-right">
            <div className="page-inner-content letter-reading-area">
              {/* Dòng đề mục nhỏ */}
              <div className="letter-eyebrow-accent">
                <span className="eyebrow-dash"></span>
                <span>THƯ TRI ÂN CHUNG TỪ CÁNH NAM IT</span>
                <span className="eyebrow-dash"></span>
              </div>

              {/* Tiêu đề chính trang trọng */}
              <h1 className="letter-honor-title">
                Gửi những người phụ nữ tuyệt vời nhất TechCorp!
              </h1>

              {/* Thư viết tay trên nền giấy da ngà viền chỉ vàng */}
              <div className="parchment-text-card">
                <p className="parchment-lead">
                  Nhân ngày 20/10, toàn thể anh em khối Công nghệ &amp; Sản phẩm xin gửi tới chị em lời chúc bình an, hạnh phúc và tràn đầy năng lượng rạng rỡ.
                </p>

                <p className="parchment-body">
                  Cảm ơn các chị em vì đã luôn kiên nhẫn đồng hành cùng những dòng code khô khan, làm dịu đi những đợt sprint căng thẳng bằng sự tận tâm, tinh tế và nụ cười ấm áp mỗi ngày.
                </p>
              </div>

              {/* Lời chúc kết & Chữ ký trang trọng */}
              <div className="letter-bottom-sign">
                <div className="letter-warm-sparkle">
                  Chúc bạn mãi tự tin và toả sáng! 💐
                </div>
                <div className="letter-gentlemen-sign">
                  — Toàn thể anh em Tech &amp; Product
                </div>
              </div>

              {/* Nút hành động đến Bầu Trời Bóng Bay */}
              <div className="letter-next-action">
                <button
                  onClick={() => navigateWithFlowerTransition('/balloons')}
                  className="btn-golden-rose"
                  id="btn-goto-balloons"
                  title="Đến màn Bầu trời bóng bay chứa hàng chục lời chúc chân thành"
                >
                  <span>Đến Bầu Trời Bóng Bay Lời Chúc 🎈</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
