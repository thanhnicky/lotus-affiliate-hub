# Lotus Partner Hub

Tạo một web app affiliate portal cho đội ngũ cộng tác viên bán sản phẩm sơn Lotus.

Mục tiêu:

- CTV đăng ký và đăng nhập bằng email/password qua Supabase Auth.

- CTV mới có trạng thái pending.

- Chỉ CTV active mới được tạo affiliate link.

- CTV chỉ xem được dữ liệu của chính mình theo RLS.

- Tất cả CTV active được bán cả 4 landing page.

- CTV có thể chọn landing page, chọn kênh chia sẻ và nhập campaign tùy chọn.

- Gọi Supabase RPC create_affiliate_link để tạo link, không tự insert affiliate_id từ frontend.

Các trang cần tạo:

1. /login

2. /register

3. /pending

4. /dashboard

5. /create-link

6. /links

7. /profile

Phong cách:

- Premium, sạch, hiện đại.

- Màu chủ đạo lấy cảm hứng từ thương hiệu sơn Lotus.

- Responsive tốt trên mobile.

- Giao diện tiếng Việt.

- Ưu tiên UX đơn giản cho cộng tác viên không rành công nghệ.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://lotus-affiliate-hub.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/33337b8b-f0c4-46e2-b96c-71c8d508de0c).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## API Tracking Click (Giai đoạn A)

### Endpoint: `POST /api/affiliate/track-click`

Nhận event click affiliate từ 4 landing page chính thức của Lotus:
- `https://son-gia-go-tam-xi-mang.sonlotus.vn`
- `https://son-gia-go-kim-loai.sonlotus.vn`
- `https://son-kim-loai.sonlotus.vn`
- `https://son-go.sonlotus.vn`

### Lệnh curl kiểm tra OPTIONS (CORS Preflight):
```bash
curl -i -X OPTIONS "https://aff.sonlotus.vn/api/affiliate/track-click" \
  -H "Origin: https://son-go.sonlotus.vn" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type"
```

### Lệnh curl kiểm tra POST (Production với Origin hợp lệ):
```bash
curl -i -X POST "https://aff.sonlotus.vn/api/affiliate/track-click" \
  -H "Origin: https://son-go.sonlotus.vn" \
  -H "Content-Type: application/json" \
  -d '{
    "affiliate_code": "LOTUS-XXXXXX",
    "landing_page_url": "https://son-go.sonlotus.vn/",
    "campaign": "tet-2026",
    "visitor_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "utm_medium": "zalo",
    "utm_campaign": "tet-2026"
  }'
```

### Lệnh curl kiểm tra Local Development (với bypass test header):
```bash
curl -i -X POST "http://localhost:8080/api/affiliate/track-click" \
  -H "X-Tracking-Test: lotus-local-test" \
  -H "Content-Type: application/json" \
  -d '{
    "affiliate_code": "LOTUS-XXXXXX",
    "landing_page_url": "https://son-go.sonlotus.vn/"
  }'
```

