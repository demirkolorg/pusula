import { betterAuth } from 'better-auth'
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

  // TODO: KÖ-1.8 — F-1 eposta OTP eklentisi
  // plugins: [emailOTP({ ... })]
})

export type AuthOturum = typeof auth.$Infer.Session
export type AuthKullanici = typeof auth.$Infer.Session.user
