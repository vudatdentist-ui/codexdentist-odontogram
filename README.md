# Codexdentist Odontogram

Odontogram FDI 5 mặt mã nguồn mở, dùng được như một React component hoặc một
ứng dụng độc lập để nhúng bằng `iframe`.

## Tính năng

- 32 răng vĩnh viễn và 20 răng sữa theo ký hiệu FDI.
- Đánh dấu độc lập các mặt M, D, B, L và O/I.
- Đánh dấu thân/chân trực tiếp trên chính ảnh giải phẫu hiện tại; vùng tô và
  hit target dùng đúng contour/viewBox của từng mẫu răng, không render thêm một
  hình răng thứ hai.
- Mã màu trên sơ đồ 5 mặt chỉ dùng cho sâu răng, mối hàn và inlay/onlay.
- Sơ đồ 5 mặt ở bảng chi tiết hiển thị mã M/D/B/L/O-I ngay trong từng vùng,
  không lặp lại danh sách mặt răng ở bên dưới.
- Thân/chân răng là phạm vi lâm sàng thực sự: ký hiệu phù hợp, gồm sâu răng,
  được áp dụng và hiển thị trên vùng đang chọn; thao tác chọn vùng không tự tô
  màu hình răng.
- Ký hiệu sâu răng lâm sàng dùng tổn thương màu đen bám sát đường viền giải
  phẫu, tách biệt với mã màu dùng để đánh dấu mặt răng.
- Ký hiệu lâm sàng: viêm tủy, viêm quanh răng, tiêu xương, tổn thương quanh
  chóp, implant, điều trị tủy, mão, mất răng, chỉ định nhổ và nứt/gãy.
- Luôn cho phép chọn nhiều răng; bấm lại để bỏ từng răng khỏi nhóm và tạo cầu
  trên các răng liền nhau. Khối chọn nhiều có lệnh bỏ chọn hoặc xóa toàn bộ
  trạng thái của đúng nhóm răng đang chọn.
- Mất răng vẫn giữ khối xương/nướu; tiêu xương làm hạ mào xương.
- Đánh giá tổng quát cho toàn miệng, hàm trên và hàm dưới, gồm tình trạng lợi,
  cao răng, mảng bám, vệ sinh răng miệng, khớp cắn và nhận xét bổ sung.
- Ba mốc điều trị độc lập theo luồng: hiện trạng ban đầu, tình trạng hiện tại
  và kết quả kỳ vọng; có thể reset riêng một mốc hoặc cả ba mốc sau khi xác
  nhận.
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
| `chartFooter` | Nội dung của ứng dụng tích hợp đặt ngay dưới hai cung răng |

`selectedTeeth` dùng mã FDI không có tiền tố `R`, ví dụ `["16", "21"]`.
Mảng rỗng là trạng thái hợp lệ. Người dùng có thể bỏ chọn toàn bộ răng; các
công cụ phụ thuộc vào răng sẽ bị khóa cho tới khi có lựa chọn mới.

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

    saveOdontogramToYourApi({
      activeStage: event.data.stage,
      activeSnapshot: event.data.data,
      stages: event.data.stages,
    });
  });

  frame.addEventListener("load", () => {
    frame.contentWindow.postMessage(
      {
        type: "codexdentist:odontogram-set",
        stages: odontogramStagesLoadedFromYourApi,
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
  version: 2;
  entries: Array<{
    id: string;
    conceptId: string;
    kind: "condition" | "restoration" | "procedure" | "prosthesis";
    status: "observed" | "existing" | "planned" | "monitoring";
    target: {
      scope: "tooth" | "surface" | "region" | "span";
      teeth: string[];
      surface?: "M" | "D" | "B" | "L" | "O" | "I";
      region?: "crown" | "root";
      dentition?: "adult" | "primary";
    };
    attributes?: Record<string, string | number | boolean>;
  }>;
  generalAssessment: {
    both: Record<string, string>;
    upper: Record<string, string>;
    lower: Record<string, string>;
    notes: {
      both: string;
      upper: string;
      lower: string;
    };
  };
};

type OdontogramStagesData = {
  INITIAL: OdontogramData | null;
  CURRENT: OdontogramData | null;
  EXPECTED: OdontogramData | null;
};
```

Mỗi entry tách riêng khái niệm, trạng thái và mục tiêu. Ví dụ sâu mặt gần răng
16 dùng `conceptId: "caries"` với target `surface/M`; gãy chân răng 16 dùng
`conceptId: "marker.fracture"` với target `region/root`.

Snapshot `version: 1` vẫn được đọc và tự chuyển sang `version: 2`. Các entry
chưa được renderer hiện tại nhận biết vẫn được giữ nguyên khi đọc và ghi lại,
giúp ứng dụng tích hợp có thể mở rộng concept mà không làm mất dữ liệu.

Ứng dụng standalone tự chuyển dữ liệu local storage một snapshot trước đây
sang `INITIAL` và `CURRENT`; `EXPECTED` bắt đầu trống. Sự kiện iframe mới có
thêm `stage` và `stages`, đồng thời vẫn giữ `data` là snapshot đang sửa để các
tích hợp cũ tiếp tục hoạt động.

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
