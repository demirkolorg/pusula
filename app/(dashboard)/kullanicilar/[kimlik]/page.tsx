import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { kullaniciServisi } from '../services'

type Props = { params: Promise<{ kimlik: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { kimlik } = await params
  const kullanici = await kullaniciServisi.tekGetir(kimlik)
  return { title: kullanici?.name ?? 'Kullanıcı' }
}

const ROL_ETIKET: Record<string, string> = {
  YONETICI: 'Yönetici',
  BIRIM_MUDURU: 'Birim Müdürü',
  PERSONEL: 'Personel',
}

export default async function KullaniciProfilPage({ params }: Props) {
  const { kimlik } = await params
  const kullanici = await kullaniciServisi.tekGetir(kimlik)
  if (!kullanici) notFound()

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{kullanici.name}</h1>
          <p className="text-muted-foreground text-sm">{kullanici.email}</p>
        </div>
        <Badge variant={kullanici.aktif ? 'default' : 'secondary'}>
          {kullanici.aktif ? 'Aktif' : 'Pasif'}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Hesap Bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Rol</span>
              <span className="font-medium">{ROL_ETIKET[kullanici.rol] ?? kullanici.rol}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Birim</span>
              <span className="font-medium">{kullanici.birim?.ad ?? '—'}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Kayıt Tarihi</span>
              <span className="font-medium">
                {new Date(kullanici.createdAt).toLocaleDateString('tr-TR')}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Oturum Yöntemleri</CardTitle>
          </CardHeader>
          <CardContent>
            {kullanici.accounts.length === 0 ? (
              <p className="text-muted-foreground text-sm">Bağlı hesap yok</p>
            ) : (
              <ul className="space-y-2">
                {kullanici.accounts.map((h) => (
                  <li key={h.providerId} className="text-sm capitalize">
                    {h.providerId}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
