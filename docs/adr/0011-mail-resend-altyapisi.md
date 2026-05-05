# ADR 0011 — Mail Altyapısı: Resend + React Email + Senkron Gönderim

**Tarih:** 2026-05-05
**Durum:** Kabul edildi
**Bağlam:** ADR-0010 (davet → proje yetkisi bağlamı) — davet maillerinin gerçek teslim yolu eksikti.

## Bağlam

`lib/mail.ts` ilk sürümde stub: log + console.log. Davet token'ı DB'ye yazılıyor ama mail teslimi yok. Üç soru:

1. **Provider:** SMTP (kurum) vs. transactional API (Resend / Postmark / Sendgrid)
2. **Şablon:** Düz metin vs. HTML (React Email vs. inline HTML)
3. **Kuyruk:** Senkron vs. job queue (BullMQ / Redis)

## Karar

### 1. Resend (transactional API)

- React/Next.js ekosistemine uyum, modern SDK, batch + webhook desteği
- 100 mail/gün ücretsiz tier
- Domain doğrulanmadan `onboarding@resend.dev` ile geliştirme yapılabilir
- Production için kurumsal domain (`pusula.tekman.gov.tr`) DKIM/SPF doğrulanır

### 2. React Email + Tailwind şablon

- `lib/mail-templates/davet.tsx` — `@react-email/components` + Tailwind. Render'da inline CSS'e dönüşür; Outlook/Apple Mail uyumlu.
- Server-side render (`@react-email/render`) sadece `lib/mail.ts` içinden çağrılır — client bundle sızıntı yok.
- Düz metin gövde (`text` alanı) HTML desteklemeyen istemciler için her zaman gönderilir.

### 3. Senkron gönderim (MVP)

- Davet `db.$transaction` içinde yazılır → transaction'dan sonra `mailGonder` çağrılır.
- Mail fail → davet kaydı silinir, kullanıcıya `IC_HATA` döner ki tekrar denesin.
- Kuyruk yok — Redis altyapısı henüz hazır değil; provider çıkış yapana kadar maliyet artmaz.
- Sınır: provider 200ms-2s gecikme yapar. Bu davet form'unun submit feedback'ine eklenir, kullanıcı görür.
- v2: `BullMQ` ile arka plana alınabilir (planda S5).

### 4. Yeniden gönder + son_kullanma uzatma

`davetiYenidenGonder(davet_id)` servisi:
- Davet kullanılmamış olmalı
- Süresi dolduysa veya 24 saatten az kaldıysa `son_kullanma` 7 güne uzatılır
- Token aynı kalır (link daha önce paylaşıldıysa hâlâ geçerli)
- Mail tekrar gönderilir, audit log düşer

Bekleyen davet listesinde dairesel ok ikonlu buton (`RefreshCwIcon`).

### 5. Provider switch

`MAIL_PROVIDER` env:
- `stub` (default) — log + console (geliştirme + test)
- `resend` — gerçek gönderim (`RESEND_API_KEY` zorunlu)
- Bilinmeyen değer → `MailGonderimHatasi`

`RESEND_API_KEY` yoksa otomatik stub'a düşer (graceful degradation).

## .env Talimatları

```bash
# .env.local — geliştirme için
MAIL_PROVIDER=resend            # veya "stub"
MAIL_FROM=Pusula <onboarding@resend.dev>   # kişisel domain yokken Resend default
RESEND_API_KEY=re_...           # https://resend.com/api-keys
NEXT_PUBLIC_BASE_URL=http://localhost:2500
```

**Production için:**
1. Resend hesabında domain ekle (`pusula.tekman.gov.tr`)
2. DNS panelinde Resend'in verdiği DKIM/SPF/Return-Path TXT kayıtlarını ekle
3. Doğrulama bekleme (~30dk)
4. `MAIL_FROM=Pusula <noreply@pusula.tekman.gov.tr>`

**Kişisel mail kullanırken (sandbox sınırı):** Resend domain doğrulamadan **yalnız hesap sahibinin kendi e-postasına** mail göndermenize izin verir. Başka bir alıcıya `validation_error 403` döner.

Bunu aşmak için **dev override** mekanizması:

```bash
MAIL_DEV_ALICI_OVERRIDE=demirkol.abdullah93@gmail.com   # sizin Resend hesabı sahibi adresiniz
```

Override aktifken:
- Tüm davet maillerinin `to` alanı bu adrese yönlendirilir
- Konu satırına `[→ orijinal_alici]` eklenir
- HTML gövdenin başına sarı uyarı banner'ı çıkar ("aslında X adresine gidecekti")
- Düz metin gövdenin başına `[GELIŞTIRME OVERRIDE]` notu eklenir

Production'da `MAIL_DEV_ALICI_OVERRIDE` **boş bırakılır** veya tamamen kaldırılır → davet gerçek alıcıya gider.

## Sonuçlar

### Pozitif
- Davet flow'u uçtan uca çalışır: token → mail → linke tıkla → kayıt → projeye yetkili.
- HTML şablon brand görünümü tutarlı yapar.
- Yeniden gönder butonu ile fail/expire durumlar elle çözülür.

### Negatif / Takas
- Senkron çağrı: provider yavaşsa form submit gecikir. Ölçü: 2s SLO; aşıldığında loglanır.
- Resend bedava tier'da 100 mail/gün — yoğun kullanımda ücretli plana geçilir.
- Kişisel mail (henüz domain yok) → Resend production'da yalnız "verified emails" için çalışır. Production'a çıkmadan domain doğrulanır.

### Genişlemeler (v2)
- **Mail kuyruğu (BullMQ):** spam/burst durumlarda async kuyruğa al, retry policy
- **Bounce/complaint webhook:** Resend webhook → `MailLogu` tablosu
- **Birden fazla şablon:** parola sıfırlama, atama bildirimi, haftalık özet (`lib/mail-templates/`)
- **i18n:** İlerideki çoklu dil için template'ler `lib/i18n/tr.ts` ile entegre

## İlgili Dosyalar

- `lib/mail.ts` — provider switch, render helper
- `lib/mail-templates/davet.tsx` — React Email şablonu
- `app/(panel)/ayarlar/kullanicilar/services.ts` — `davetMailGonder`, `davetiYenidenGonder`
- `app/(panel)/projeler/[projeId]/yetkili/actions.ts` — `projeDavetYenidenGonderEylem`
- `app/(panel)/projeler/[projeId]/yetkili/components/yetkili-kisi-ekle-dialog.tsx` — UI yeniden gönder butonu
