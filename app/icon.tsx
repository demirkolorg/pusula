// Sprint — Sosyal paylaşım & SEO ikonları.
//
// Next.js 16 file-based metadata: bu dosya tarayıcı sekmesi favicon'u olarak
// otomatik bağlanır (`<link rel="icon" />`). 32x32 PNG olarak build-time'da
// üretilir; statically optimized — runtime maliyeti yok.
//
// Görsel: lacivert kart (--primary tonu) içinde lucide Compass ikonu.
// Mevcut auth-kabugu.tsx'teki marka rozeti ile aynı dili konuşuyor.

import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
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
          borderRadius: 6,
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
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
