export interface DepolamaSaglayici {
  yukle(dosyaYolu: string, tampon: Buffer, icerikTuru: string): Promise<string>
  indir(dosyaYolu: string): Promise<Buffer>
  sil(dosyaYolu: string): Promise<void>
  imzaliBaglantiAl(dosyaYolu: string, saniyeCinsinden?: number): Promise<string>
}

// Sağlayıcı seçimi: 'local' | 'minio'
// TODO: yerel ve MinIO uygulamaları
export function depolamaSaglayiciAl(): DepolamaSaglayici {
  throw new Error('Depolama sağlayıcısı henüz yapılandırılmadı')
}
