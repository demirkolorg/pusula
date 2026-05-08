// Sprint — Sosyal paylaşım og:image (WhatsApp, Twitter, LinkedIn, Slack vs.).
//
// Next.js 16 file-based metadata: bu dosya hem og:image hem twitter:image
// olarak <head>'e otomatik bağlanır. 1200x630 PNG build-time'da üretilir
// (statically optimized).
//
// Görsel: lacivert gradient zemin + sol üstte marka rozeti (Compass + Pusula),
// orta-sol blokta büyük başlık + açıklama, alt-sol köşede domain.
// Auth marka panelinin kimliği ile uyumlu — değişiklik gerekirse renkleri
// veya copy'yi buradan güncelle, build sonrası otomatik yansır.

import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

// alt yazısı `og:image:alt` ve `twitter:image:alt` olarak set edilir.
export const alt = "Pusula — Kaymakamlık Görev Yönetimi";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          color: "white",
          background:
            "linear-gradient(135deg, #0e1430 0%, #1a2247 55%, #2a3470 100%)",
          fontFamily: "sans-serif",
        }}
      >
        {/* Üst — marka rozeti */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 22,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 88,
              height: 88,
              borderRadius: 22,
              background: "white",
              color: "#1a2247",
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="52"
              height="52"
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
          <span
            style={{
              fontSize: 40,
              fontWeight: 600,
              letterSpacing: -0.5,
            }}
          >
            Pusula
          </span>
        </div>

        {/* Orta — başlık + açıklama */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 28,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 92,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: -2,
            }}
          >
            Kaymakamlık
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 92,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: -2,
              marginTop: -28,
            }}
          >
            Görev Yönetimi
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 32,
              color: "#cbd5e1",
              lineHeight: 1.4,
              maxWidth: 980,
            }}
          >
            Trello tarzı kanban + görev takibi, çekirdek audit ve hata logu —
            mobil-first.
          </div>
        </div>

        {/* Alt — domain etiketi */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              background: "#22c55e",
            }}
          />
          <span
            style={{
              fontSize: 26,
              color: "#94a3b8",
              letterSpacing: 0.2,
            }}
          >
            pusulaportal.com
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
