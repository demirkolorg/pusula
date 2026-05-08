// Sprint — Sosyal paylaşım & SEO ikonları.
//
// Next.js 16 file-based metadata: bu dosya tarayıcı sekmesi favicon'u +
// WhatsApp/Slack/Discord link önizlemesinde küçük kare ikon olarak otomatik
// bağlanır (`<link rel="icon" />`). 192x192 PNG olarak build-time'da üretilir;
// statically optimized — runtime maliyeti yok.
//
// 192x192: WhatsApp link önizleme thumbnail'ı için yeterli çözünürlük; daha
// küçük (32x32) sürümler messaging app crawler'ları tarafından yetersiz
// kalıyordu. apple-icon.tsx (180x180) iOS home screen için ek olarak verilir.
//
// Görsel: lacivert kart (--primary tonu) içinde lucide Compass ikonu.
// Mevcut auth-kabugu.tsx'teki marka rozeti ile aynı dili konuşuyor.

import { ImageResponse } from "next/og";

export const size = {
  width: 192,
  height: 192,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          background: "#1a2247",
          color: "white",
          borderRadius: 36,
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="128"
          height="128"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
        </svg>
      </div>
    ),
    {
      ...size,
    },
  );
}
