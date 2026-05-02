import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'OTP Doğrula' }

export default function OtpDogrulaPage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-6 p-6">
        <h1 className="text-2xl font-bold">Kimliğini Doğrula</h1>
        <p className="text-sm text-muted-foreground">E-posta adresine gönderilen kodu gir.</p>
        {/* OtpForm buraya gelecek */}
      </div>
    </main>
  )
}
