import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

// Adım 4 / Faz 5.5 — Birden fazla olayın tek e-mail'de toplanması.
// Aynı 5dk pencerede 10 yorum yazılırsa, kullanıcı 10 ayrı mail değil
// 1 özet mail alır. Slack/Linear pattern.

export type BildirimDigestSatir = {
  baslik: string;
  ozet: string | null;
  url: string;
};

export type BildirimDigestMailProps = {
  /** Toplam olay sayısı (tekrar dahil). */
  toplamOlay: number;
  satirlar: ReadonlyArray<BildirimDigestSatir>;
  tercihUrl: string;
};

export function BildirimDigestMail({
  toplamOlay,
  satirlar,
  tercihUrl,
}: BildirimDigestMailProps) {
  const baslik = `${toplamOlay} yeni olay`;
  return (
    <Html lang="tr">
      <Head />
      <Preview>{`Pusula — ${baslik}`}</Preview>
      <Tailwind>
        <Body className="bg-gray-100 font-sans">
          <Container className="mx-auto my-10 max-w-[480px] rounded-lg bg-white p-8 shadow-sm">
            <Section>
              <Heading className="m-0 text-xl font-semibold text-gray-900">
                Pusula
              </Heading>
              <Text className="mt-1 text-xs text-gray-500">
                Kaymakamlık Görev Yönetim Sistemi
              </Text>
            </Section>
            <Hr className="my-6 border-gray-200" />
            <Section>
              <Heading
                as="h2"
                className="m-0 text-base font-semibold text-gray-900"
              >
                {baslik}
              </Heading>
              <Text className="mt-2 text-sm leading-6 text-gray-700">
                Son 5 dakikada Pusula&apos;da sizi ilgilendiren olaylar:
              </Text>

              <Section className="my-4">
                {satirlar.map((s, i) => (
                  <Section
                    key={i}
                    className="mb-3 rounded-md border border-gray-200 p-3"
                  >
                    <Text className="m-0 text-sm font-medium text-gray-900">
                      {s.baslik}
                    </Text>
                    {s.ozet ? (
                      <Text className="mt-1 mb-2 text-xs text-gray-600">
                        {s.ozet}
                      </Text>
                    ) : null}
                    <Text className="m-0 text-xs">
                      <a
                        href={s.url}
                        className="text-blue-600 underline"
                      >
                        Aç →
                      </a>
                    </Text>
                  </Section>
                ))}
              </Section>

              <Hr className="my-6 border-gray-200" />

              <Text className="text-xs leading-5 text-gray-500">
                Bu özet bildirimler 5 dakikada bir gönderilir.{" "}
                <a href={tercihUrl} className="text-gray-700 underline">
                  Bildirim ayarlarını değiştir
                </a>
                .
              </Text>
            </Section>
          </Container>
          <Text className="mx-auto max-w-[480px] text-center text-xs text-gray-400">
            Pusula · Otomatik bildirim özeti
          </Text>
        </Body>
      </Tailwind>
    </Html>
  );
}

export default BildirimDigestMail;
