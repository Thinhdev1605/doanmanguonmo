/**
 * CẤU HÌNH KẾT NỐI API & DATABASE CHO WEBSITE
 * - Chạy ở máy (localhost): Tự động kết nối Backend localhost:3000
 * - Chạy trên Hosting trường/thầy: Tự động dùng ./api_proxy.php (tránh Mixed Content)
 */
(function() {
  var isLocal = typeof window !== "undefined" && (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === ""
  );

  window.__APP_CONFIG__ = {
    // 1. Địa chỉ Backend API: Localhost nếu chạy trên máy; api_proxy.php nếu chạy trên hosting trường
    API_URL: isLocal ? "http://localhost:3000/api/v1" : "./api_proxy.php",

    // 2. Neon Cloud Database Endpoint
    NEON_SQL_ENDPOINT: "https://ep-silent-heart-b5tbjmh7.c-7.us-east-2.aws.neon.tech/sql",

    // 3. Thông tin dự án
    APP_NAME: "Sân Nhà FC - Buôn Ma Thuột",
    AUTHOR: "Kpa Trần Quang Thịnh & Lê Duy Tài"
  };
})();
