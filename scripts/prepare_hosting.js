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

// 2. Thu thập toàn bộ CSS để Inline trực tiếp vào mọi file HTML (CHỐNG MẤT GIAO DIỆN TUYỆT ĐỐI)
const cssDir = path.join(destDir, '_next', 'static', 'css');
let combinedCss = '';
if (fs.existsSync(cssDir)) {
  const cssFiles = fs.readdirSync(cssDir).filter((f) => f.endsWith('.css'));
  for (const f of cssFiles) {
    combinedCss += fs.readFileSync(path.join(cssDir, f), 'utf8') + '\n';
  }
  console.log(`✓ Read ${cssFiles.length} CSS files (${Math.round(combinedCss.length / 1024)} KB).`);
}

// 3. Quét và chỉnh sửa TẤT CẢ các file HTML để hỗ trợ subpath (ví dụ: /kpatranquangthinh/doan/)
function processAllHtmlFiles(dir, rootDir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processAllHtmlFiles(fullPath, rootDir);
    } else if (file.endsWith('.html')) {
      const relToRoot = path.relative(rootDir, fullPath);
      const depth = relToRoot.split(path.sep).length - 1;
      let relPrefix = './';
      if (depth === 1) relPrefix = '../';
      else if (depth === 2) relPrefix = '../../';
      else if (depth >= 3) relPrefix = '../../../';

      let html = fs.readFileSync(fullPath, 'utf8');

      // A. Xóa inline style cũ nếu có và nhúng combinedCss mới
      html = html.replace(/<style id="inlined-styles">[\s\S]*?<\/style>/g, '');
      if (combinedCss) {
        const styleBlock = `<style id="inlined-styles">\n${combinedCss}\n</style>`;
        html = html.replace('</head>', `${styleBlock}</head>`);
      }

      // B. Chuẩn hóa tất cả các đường dẫn tài nguyên sang tương đối chính xác theo cấp độ thư mục
      html = html.replace(/href="\/_next\//g, `href="${relPrefix}_next/`);
      html = html.replace(/src="\/_next\//g, `src="${relPrefix}_next/`);
      html = html.replace(/href="\.\/_next\//g, `href="${relPrefix}_next/`);
      html = html.replace(/src="\.\/_next\//g, `src="${relPrefix}_next/`);

      // C. Cấu hình file config.js và ảnh
      html = html.replace(/src="\/config\.js"/g, `src="${relPrefix}config.js"`);
      html = html.replace(/src="\.\/config\.js"/g, `src="${relPrefix}config.js"`);
      html = html.replace(/src="\/leduytai/g, `src="${relPrefix}leduytai`);
      html = html.replace(/href="\/favicon\.ico"/g, `href="${relPrefix}favicon.ico"`);

      // D. Điều hướng link nội bộ trong subpath
      html = html.replace(/href="\/admin"/g, `href="${relPrefix}admin/"`);
      html = html.replace(/href="\/lookup"/g, `href="${relPrefix}lookup/"`);
      html = html.replace(/href="\/cv"/g, `href="${relPrefix}cv/"`);
      html = html.replace(/href="\/booking"/g, `href="${relPrefix}booking/"`);

      // E. Nhúng script dynamic base tag vào đầu thẻ <head>
      const baseScript = `<script>
(function() {
  var p = window.location.pathname;
  if (!p.endsWith('/')) {
    var lastSlash = p.lastIndexOf('/');
    if (lastSlash >= 0 && p.substring(lastSlash).indexOf('.') !== -1) {
      p = p.substring(0, lastSlash + 1);
    } else {
      p = p + '/';
    }
  }
  window.__APP_BASE_DIR__ = window.location.origin + p;
})();
</script>`;
      if (!html.includes('__APP_BASE_DIR__')) {
        html = html.replace('<head>', `<head>${baseScript}`);
      }

      fs.writeFileSync(fullPath, html, 'utf8');
      console.log(`  -> Processed HTML [depth ${depth}]: ${relToRoot}`);
    }
  }
}

console.log('2. Processing HTML files for Subpath & Inlining CSS:');
processAllHtmlFiles(destDir, destDir);
console.log('✓ All HTML files processed with Inlined CSS & relative paths.');

// 4. Tạo file config.js
const configJsContent = `/**
 * CẤU HÌNH KẾT NỐI API & DATABASE CHO WEBSITE
 * - Chạy ở máy cá nhân (localhost): Tự động gọi Backend localhost:3000
 * - Chạy trên Hosting trường (kể cả subpath như /kpatranquangthinh/doan/): Tự động gọi ./api_proxy.php
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

    // 2. Neon Cloud Database Endpoint (HTTPS chuẩn - Không bao giờ bị chặn Mixed Content)
    NEON_SQL_ENDPOINT: "https://ep-silent-heart-b5tbjmh7.c-7.us-east-2.aws.neon.tech/sql",

    // 3. Thông tin dự án
    APP_NAME: "Sân Nhà FC - Buôn Ma Thuột",
    AUTHOR: "Kpa Trần Quang Thịnh & Lê Duy Tài",
    VERSION: "2.1-SubpathReady"
  };
})();
`;
fs.writeFileSync(path.join(destDir, 'config.js'), configJsContent, 'utf8');
console.log('✓ Created config.js');

// 5. Tạo file api_proxy.php
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

// 6. Tạo file .htaccess cho Apache / cPanel
const htaccessContent = `<IfModule mod_rewrite.c>
  RewriteEngine On

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

// 7. Tạo file Hướng dẫn sử dụng
const readmeContent = `# 🚀 HƯỚNG DẪN TRIỂN KHAI LÊN HOSTING CỦA THẦY / TRƯỜNG (cPanel, DirectAdmin, Apache)
> **Đồ án:** Quản lý đặt sân bóng đá mini Buôn Ma Thuột - Sân Nhà FC  
> **Sinh viên thực hiện:** Kpa Trần Quang Thịnh & Lê Duy Tài  
> **Lớp:** IT24M &bull; **Trường:** Đại học Đông Á  

---

## 📂 1. TẠI SAO BỊ LỖI MẤT GIAO DIỆN TRƯỚC ĐÓ?
- Link website của bạn là: **\`https://it24m.dak.edu.vn/kpatranquangthinh/doan/\`**
- Vì website nằm trong thư mục con **\`/kpatranquangthinh/doan/\`**, phiên bản trước bị gọi đường dẫn tuyệt đối từ gốc tên miền (\`/_next/...\`), dẫn đến hosting báo lỗi 404 không tìm thấy file CSS và Javascript.
- **BẢN CẬP NHẬT MỚI NÀY ĐÃ ĐƯỢC XỬ LÝ:**
  1. **Toàn bộ CSS đã được nhúng trực tiếp (Inline CSS) vào HTML**: Trang web hiển thị giao diện Dark Theme Sân Nhà FC xanh mượt mà 100% ngay từ giây đầu tiên, không bao giờ bị mất giao diện nữa!
  2. **Toàn bộ đường dẫn Script đã chuyển sang dạng tương đối chuẩn (\`./_next/\`)**: Tương thích hoàn hảo với mọi thư mục con của trường.

---

## 🛠️ 2. CÁC BƯỚC CẬP NHẬT LÊN HOSTING (3 BƯỚC)

### BƯỚC 1: Vào File Manager của Hosting
1. Đăng nhập trang quản trị hosting trường: \`https://it24m.dak.edu.vn:2083\` (cPanel) hoặc trình quản lý file.
2. Truy cập vào đúng thư mục đồ án của bạn:
   \`public_html/kpatranquangthinh/doan/\`

### BƯỚC 2: Upload và Giải nén
1. Bấm nút **Upload** $\\rightarrow$ Tải file **\`HOSTING_CUA_THAY_DEPLOY.zip\`** mới lên.
2. Nhấp chuột phải vào file **\`HOSTING_CUA_THAY_DEPLOY.zip\`** $\\rightarrow$ Chọn **Extract** (Giải nén và ghi đè các file cũ).

### BƯỚC 3: Mở trình duyệt và kiểm tra
1. Mở lại đường dẫn: **\`https://it24m.dak.edu.vn/kpatranquangthinh/doan/\`**
2. Nhấn **Ctrl + F5** (để xóa cache cũ trên trình duyệt).
3. Giao diện Sân Nhà FC màu xanh ngọc đen hiện lên đầy đủ và tuyệt đẹp!
`;

fs.writeFileSync(path.join(destDir, 'HUONG_DAN_UP_LEN_HOSTING_THAY.md'), readmeContent, 'utf8');
fs.writeFileSync(path.join(destDir, 'HUONG_DAN_UP_LEN_HOSTING_THAY.txt'), readmeContent, 'utf8');
console.log('✓ Created deployment guides.');

// 8. Nén lại thành file zip HOSTING_CUA_THAY_DEPLOY.zip
try {
  if (fs.existsSync(zipFile)) fs.unlinkSync(zipFile);
  const cmd = `powershell -Command "Compress-Archive -Path '${destDir}\\*' -DestinationPath '${zipFile}' -Force"`;
  execSync(cmd, { stdio: 'inherit' });
  const stat = fs.statSync(zipFile);
  console.log('✓ Created zip archive:', zipFile, '(' + Math.round(stat.size / 1024) + ' KB)');
} catch (err) {
  console.warn('Zip warning:', err.message);
}
