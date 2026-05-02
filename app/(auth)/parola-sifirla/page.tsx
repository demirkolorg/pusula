import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Parola Sıfırla' }

export default function ParolaSifirlaPage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-6 p-6">
        <h1 className="text-2xl font-bold">Parolanı Sıfırla</h1>
        {/* ParolaSifirlaForm buraya gelecek */}
      </div>
    </main>
  )
}
