import { betterAuth } from 'better-auth'
import { nextCookies } from 'better-auth/next-js'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { prisma } from '@/lib/prisma'

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 12,
    autoSignIn: true,
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7,   // 7 gün
    updateAge: 60 * 60 * 24,        // günlük yenile
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },

  advanced: {
    useSecureCookies: process.env.NODE_ENV === 'production',
    cookiePrefix: 'pusula',
  },

  // ZORUNLU: Server action içinde set edilen Set-Cookie header'larını
  // Next.js cookie store'una otomatik aktarır. Manuel parse gerekmez.
  plugins: [nextCookies()],

  // TODO: KÖ-1.8 — F-1 eposta OTP eklentisi
})

export type AuthOturum = typeof auth.$Infer.Session
export type AuthKullanici = typeof auth.$Infer.Session.user
