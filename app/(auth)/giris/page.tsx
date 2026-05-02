import type { Metadata } from 'next'
import Link from 'next/link'
import { GirisForm } from './components/giris-form'

export const metadata: Metadata = { title: 'Giriş' }

export default function GirisPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40">
      <div className="w-full max-w-sm space-y-6 rounded-xl border bg-card p-8 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Pusula</h1>
          <p className="text-sm text-muted-foreground">Hesabınıza giriş yapın</p>
        </div>

        <GirisForm />

        <p className="text-center text-sm text-muted-foreground">
          <Link
            href="/parola-sifirla"
            className="underline-offset-4 hover:underline"
          >
            Parolanızı mı unuttunuz?
          </Link>
        </p>
      </div>
    </main>
  )
}
