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

// Why React Email + Tailwind: render edildiğinde inline CSS'e dönüşür,
// outlook/apple mail dahil her client'ta tutarlı görünüm. Brand stilini
// tek yerden yönetebiliyoruz. (ADR-0011)

export type DavetMailProps = {
  davetEdenAd?: string | null;
  url: string;
  omurGun: number;
};

export function DavetMail({ davetEdenAd, url, omurGun }: DavetMailProps) {
  const onceText = davetEdenAd
    ? `${davetEdenAd} sizi Pusula'ya davet etti.`
    : "Pusula'ya davet edildiniz.";

  return (
    <Html lang="tr">
      <Head />
      <Preview>{`Pusula'ya davet edildiniz — bağlantı ${omurGun} gün geçerli`}</Preview>
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
                {onceText}
              </Heading>
              <Text className="mt-2 text-sm leading-6 text-gray-700">
                Hesabınızı oluşturmak için aşağıdaki bağlantıyı kullanın. Yeni
                bir parola belirleyeceksiniz, ardından sisteme giriş
                yapabileceksiniz.
              </Text>

              <Section className="my-6 text-center">
                <Button
                  href={url}
                  className="rounded-md bg-gray-900 px-6 py-3 text-sm font-medium text-white"
                >
                  Daveti Kabul Et
                </Button>
              </Section>

              <Text className="mt-2 text-xs text-gray-500">
                Buton çalışmazsa şu bağlantıyı tarayıcınıza yapıştırın:
              </Text>
              <Text className="break-all text-xs text-gray-700">{url}</Text>

              <Hr className="my-6 border-gray-200" />

              <Text className="text-xs leading-5 text-gray-500">
                Bağlantı <strong>{omurGun} gün</strong> geçerlidir. Bu daveti
                beklemiyorsanız mesajı yok sayabilirsiniz; hesabınız
                oluşturulmaz.
              </Text>
            </Section>
          </Container>
          <Text className="mx-auto max-w-[480px] text-center text-xs text-gray-400">
            Pusula · Tekman Kaymakamlığı
          </Text>
        </Body>
      </Tailwind>
    </Html>
  );
}

export default DavetMail;
