export interface OlayYukü {
  GOREV_OLUSTURULDU: { gorevId: string; olusturanId: string }
  GOREV_GUNCELLENDI: { gorevId: string; degistiren: string }
  GOREV_ONAYA_SUNULDU: { gorevId: string; kullaniciId: string }
  GOREV_ONAYLANDI: { gorevId: string; onaylayanId: string }
  GOREV_REDDEDILDI: { gorevId: string; reddeden: string; gerekce: string }
  GOREV_GECIKTI: { gorevId: string; bitisTarihi: Date }
  VEKALET_SURESI_DOLDU: { vekaletId: string; vekilId: string }
  BILDIRIM_GONDER: { kullaniciId: string; mesaj: string; tur: string }
}
