// Sprint — Sosyal paylaşım & SEO ikonları (iOS/Apple).
//
// Next.js 16 file-based metadata: bu dosya `<link rel="apple-touch-icon" />`
// olarak <head>'e otomatik bağlanır. 180x180 PNG, build-time statik.
//
// Kullanım alanları:
//   - iOS Safari "Ana ekrana ekle"
//   - macOS Dock'a sürüklenen webapp
//   - Bazı messaging app crawler'ları (Slack, Discord) apple-touch-icon'u
//     fallback olarak kullanıyor — link önizlemesinde icon kalitesini artırır.
//
// Görsel app/icon.tsx ile aynı, sadece size ve borderRadius farklı (iOS klasik
// uygulama ikonu kornerine yakın).

import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
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
          borderRadius: 40,
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="120"
          height="120"
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
