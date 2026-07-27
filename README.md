# Codexdentist Odontogram

Odontogram FDI 5 mặt mã nguồn mở, dùng được như một React component hoặc một
ứng dụng độc lập để nhúng bằng `iframe`.

## Tính năng

- 32 răng vĩnh viễn và 20 răng sữa theo ký hiệu FDI.
- Đánh dấu độc lập các mặt M, D, B, L và O/I.
- Đánh dấu thân/chân trực tiếp trên chính ảnh giải phẫu hiện tại; không render
  thêm một hình răng thứ hai.
- Ký hiệu lâm sàng: viêm tủy, viêm quanh răng, tiêu xương, tổn thương quanh
  chóp, implant, điều trị tủy, mão, mất răng, chỉ định nhổ và nứt/gãy.
- Luôn cho phép chọn nhiều răng; bấm lại để bỏ từng răng khỏi nhóm và tạo cầu
  trên các răng liền nhau.
- Mất răng vẫn giữ khối xương/nướu; tiêu xương làm hạ mào xương.
- Chẩn đoán chỉnh nha nhanh cho hai hàm, hàm trên và hàm dưới.
- Hoàn tác, xuất JSON và giao diện responsive.

## Chạy thử

Yêu cầu: Node.js 20 trở lên và npm 10 trở lên.

```bash
git clone https://github.com/vudatdentist-ui/codexdentist-odontogram.git
cd codexdentist-odontogram
npm install
npm run dev
```

Mở `http://localhost:5173`.

## Tích hợp React hoặc Next.js

### 1. Cài package từ GitHub

```bash
npm install github:vudatdentist-ui/codexdentist-odontogram
```

### 2. Chép bộ ảnh răng vào thư mục public

```bash
npx codexdentist-odontogram-assets ./public/odontogram-assets
```

Chạy lại lệnh này sau khi nâng phiên bản package.

### 3. Dùng component

```tsx
"use client";

import { useCallback } from "react";
import {
  Odontogram,
  type OdontogramData,
} from "codexdentist-odontogram";
import "codexdentist-odontogram/style.css";

export function PatientOdontogram({
  initialData,
}: {
  initialData?: OdontogramData;
}) {
  const save = useCallback(async (data: OdontogramData) => {
    await fetch("/api/patients/PATIENT_ID/odontogram", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }, []);

  return (
    <Odontogram
      defaultValue={initialData}
      onChange={save}
      onSelectionChange={(teeth) => console.log("Selected teeth", teeth)}
      assetBaseUrl="/odontogram-assets"
    />
  );
}
```

Trong Next.js App Router, import `style.css` tại `app/layout.tsx` nếu cấu hình
hiện tại không cho phép import CSS package trong component.

`defaultValue` chỉ được đọc khi component mount. Khi chuyển bệnh nhân, dùng
`key={patientId}` để tạo instance mới.

```tsx
<PatientOdontogram key={patient.id} initialData={patient.odontogram} />
```

Không gọi API trực tiếp ở mỗi lần click trong production. Nên debounce
`onChange` khoảng 500-1000 ms hoặc lưu nháp phía client rồi đồng bộ theo phiên.

### Props tích hợp

| Prop | Ý nghĩa |
| --- | --- |
| `defaultValue` | Snapshot được đọc khi component mount |
| `onChange` | Trả về toàn bộ `OdontogramData` khi chart thay đổi |
| `selectedTeeth` | Danh sách răng FDI được điều khiển bởi ứng dụng cha |
| `defaultSelectedTeeth` | Danh sách răng được chọn ban đầu |
| `onSelectionChange` | Trả về danh sách răng FDI đang chọn |
| `readOnly` | Cho xem và chọn răng nhưng khóa thay đổi lâm sàng |
| `embedded` | Ẩn header/footer thương hiệu khi nhúng vào ứng dụng khác |
| `assetBaseUrl` | URL chứa bộ SVG đã sinh |
| `brandHref`, `logoUrl` | Tùy chỉnh liên kết và logo |

`selectedTeeth` dùng mã FDI không có tiền tố `R`, ví dụ `["16", "21"]`.

## Tích hợp bằng iframe

Build ứng dụng độc lập:

```bash
npm install
npm run build:demo
```

Deploy toàn bộ thư mục `demo-dist/` lên một domain hoặc đường dẫn riêng. Trang
chứa iframe phải truyền origin của chính nó:

```html
<iframe
  id="odontogram"
  src="https://odontogram.example.com/?parentOrigin=https%3A%2F%2Fclinic.example.com"
  sandbox="allow-scripts allow-same-origin allow-downloads"
  style="width:100%;height:900px;border:0"
></iframe>

<script>
  const ODONTOGRAM_ORIGIN = "https://odontogram.example.com";
  const frame = document.getElementById("odontogram");

  window.addEventListener("message", (event) => {
    if (
      event.origin !== ODONTOGRAM_ORIGIN ||
      event.data?.type !== "codexdentist:odontogram-change"
    ) {
      return;
    }

    saveOdontogramToYourApi(event.data.data);
  });

  frame.addEventListener("load", () => {
    frame.contentWindow.postMessage(
      {
        type: "codexdentist:odontogram-set",
        data: odontogramLoadedFromYourApi,
      },
      ODONTOGRAM_ORIGIN,
    );
  });
</script>
```

Server của iframe phải cho phép domain cha trong CSP `frame-ancestors`. Không
dùng `X-Frame-Options: DENY`.

## Cấu trúc dữ liệu

```ts
type OdontogramData = {
  version: 1;
  surfaceState: Record<string, "caries" | "existing" | "planned" | "watch">;
  anatomyState: Record<string, "caries" | "existing" | "planned" | "watch">;
  markerState: Record<string, true>;
  bridges: Array<{
    id: string;
    dentition: "adult" | "primary";
    teeth: string[];
  }>;
  quickDiagnosis: {
    both: Record<string, string>;
    upper: Record<string, string>;
    lower: Record<string, string>;
  };
};
```

Ví dụ `surfaceState["16.M"] = "caries"` là sâu mặt gần răng 16.
`anatomyState["16.crown"] = "planned"` là đánh dấu điều trị dự kiến ở thân
răng 16; vùng còn lại là `root`.
`markerState["16.pulpitis"] = true` là viêm tủy răng 16.

Snapshot cũ không có `anatomyState` vẫn được đọc với giá trị mặc định rỗng. Mọi
dữ liệu đầu vào đều được lọc lại theo danh sách răng, mặt răng, vùng giải phẫu,
marker và giá trị hợp lệ trước khi hiển thị.

## Quy tắc lưu dữ liệu y tế

- Demo chỉ lưu vào `localStorage`; thư viện không tự chọn database.
- Ứng dụng tích hợp phải xác thực người dùng và kiểm tra quyền ở API.
- Gắn odontogram với `patientId`, `organizationId` và cơ sở/phòng khám phù hợp.
- Lưu lịch sử chỉnh sửa nếu dữ liệu được dùng như hồ sơ lâm sàng.
- Không tin `patientId` hoặc quyền gửi từ trình duyệt; kiểm tra lại phía server.
- Không gửi dữ liệu bệnh nhân qua `postMessage` với target origin là `"*"`.

## Scripts

```bash
npm run dev         # chạy demo
npm run typecheck   # kiểm tra TypeScript
npm run build       # build package trong dist/
npm run build:demo  # build ứng dụng iframe trong demo-dist/
```

## Giấy phép

Mã nguồn: AGPL-3.0-or-later. Bộ ảnh giải phẫu được sinh từ
`@artidev/odontogram-core` 0.2.1 theo giấy phép MIT. Xem
`THIRD_PARTY_NOTICES.md`.
