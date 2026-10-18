/**
 * Google Apps Script Backend cho Web 20/10 Cinematic
 * Triển khai: Deploy > New Deployment > Web app > Execute as: Me > Who has access: Anyone
 */

// Thay SPREADSHEET_ID bằng ID Google Sheet thực tế của bạn
const SPREADSHEET_ID = "YOUR_SPREADSHEET_ID_HERE";

function getSpreadsheet() {
  if (SPREADSHEET_ID === "YOUR_SPREADSHEET_ID_HERE" || !SPREADSHEET_ID) {
    return SpreadsheetApp.getActiveSpreadsheet();
  }
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function normalizeDriveUrl(url) {
  if (!url) return "";
  const str = String(url).trim();
  const match = str.match(/\/d\/([a-zA-Z0-9_-]+)/) || str.match(/id=([a-zA-Z0-9_-]+)/);
  if (match && (str.indexOf("drive.google.com") !== -1 || str.indexOf("docs.google.com") !== -1)) {
    return "https://lh3.googleusercontent.com/d/" + match[1];
  }
  return str;
}

function doGet(e) {
  try {
    const action = e.parameter.action;
    const ss = getSpreadsheet();

    // 1. Lấy danh sách chị em (không trả về cột mã PIN để bảo mật tuyệt đối)
    if (action === "people") {
      const sheet = ss.getSheetByName("people");
      if (!sheet) return createJsonResponse({ success: false, message: "Sheet 'people' not found" });
      
      const data = sheet.getDataRange().getValues();
      if (data.length <= 1) return createJsonResponse({ success: true, data: [] });

      const rows = data.slice(1);
      const people = rows
        .filter(r => r[0]) // Phải có id
        .map(r => ({
          id: String(r[0]).trim().toLowerCase(),
          name: String(r[1]).trim(),
          dept: String(r[2] || "").trim(),
          role: String(r[3] || "").trim(),
          photo: r[6] ? normalizeDriveUrl(r[4]) : "", // Chỉ trả URL ảnh khi has_consent = TRUE
          has_consent: Boolean(r[6])
        }));

      return createJsonResponse({ success: true, data: people });
    }

    // 2. Lấy lời chúc công khai (to = ALL & status = approved)
    if (action === "public") {
      const sheet = ss.getSheetByName("wishes");
      if (!sheet) return createJsonResponse({ success: false, message: "Sheet 'wishes' not found" });

      const data = sheet.getDataRange().getValues();
      if (data.length <= 1) return createJsonResponse({ success: true, data: [] });

      const rows = data.slice(1);
      const publicWishes = rows
        .filter(r => String(r[3]).trim().toUpperCase() === "ALL" && String(r[5]).trim().toLowerCase() === "approved")
        .map((r, idx) => ({
          id: idx + 1,
          from_name: r[2] ? "Đồng nghiệp ẩn danh" : String(r[1]).trim(),
          dept: r[7] ? String(r[7]).trim() : "Engineering & Product Team",
          text: String(r[4]).trim(),
          color: r[6] ? String(r[6]).trim() : "#C9A66B",
          timestamp: r[0]
        }));

      return createJsonResponse({ success: true, data: publicWishes });
    }

    // 3. Lấy lời chúc riêng tư (Yêu cầu id + pin khớp chính xác)
    if (action === "private") {
      const id = String(e.parameter.id || "").trim().toLowerCase();
      const pin = String(e.parameter.pin || "").trim();

      if (!id || !pin) {
        return createJsonResponse({ success: false, message: "Thiếu thông tin xác thực" });
      }

      const pSheet = ss.getSheetByName("people");
      if (!pSheet) return createJsonResponse({ success: false, message: "Sheet 'people' not found" });
      
      const pData = pSheet.getDataRange().getValues().slice(1);
      const matchedPerson = pData.find(r => 
        String(r[0]).trim().toLowerCase() === id && 
        String(r[5]).trim() === pin
      );

      if (!matchedPerson) {
        return createJsonResponse({ success: false, message: "Mã PIN không chính xác" });
      }

      const wSheet = ss.getSheetByName("wishes");
      if (!wSheet) return createJsonResponse({ success: true, data: [] });

      const wData = wSheet.getDataRange().getValues().slice(1);
      const privateWishes = wData
        .filter(r => 
          String(r[3]).trim().toLowerCase() === id && 
          String(r[5]).trim().toLowerCase() === "approved"
        )
        .map((r, idx) => ({
          id: idx + 1,
          from_name: r[2] ? "Một người bạn ẩn danh" : String(r[1]).trim(),
          dept: r[7] ? String(r[7]).trim() : "Đồng nghiệp thân thiết",
          text: String(r[4]).trim(),
          timestamp: r[0]
        }));

      return createJsonResponse({
        success: true,
        recipient_name: String(matchedPerson[1]),
        data: privateWishes
      });
    }

    return createJsonResponse({ success: false, message: "Hành động không hợp lệ" });
  } catch (error) {
    return createJsonResponse({ success: false, message: error.toString() });
  }
}

function doPost(e) {
  try {
    let payload;
    try {
      payload = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      payload = e.parameter;
    }

    // Chống bot spam qua honeypot field
    if (payload.honeypot && String(payload.honeypot).trim() !== "") {
      return createJsonResponse({ success: true, message: "Lời chúc đã được tiếp nhận" });
    }

    const from_name = String(payload.from_name || "Ẩn danh").trim();
    const dept = String(payload.dept || "Engineering & Product Team").trim();
    const is_anonymous = Boolean(payload.anonymous);
    const to = String(payload.to || "ALL").trim().toLowerCase();
    const text = String(payload.text || "").trim().substring(0, 300);

    if (!text) {
      return createJsonResponse({ success: false, message: "Nội dung lời chúc không được để trống" });
    }

    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName("wishes");
    if (!sheet) {
      return createJsonResponse({ success: false, message: "Sheet 'wishes' chưa được tạo" });
    }

    // Append row với trạng thái 'pending' chờ admin duyệt
    sheet.appendRow([
      new Date(),
      from_name,
      is_anonymous,
      to,
      text,
      "pending", // Cần admin chuyển thành 'approved'
      payload.color || "#C9A66B",
      dept
    ]);

    return createJsonResponse({
      success: true,
      message: "Cảm ơn bạn! Lời chúc đã được gửi và sẽ hiển thị sau khi admin kiểm duyệt."
    });
  } catch (error) {
    return createJsonResponse({ success: false, message: error.toString() });
  }
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
