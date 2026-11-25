/**
 * CẤU HÌNH KẾT NỐI API & DATABASE CHO WEBSITE (HOSTING TRƯỜNG / THẦY)
 * Bạn có thể mở file này chỉnh sửa trực tiếp mà không cần build lại code!
 */
window.__APP_CONFIG__ = {
  // 1. Địa chỉ Backend API Wispbyte
  // - Nếu dùng Proxy PHP trên cùng hosting (khuyên dùng để tránh chặn Mixed Content): "./api_proxy.php"
  // - Hoặc nhập thẳng IP/Domain Wispbyte: "http://78.154.183.38:11199/api/v1"
  API_URL: "./api_proxy.php",

  // 2. Neon Cloud Database Endpoint
  NEON_SQL_ENDPOINT: "https://ep-silent-heart-b5tbjmh7.c-7.us-east-2.aws.neon.tech/sql",

  // 3. Thông tin dự án
  APP_NAME: "Sân Nhà FC - Buôn Ma Thuột",
  AUTHOR: "Kpa Trần Quang Thịnh & Lê Duy Tài"
};
