const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const srcDir = path.resolve(__dirname, '../web/out');
const destDir = path.resolve(__dirname, '../../HOSTING_CUA_THAY_DEPLOY');
const zipFile = path.resolve(__dirname, '../../HOSTING_CUA_THAY_DEPLOY.zip');

console.log('1. Copying from', srcDir, 'to', destDir);
if (fs.existsSync(destDir)) {
  fs.rmSync(destDir, { recursive: true, force: true });
}
fs.mkdirSync(destDir, { recursive: true });

// Copy all files recursively
function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

copyRecursiveSync(srcDir, destDir);
console.log('✓ Copied web/out successfully.');

// 2. Tạo file config.js
const configJsContent = `/**
 * CẤU HÌNH KẾT NỐI API & DATABASE CHO WEBSITE (HOSTING TRƯỜNG / THẦY)
 * Bạn có thể mở file này chỉnh sửa trực tiếp mà không cần build lại code!
 */
window.__APP_CONFIG__ = {
  // 1. Địa chỉ Backend API Wispbyte
  // - Nếu dùng Proxy PHP trên cùng hosting (khuyên dùng để tránh lỗi Mixed Content chặn HTTP): "./api_proxy.php"
  // - Hoặc nhập thẳng URL Wispbyte nếu bạn có: "http://78.154.183.38:11199/api/v1"
  API_URL: "./api_proxy.php",

  // 2. Neon Cloud Database Endpoint (HTTPS - Không bao giờ bị chặn Mixed Content)
  NEON_SQL_ENDPOINT: "https://ep-silent-heart-b5tbjmh7.c-7.us-east-2.aws.neon.tech/sql",

  // 3. Thông tin dự án
  APP_NAME: "Sân Nhà FC - Buôn Ma Thuột",
  AUTHOR: "Kpa Trần Quang Thịnh & Lê Duy Tài",
  VERSION: "2.0-Production"
};
`;
fs.writeFileSync(path.join(destDir, 'config.js'), configJsContent, 'utf8');
console.log('✓ Created config.js');

// 3. Tạo file api_proxy.php
const apiProxyPhpContent = `<?php
/**
 * ⚡ API PROXY & NEON DATABASE BRIDGE (CHUYỂN TIẾP THÔNG MINH CHO HOSTING TRƯỜNG)
 * Đề tài: Quản lý đặt sân bóng đá mini Buôn Ma Thuột - Sân Nhà FC
 * Nhóm: Kpa Trần Quang Thịnh & Lê Duy Tài
 *
 * TÁC DỤNG:
 * 1. Chống lỗi 'Mixed Content' khi web chạy HTTPS trên hosting trường nhưng Wispbyte chạy HTTP IP.
 * 2. Tự động chuyển tiếp yêu cầu đến Wispbyte Container: http://78.154.183.38:11199/api/v1
 * 3. Tự động dự phòng truy vấn trực tiếp Neon Cloud Database nếu Wispbyte đang tắt!
 */

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if (\$_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 1. Cấu hình Backend Wispbyte & Neon DB
\$WISPBYTE_BACKEND = "http://78.154.183.38:11199/api/v1";
\$NEON_SQL_ENDPOINT = "https://ep-silent-heart-b5tbjmh7.c-7.us-east-2.aws.neon.tech/sql";
\$NEON_DB_CONNECTION = "postgresql://neondb_owner:npg_Y76lDyzLaGkZ@ep-silent-heart-b5tbjmh7-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require";

// Lấy endpoint path
\$path = isset(\$_GET['path']) ? \$_GET['path'] : '';
if (empty(\$path) && isset(\$_SERVER['PATH_INFO'])) {
    \$path = \$_SERVER['PATH_INFO'];
}
\$path = ltrim(\$path, '/');

\$method = \$_SERVER['REQUEST_METHOD'];
\$body = file_get_contents('php://input');
\$headers = [
    'Content-Type: application/json',
    'Accept: application/json'
];

if (isset(\$_SERVER['HTTP_AUTHORIZATION'])) {
    \$headers[] = 'Authorization: ' . \$_SERVER['HTTP_AUTHORIZATION'];
}

// 2. Thử gọi đến Wispbyte trước
\$targetUrl = rtrim(\$WISPBYTE_BACKEND, '/') . '/' . \$path;

\$ch = curl_init(\$targetUrl);
curl_setopt(\$ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt(\$ch, CURLOPT_CUSTOMREQUEST, \$method);
curl_setopt(\$ch, CURLOPT_HTTPHEADER, \$headers);
curl_setopt(\$ch, CURLOPT_TIMEOUT, 6); // Timeout 6s
curl_setopt(\$ch, CURLOPT_CONNECTTIMEOUT, 4);
if (!empty(\$body)) {
    curl_setopt(\$ch, CURLOPT_POSTFIELDS, \$body);
}

\$response = curl_exec(\$ch);
\$httpCode = curl_getinfo(\$ch, CURLINFO_HTTP_CODE);
\$curlError = curl_error(\$ch);
curl_close(\$ch);

// Nếu Wispbyte phản hồi hợp lệ (kể cả lỗi validation 4xx, 2xx)
if (\$response !== false && \$httpCode >= 200 && \$httpCode < 500) {
    http_response_code(\$httpCode);
    echo \$response;
    exit;
}

// 3. Nếu Wispbyte không phản hồi hoặc lỗi mạng: FALLBACK TRỰC TIẾP NEON CLOUD DATABASE!
if (strpos(\$path, 'fields') !== false || empty(\$path)) {
    \$query = "SELECT f.*, COALESCE(json_agg(p.*) FILTER (WHERE p.id IS NOT NULL), '[]') as pitches FROM fields f LEFT JOIN pitches p ON f.id = p.field_id WHERE f.status = 'ACTIVE' GROUP BY f.id ORDER BY f.id ASC;";
    \$neonPayload = json_encode(['query' => \$query]);

    \$neonCh = curl_init(\$NEON_SQL_ENDPOINT);
    curl_setopt(\$neonCh, CURLOPT_RETURNTRANSFER, true);
    curl_setopt(\$neonCh, CURLOPT_POST, true);
    curl_setopt(\$neonCh, CURLOPT_POSTFIELDS, \$neonPayload);
    curl_setopt(\$neonCh, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Neon-Connection-String: ' . \$NEON_DB_CONNECTION
    ]);
    curl_setopt(\$neonCh, CURLOPT_TIMEOUT, 8);
    \$neonRes = curl_exec(\$neonCh);
    \$neonCode = curl_getinfo(\$neonCh, CURLINFO_HTTP_CODE);
    curl_close(\$neonCh);

    if (\$neonRes !== false && \$neonCode >= 200 && \$neonCode < 300) {
        \$neonJson = json_decode(\$neonRes, true);
        if (isset(\$neonJson['rows'])) {
            echo json_encode(\$neonJson['rows']);
            exit;
        }
    }
}

// Lỗi chung khi Wispbyte không bật và không có route fallback
http_response_code(502);
echo json_encode([
    'status' => 'error',
    'message' => 'Không thể kết nối Backend Wispbyte (' . (\$curlError ?: 'Connection refused') . '). Vui lòng kiểm tra container Wispbyte.',
    'neon_fallback' => 'Database Neon Cloud sẵn sàng.'
]);
`;
fs.writeFileSync(path.join(destDir, 'api_proxy.php'), apiProxyPhpContent, 'utf8');
console.log('✓ Created api_proxy.php');

// 4. Tạo file .htaccess cho Apache / cPanel
const htaccessContent = `<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # Định tuyến /api/... sang api_proxy.php
  RewriteRule ^api/(.*)$ api_proxy.php?path=$1 [QSA,L]

  # Phục vụ file và thư mục thực tế nếu có
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]

  # Tự động trỏ các trang HTML tĩnh (admin, booking, lookup, cv)
  RewriteCond %{REQUEST_FILENAME}.html -f
  RewriteRule ^(.*)$ $1.html [L]

  # Single Page Application fallback về index.html
  RewriteRule ^ index.html [L]
</IfModule>

# Cấu hình CORS
<IfModule mod_headers.c>
  Header set Access-Control-Allow-Origin "*"
  Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
  Header set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With"
</IfModule>

# Nén Gzip tăng tốc độ tải trang
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>
`;
fs.writeFileSync(path.join(destDir, '.htaccess'), htaccessContent, 'utf8');
console.log('✓ Created .htaccess');

// 5. Tạo file Hướng dẫn sử dụng
const readmeContent = `# 🚀 HƯỚNG DẪN TRIỂN KHAI LÊN HOSTING CỦA THẦY / TRƯỜNG (cPanel, DirectAdmin, Apache)
> **Đồ án:** Quản lý đặt sân bóng đá mini Buôn Ma Thuột - Sân Nhà FC  
> **Sinh viên thực hiện:** Kpa Trần Quang Thịnh & Lê Duy Tài  
> **Lớp:** IT24M &bull; **Trường:** Đại học Đông Á  

---

## 📂 1. THƯ MỤC NÀY DÙNG ĐỂ LÀM GÌ?
Thư mục **\`HOSTING_CUA_THAY_DEPLOY\`** (và file nén **\`HOSTING_CUA_THAY_DEPLOY.zip\`**) chứa toàn bộ mã nguồn Frontend đã được đóng gói hoàn chỉnh, kèm theo các cấu hình thông minh:
- **Tự động kết nối cơ sở dữ liệu Neon Cloud Database**.
- **Tự động kết nối máy chủ Backend Wispbyte** (thông qua \`api_proxy.php\` để tránh lỗi Mixed Content chặn HTTP trên HTTPS).
- **Cấu hình \`.htaccess\`** giúp các trang quản trị (\`/admin\`), tra cứu vé (\`/lookup\`), hồ sơ năng lực (\`/cv\`) tải mượt mà không bị lỗi 404.

---

## 🛠️ 2. CÁC BƯỚC UPLOAD LÊN HOSTING CỦA THẦY (3 BƯỚC)

### BƯỚC 1: Đăng nhập vào Hosting Web của trường/thầy
1. Mở trang quản trị Hosting (cPanel / DirectAdmin / Plesk / CyberPanel).
2. Tìm và bấm vào biểu tượng **File Manager** (Trình quản lý tệp).
3. Truy cập vào thư mục web chính: **\`public_html\`** (hoặc thư mục con nếu thầy phân chia thư mục riêng cho bạn).

### BƯỚC 2: Upload và Giải nén
1. Bấm nút **Upload** (Tải lên) trên thanh công cụ của File Manager.
2. Chọn file **\`HOSTING_CUA_THAY_DEPLOY.zip\`** từ máy tính của bạn và tải lên.
3. Khi tải lên xong 100%, quay lại File Manager, nhấp chuột phải vào file **\`HOSTING_CUA_THAY_DEPLOY.zip\`** $\\rightarrow$ chọn **Extract** (Giải nén).
4. Bạn sẽ thấy ngay các file:
   - \`index.html\` (Trang chủ Sân Nhà FC)
   - \`_next/\` (Toàn bộ CSS & JS giao diện)
   - \`admin/\`, \`lookup/\`, \`booking/\`, \`cv/\`
   - \`config.js\` (File cấu hình)
   - \`api_proxy.php\` (Cầu nối Wispbyte & Neon)
   - \`.htaccess\`

### BƯỚC 3: Mở trình duyệt và kiểm tra
1. Mở tên miền của bạn do thầy/trường cấp (Ví dụ: \`https://sv-thinh.donga.edu.vn\` hoặc tên miền hosting của bạn).
2. Hệ thống sẽ hiển thị giao diện Sân Nhà FC đầy đủ:
   - Danh sách 21 cụm sân bóng Buôn Ma Thuột.
   - Bảng giá, ca thi đấu sáng - chiều - tối.
   - Tính năng Đăng nhập / Đăng ký (Đồng bộ trực tiếp lên Neon Cloud).
   - Tra cứu đặt sân và xem CV.

---

## ⚙️ 3. CÁCH ĐỔI ĐỊA CHỈ WISPBYTE (NẾU CẦN)
Nếu sau này bạn đổi container trên Wispbyte sang IP hoặc cổng khác:
1. Mở file **\`config.js\`** trên hosting.
2. Sửa dòng \`API_URL\` thành địa chỉ mới:
   \`\`\`javascript
   API_URL: "http://IP-MOI:PORT/api/v1"
   \`\`\`
3. Mở file **\`api_proxy.php\`**, sửa biến \`\$WISPBYTE_BACKEND\` thành địa chỉ mới:
   \`\`\`php
   \$WISPBYTE_BACKEND = "http://IP-MOI:PORT/api/v1";
   \`\`\`
4. Bấm **Save** là xong ngay, **không cần phải build hay biên dịch lại code**!
`;

fs.writeFileSync(path.join(destDir, 'HUONG_DAN_UP_LEN_HOSTING_THAY.md'), readmeContent, 'utf8');
fs.writeFileSync(path.join(destDir, 'HUONG_DAN_UP_LEN_HOSTING_THAY.txt'), readmeContent, 'utf8');
console.log('✓ Created deployment guides.');

// 6. Nén thành file zip HOSTING_CUA_THAY_DEPLOY.zip
try {
  if (fs.existsSync(zipFile)) fs.unlinkSync(zipFile);
  const cmd = `powershell -Command "Compress-Archive -Path '${destDir}\\*' -DestinationPath '${zipFile}' -Force"`;
  execSync(cmd, { stdio: 'inherit' });
  const stat = fs.statSync(zipFile);
  console.log('✓ Created zip archive:', zipFile, '(' + Math.round(stat.size / 1024) + ' KB)');
} catch (err) {
  console.warn('Zip warning:', err.message);
}
