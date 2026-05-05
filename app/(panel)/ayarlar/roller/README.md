# Roller Modülü

ADR-0013'te tanımlanan **RBAC yönetim paneli**. Sistem rollerini ve özelleştirilebilir rolleri yönetir; her rolün izinlerini kategoriye göre düzenler.

## Genel akış

1. `/ayarlar/roller` — rol kart listesi (mobile-first)
2. **Yeni Rol** dialog → `RolFormDialog` → `rolOlusturEylem` → liste invalidate
3. **Yetkileri Düzenle** → `/ayarlar/roller/[rolId]` → `IzinMatrisi`
4. Sticky save bar → `rolIzinleriniGuncelleEylem` (transaction: deleteMany + createMany + `izin_versiyonu++`)
5. Çoğalt: kaynaktan tüm izinleri kopyalar, yeni kod/ad ile yeni rol
6. Sil: sistem rolleri + atanmış kullanıcısı olan roller engellenir; kalanlarda son-admin guard

## İzin kataloğu (ADR-0014 — granüler)

Tek otorite: [`lib/permissions-katalog.ts`](../../../../lib/permissions-katalog.ts).

- `IZIN_KODLARI` — 95 granüler izin kodu sabiti (modül × alt-kategori × aksiyon)
- `KATEGORI_BASLIKLARI` — üst-grup başlıkları (Proje, Liste, Kart, Kullanıcı, Birim, Rol & Yetki, Denetim, Sistem Ayarları)
- `ALT_KATEGORI_BASLIKLARI` — alt-grup başlıkları (Yetkili Kişi & Birim, Kapak, Tarih, Etiket, Yorum, Eklenti, Kontrol Listesi, Bağlantı, Davet, Onay, Yönetim, Hata Logu)
- `IZIN_TANIMLARI` — her kod için `ad` + Pusula jargonuyla `aciklama`
- `VARSAYILAN_ROL_IZINLERI` — sistem rolleri için seed matrisi

Eski `kart:edit`/`proje:edit` gibi geniş kodlar `IZIN_KODLARI`'da alias olarak (`KART_DUZENLE`/`PROJE_DUZENLE` …) durur — değer eski string. Server tarafında `lib/permissions-eslesme.ts#izinKoduGenislet` bu eski kodları yeni granüler kümeye otomatik açar.

UI'dan yeni izin kodu **oluşturulamaz**. Yeni izin için: katalogtan kod ekle + migration (yoksa upsert seed yeterli) + ilgili server action'larda `yetkiZorunlu` çağrısı.

## Last-admin koruması

`services.ts#sonAdminGuard` — Kullanıcının izinlerini güncellerken kendi rolünden `rol:manage` izninin son kaynağı kaldırılıyorsa reddeder. Makam rolleri (`SUPER_ADMIN`, `KAYMAKAM`) bu kontrolü atlar (her zaman `*` izin).

## JWT senkronizasyonu

`Rol.izin_versiyonu` her güncelleme sonrası `+1`. Auth callback JWT'ye:

```ts
session.user.izinler: string[]
session.user.izinVersiyonu: number  // kullanıcının rolleri arasında en yüksek
```

Kullanıcı bir sonraki JWT yenilenmesinde (30 dk default) güncel izinleri alır. Anlık revoke için kullanıcı yeniden giriş yapmalı (v2: Socket.io broadcast).

## İstemci tarafı

- [`lib/permissions-istemci.ts`](../../../../lib/permissions-istemci.ts) — `useIzin`, `useHerhangiBirIzin`, `useTumIzinler`, `useRol`
- [`components/yetki-koru.tsx`](../../../../components/yetki-koru.tsx) — `<YetkiKoru izin="rol:manage">`

```tsx
<YetkiKoru izin="rol:manage">
  <Button>Rol Oluştur</Button>
</YetkiKoru>
```

UI gating güvenlik **değildir** — server action her zaman `await yetkiZorunlu(...)`.

## Granüler yetki tipleri (Kural 138)

Sayfalarda `RolYetkileri = { listele, olustur, duzenle, sil, izinAta }` formatında geçilir. `boolean` tek-prop yasak.

## Test

- Saf logic: `[rolId]/components/izin-matrisi-helper.test.ts` (24 test, vitest)
- Servis: TODO — db-bağımlı testler için `services.test.ts` taslağı.

## Dosya haritası

```
roller/
├── page.tsx
├── components/
│   ├── roller-istemci.tsx
│   ├── rol-form-dialog.tsx
│   ├── rol-cogalt-dialog.tsx
│   └── rol-sil-onay.tsx
├── [rolId]/
│   ├── page.tsx
│   └── components/
│       ├── rol-detay-istemci.tsx
│       ├── izin-matrisi.tsx
│       ├── izin-kategori-grup.tsx
│       ├── izin-matrisi-helper.ts
│       └── izin-matrisi-helper.test.ts
├── hooks/
│   └── rol-sorgulari.ts
├── schemas.ts
├── services.ts
└── actions.ts
```

## İlgili ADR

- ADR-0005 — Resource-level RBAC (kaynak erişimi ayrı katman)
- ADR-0012 — Tek rol modeli (proje seviyesi kaldırıldı)
- ADR-0013 — RBAC yönetim paneli (bu modül)
