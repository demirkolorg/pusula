// ADR-0018 + ADR-0019 — Kart tamamlama ön koşullarının ve öneri durumunun
// saf hesabı. React/Prisma bağımsız; sayısal girdi → karar. Server ve client
// aynı fonksiyondan geçer (UI/server tek doğru).

export type KontrolDurum = {
  toplam: number;
  tamamlanan: number;
};

export type TamamlamaYasakSebebi = "kontrol-yarim" | "yetki-yok";

export type TamamlamaYasak = {
  sebep: TamamlamaYasakSebebi;
  // Tooltip + toast'ta gösterilecek Türkçe mesaj. Sebep enum'undan çıkartmak
  // yerine açıkça döndürmek i18n hazırlığı (Kural 7) için modülü tek kaynak yapar.
  mesaj: string;
};

export function tamamlamaYasakHesapla(args: {
  yetkiVar: boolean;
  // Kart kapanırken (true → false geçişi yasak DEĞİL — sadece açma engellenir).
  // false → true geçişinde uygulanır. Mevcut durum true ise (kart zaten kapalı)
  // yeniden açma daima serbest.
  yeniDurum: boolean;
  kontrol: KontrolDurum;
}): TamamlamaYasak | null {
  if (!args.yetkiVar) {
    return {
      sebep: "yetki-yok",
      mesaj: "Tamamlama yetkiniz yok.",
    };
  }
  // Yeniden açma (true → false) hiçbir zaman bloklanmaz.
  if (!args.yeniDurum) return null;
  // Kart açıkken (false → true) kontrol listesi yarım ise sert blok.
  if (
    args.kontrol.toplam > 0 &&
    args.kontrol.tamamlanan < args.kontrol.toplam
  ) {
    const eksik = args.kontrol.toplam - args.kontrol.tamamlanan;
    return {
      sebep: "kontrol-yarim",
      mesaj: `Kontrol listesinde ${eksik} madde tamamlanmadan kart kapatılamaz.`,
    };
  }
  return null;
}

// Kart bitiş tarihinin geçmiş olup olmadığını saf hesap.
// `bitis === null` → false (gecikti yok). `tamamlandi === true` → false
// (tamamlanan kart geciktirilmiş bile olsa rozet göstermez — ADR-0018).
export function gecikmisMi(args: {
  bitis: Date | null;
  tamamlandi: boolean;
  // Test edilebilirlik için "şimdi" enjekte edilebilir; default Date.now().
  simdi?: Date;
}): boolean {
  if (args.tamamlandi) return false;
  if (!args.bitis) return false;
  const simdi = args.simdi ?? new Date();
  return args.bitis.getTime() < simdi.getTime();
}

// ============================================================
// ADR-0019 — Öneri/onay flow saf state hesabı
// ============================================================

// DB enum'unun runtime gerektirmeyen string union karşılığı. Prisma'nın
// üretip enum yerine bu literal type kullanılır → helper React/Prisma'sız
// kalır, server ve client'ta aynı dosyadan import edilir.
export type OneriDurumu = "YOK" | "BEKLIYOR" | "REDDEDILDI";

// Toggle UI'sının 4 modu. Caller bu değere göre ikon/renk/onClick davranışı
// seçer. `aktif` mevcut PR-1 davranışını korur (yetkili kullanıcı için
// standart toggle); diğer 3 mod yetkisiz kullanıcı veya bekleyen öneri için
// devreye girer.
export type ToggleModu =
  // Standart davranış: doğrudan tamamlandı/açık toggle. Kart tamamlanmışsa
  // VEYA kullanıcı KART_TAMAMLA yetkisine sahipse bu mod aktif.
  | { tip: "aktif" }
  // Yetkisiz kullanıcı, durum YOK veya REDDEDILDI: tıklayınca öneri gönderir.
  | { tip: "onerilebilir" }
  // Durum BEKLIYOR: bilgi gösterimi. Yetkili kullanıcıda Onayla/Reddet
  // banner'ı modal'da görünür; yetkisiz kullanıcıda sadece tooltip.
  | { tip: "onerildi"; onerenAd: string | null }
  // Durum REDDEDILDI: kullanıcı yeni öneri verebilir (yetkisiz için);
  // yetkili kullanıcı zaten "aktif" mod'a düşer, bu mod yetkisiz user
  // için bilgi gösterir.
  | { tip: "reddedildi"; sebep: string | null };

export function oneriDurumuHesapla(args: {
  // PR-1 yetki bayrağı (KART_TAMAMLA + kart:tamamla resource).
  yetkiVar: boolean;
  tamamlandi: boolean;
  oneriDurumu: OneriDurumu;
  // BEKLIYOR/REDDEDILDI durumunda gösterilecek ek bilgi.
  oneren: { ad: string; soyad: string } | null;
  redSebebi: string | null;
}): ToggleModu {
  // Tamamlanmış kart → her durumda standart toggle. Yeniden açma yetkili
  // kullanıcı için serbest; yetkisiz tıklarsa "yetki yok" sebebine düşer
  // ama bu öneri akışı kapsamı dışında — KartTamamlaToggle yasak prop'u
  // ile yine de bloklanır.
  if (args.tamamlandi) return { tip: "aktif" };

  // Yetkili kullanıcı için: BEKLIYOR durumunda dahi standart toggle DEĞİL —
  // çünkü banner ile Onayla/Reddet seçenekleri sunulur. UI bu durumda
  // KartModal'da banner gösterir; toggle "onerildi" modunda bilgi verir.
  if (args.oneriDurumu === "BEKLIYOR") {
    return {
      tip: "onerildi",
      onerenAd: args.oneren ? `${args.oneren.ad} ${args.oneren.soyad}` : null,
    };
  }

  if (args.oneriDurumu === "REDDEDILDI") {
    // Yetkili kullanıcı için: red sonrası kart hala açık → standart toggle
    // (doğrudan kapatabilir, öneri akışını kullanmasına gerek yok).
    if (args.yetkiVar) return { tip: "aktif" };
    return { tip: "reddedildi", sebep: args.redSebebi };
  }

  // Durum YOK + tamamlanmamış:
  if (args.yetkiVar) return { tip: "aktif" };
  return { tip: "onerilebilir" };
}
