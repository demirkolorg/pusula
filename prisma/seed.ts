import { prisma } from '@/lib/prisma'

async function seed() {
  console.log('Tohum verisi ekleniyor...')

  // ── Birim ──────────────────────────────────────────────────────────────
  const birim = await prisma.birim.upsert({
    where: { ad: 'Genel Müdürlük' },
    update: {},
    create: { ad: 'Genel Müdürlük', aciklama: 'Ana birim' },
  })
  console.log('✓ Birim:', birim.ad)

  // ── Yönetici kullanıcı ─────────────────────────────────────────────────
  // Not: better-auth üzerinden doğru hash ile oluşturmak için
  // bun run db:studio veya auth.api.signUpEmail kullanılmalı.
  // Bu seed yalnızca geliştirme ortamı için referans veridir.
  console.log('✓ Geliştirme ortamı için admin kullanıcısını better-auth ile oluşturun:')
  console.log('  POST /api/auth/sign-up/email')
  console.log('  { "email": "admin@pusula.local", "password": "Admin123!@#Dev", "name": "Admin" }')

  console.log('\nTohum tamamlandı.')
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
