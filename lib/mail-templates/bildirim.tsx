import {
  Body,
  Button,
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

// Faz 4 — Bildirim e-posta şablonu (generic, tüm tipler için).
// Kullanım: in-app bildirim üretildikten sonra, tercih `email_acik=true`
// olan alıcılara `mailGonder` ile gönderilir. Şablon TR, marka stiliyle
// (bkz. davet.tsx — ADR-0011).

export type BildirimMailProps = {
  baslik: string;
  ozet: string | null;
  /** Olayın deep link'i — kart, proje veya /bildirimler. */
  url: string;
  /** Tercih sayfası linki — "almak istemiyorum" çıkışı. */
  tercihUrl: string;
};

export function BildirimMail({
  baslik,
  ozet,
  url,
  tercihUrl,
}: BildirimMailProps) {
  return (
    <Html lang="tr">
      <Head />
      <Preview>{baslik}</Preview>
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
              {ozet ? (
                <Text className="mt-2 text-sm leading-6 text-gray-700">
                  {ozet}
                </Text>
              ) : null}

              <Section className="my-6 text-center">
                <Button
                  href={url}
                  className="rounded-md bg-gray-900 px-6 py-3 text-sm font-medium text-white"
                >
                  Aç
                </Button>
              </Section>

              <Text className="mt-2 text-xs text-gray-500">
                Buton çalışmazsa şu bağlantıyı tarayıcınıza yapıştırın:
              </Text>
              <Text className="break-all text-xs text-gray-700">{url}</Text>

              <Hr className="my-6 border-gray-200" />

              <Text className="text-xs leading-5 text-gray-500">
                Bu bildirimi almak istemiyor musunuz?{" "}
                <a href={tercihUrl} className="text-gray-700 underline">
                  Bildirim ayarlarınızı değiştirin
                </a>
                .
              </Text>
            </Section>
          </Container>
          <Text className="mx-auto max-w-[480px] text-center text-xs text-gray-400">
            Pusula · Otomatik bildirim
          </Text>
        </Body>
      </Tailwind>
    </Html>
  );
}

export default BildirimMail;
