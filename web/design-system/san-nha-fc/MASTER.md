# Design System Master File — Sân Nhà FC
## Phong cách: Stadium Emerald & Night Match (Sân Cỏ Đêm Thể Thao)

> **LOGIC:** Khi xây dựng và tùy chỉnh giao diện các trang, tham khảo hệ thống Design Tokens này làm quy chuẩn duy nhất (Single Source of Truth).

---

**Dự án:** Sân Nhà FC (Hệ Thống Đặt Sân Bóng Đá Mini & Cáp Kèo Buôn Ma Thuột)  
**Tiêu chuẩn áp dụng:** `ui-ux-pro-max` (Web/Next.js/React - Sports Booking Turf Experience)  
**Tông màu chủ đạo:** Emerald Turf Green (`#10b981`) trên nền OLED Stadium Slate (`#090e17`)

---

## 1. Bảng Màu Chuẩn (Color Tokens)

| Vai trò | Mã Hex / RGBA | CSS Variable | Ý nghĩa |
| :--- | :--- | :--- | :--- |
| **Primary (Màu sân cỏ)** | `#10b981` | `--primary` | Màu cỏ sân bóng, slot trống, nút hành động chính |
| **Primary Hover** | `#34d399` | `--primary-hover` | Hiệu ứng rê chuột sáng phát quang |
| **Primary Dark** | `#059669` | `--primary-dark` | Gradient bóng đổ sân cỏ |
| **Primary Light** | `rgba(16, 185, 129, 0.15)` | `--primary-light` | Nền thẻ badge và pill khả dụng |
| **Primary Glow** | `rgba(16, 185, 129, 0.45)` | `--primary-glow` | Hiệu ứng vòng hào quang quanh nút/card |
| **Gold (Giờ cao điểm & Cúp)**| `#f59e0b` | `--gold` | Huy hiệu giờ vàng, giải đấu, VIP |
| **Gold Hover / Text** | `#fbbf24` | `--gold-hover` | Văn bản nổi bật |
| **Danger / Booked (Đã kín)** | `#ef4444` | `--danger` | Slot đã có người đặt, cảnh báo hủy sân |
| **Danger Light** | `rgba(239, 68, 68, 0.15)` | `--danger-light` | Nền ô đã đặt (gạch chéo mờ) |
| **OLED Background** | `#090e17` | `--bg` | Nền đen than chì sâu thẳm, dịu mắt ban đêm |
| **Surface (Card Level 1)** | `#0f172a` | `--surface` | Khối thẻ chính (Slate cao cấp) |
| **Surface Alt (Card Level 2)**| `#162238` | `--surface-alt` | Ô slot giờ, dropdown, input field |
| **Glass Border** | `rgba(255, 255, 255, 0.08)`| `--border-light` | Viền kính tinh tế |
| **Border Active** | `rgba(16, 185, 129, 0.35)` | `--border-emerald`| Viền sáng sân cỏ khi active |
| **Text Main** | `#f8fafc` | `--text-main` | Chữ chính độ tương phản cao 14:1 |
| **Text Muted** | `#94a3b8` | `--text-muted` | Chữ phụ, địa chỉ, chú thích |

---

## 2. Typography & Font chữ

* **Headings (Tiêu đề):** `Plus Jakarta Sans` / `Cabinet Grotesk` (Weight: 800-900, `letter-spacing: -0.03em`)
* **Body / Data (Nội dung & Số liệu):** `Plus Jakarta Sans` (Weight: 500-700)
* **Số tiền & Giờ:** Chữ in đậm (`font-weight: 800`), font monospaced nhẹ nhàng hoặc tabular-nums để thẳng cột.

---

## 3. Quy chuẩn trạng thái Khung giờ (Interactive Slot Picker UX)

* **Trống / Có thể đặt (Available):**
  * Border: `1px solid rgba(16, 185, 129, 0.35)`
  * Nền: `rgba(16, 185, 129, 0.08)`
  * Chữ giá: `#34d399` (Xanh sáng nổi bật)
  * Hover: Nổi lên `translateY(-2px)`, viền xanh sáng rực `#10b981`, đổ bóng `0 6px 20px rgba(16, 185, 129, 0.3)`
* **Đang chọn (Selected):**
  * Nền: `linear-gradient(135deg, #10b981, #059669)`
  * Viền: `#34d399`
  * Chữ: Trắng tinh `#ffffff`
  * Glow: `0 8px 25px rgba(16, 185, 129, 0.5)`
* **Đã có người đặt (Booked):**
  * Nền: `rgba(239, 68, 68, 0.05)`
  * Viền: `rgba(239, 68, 68, 0.2)`
  * Chữ: `#ef4444`, gạch ngang nhẹ, con trỏ `cursor: not-allowed`
  * Badge: `ĐÃ ĐẶT` màu đỏ mờ

---

## 4. Pre-Delivery Checklist (Tiêu chí kiểm định theo ui-ux-pro-max)
- [x] Không dùng emoji thô làm icon giao diện chính; thay bằng ký hiệu hoặc huy hiệu chuẩn.
- [x] Thuộc tính `cursor: pointer` trên toàn bộ nút bấm, card, tab và ô chọn giờ.
- [x] Hiệu ứng chuyển động mượt mà `transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1)`.
- [x] Đạt chuẩn tương phản WCAG AA (độ tương phản văn bản tối thiểu 4.5:1, thực tế > 7:1).
- [x] Đáp ứng hoàn hảo trên màn hình Mobile (375px), Tablet (768px) và Desktop (1200px+).
