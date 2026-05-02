export interface EpostaSecenekleri {
  kime: string | string[]
  konu: string
  metinIcerigi: string
  htmlIcerigi?: string
}

export async function epostaGonder(_secenekler: EpostaSecenekleri): Promise<void> {
  // TODO: SMTP → Mailgun/SES entegrasyonu
  throw new Error('Eposta sağlayıcısı henüz yapılandırılmadı')
}
