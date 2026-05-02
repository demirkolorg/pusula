// Yumuşak silme: Servis katmanında manuel uygulanıyor (silinmeTarihi: new Date()).
// Prisma v6'da Middleware kaldırıldı; gerekirse $extends query extension ile implemente edilecek.
export function yumusakSilmeUzantisi() {
  return {}
}
