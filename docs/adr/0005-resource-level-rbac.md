---
adr: 0005
tarih: 2026-05-04
durum: kabul-edildi
---

# ADR-0005 — Resource-Level RBAC

## Bağlam
**KRİTİK GÜVENLİK BULGUSU:** Mevcut yetki kontrolü sadece global izinleri (`pano:create`, `kart:edit`) kontrol ediyor. Kaynak (project/kart) seviyesinde **hiçbir kontrol yok**:

```ts
// Mevcut services.ts:
async function projeyeErisimDogrula(kurumId, projeId) {
  const p = await db.proje.findUnique({ where: { id: projeId } });
  if (!p || p.kurum_id !== kurumId) throw EylemHatasi("Bulunamadı");
  // ❌ ProjeUyesi kontrolü YOK — kurumdaki HERKES her projeye erişiyor.
}
```

Sonuç: Bir personel, hiç üye olmadığı bir projenin tüm kartlarını görebilir, taşıyabilir, düzenleyebilir. KVKK ihlali riski.

## Karar

### `lib/yetki.ts` — Merkezi Policy Katmanı
```ts
export async function canProje(
  kullaniciId: string,
  action: "read" | "edit" | "delete" | "uye-yonet",
  projeId: string,
): Promise<boolean> {
  // 1. SUPER_ADMIN/KAYMAKAM → kurumun tamamına erişir (Makam katmanı)
  // 2. ProjeUyesi.seviye → action eşleme (ADMIN: hepsi, NORMAL: read+edit, IZLEYICI: read)
  // 3. Default: false
}

export async function canKart(...): Promise<boolean> {
  // 1. Kart → liste → proje üzerinden delegasyon
}

export async function canListe(...): Promise<boolean> { ... }

export async function yetkiZorunluKaynak(...) {
  // can*() false ise EylemHatasi(YETKISIZ) fırlatır
}
```

### Services Refactor
Tüm service fonksiyonları `kullaniciId` parametresi alır + `yetkiZorunluKaynak` çağırır:

```ts
// Önceden:
export async function projeDetayiniGetir(kurumId, projeId) { ... }
// Sonra:
export async function projeDetayiniGetir(kullaniciId, kurumId, projeId) {
  await yetkiZorunluKaynak(kullaniciId, "proje:read", projeId);
  ...
}
```

### Otomatik üyelik
Proje oluşturan kullanıcı otomatik `ProjeUyesi.ADMIN` seviyesinde (zaten yapılıyor). SUPER_ADMIN/KAYMAKAM'lar üyelik gerektirmez.

## Sonuç
- Kurum içi yetkisiz erişim engellendi.
- KVKK uyumu sağlandı (kişisel veri sadece üyelere).
- `ProjeUyesi` modeli artık aktif kullanılıyor (önceden ölü).

## Kontrol Kural Bağlantıları
50 (RBAC), 50a (Makam katmanı), 146 (yeni — resource-level RBAC)
