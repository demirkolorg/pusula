# Aktivite Yardımcıları

`lib/aktivite`, audit kayıtlarını kullanıcıya okunabilir aktivite anlatısına
çeviren paylaşılan public API'dir.

## Public API

- `zenginlestirVeOzetle(kayitlar)` — ham `AktiviteLogu` satırlarını proje,
  liste, kart, kullanıcı ve alan diff bağlamıyla `AktiviteOzeti[]` tipine
  dönüştürür.
- `aktiviteAnlati(ozet)` — bir `AktiviteOzeti` kaydını tek Türkçe cümleye
  dönüştürür.
- `kapsamBaglamiHazirla(kullaniciId)` — kullanıcının görebildiği proje, liste,
  kart ve kontrol listesi id kümelerini hazırlar.
- `kapsamWhere(baglam)` — hazırlanmış kapsamdan saf Prisma
  `AktiviteLoguWhereInput` üretir.

## Kullanım

Server tarafında:

```ts
import {
  kapsamBaglamiHazirla,
  kapsamWhere,
  zenginlestirVeOzetle,
} from "@/lib/aktivite";

const baglam = await kapsamBaglamiHazirla(kullaniciId);
const kayitlar = await db.aktiviteLogu.findMany({ where: kapsamWhere(baglam) });
const ozetler = await zenginlestirVeOzetle(kayitlar);
```

Client tarafında barrel import kullanma; sadece client-safe modülü doğrudan
import et:

```ts
import { aktiviteAnlati } from "@/lib/aktivite/anlati";
```

## Notlar

- `kapsam-where.ts` saf modüldür; DB veya auth import etmez ve unit testlerde
  doğrudan kullanılır.
- İdari kaynaklar (`Kullanici`, `Rol`, `Izin`, `Birim`, `DavetTokeni`) proje
  aktivite mesajlarının dışında `idari-mesaj.ts` ile Türkçeleştirilir.
