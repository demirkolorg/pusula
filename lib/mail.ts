import { logger } from "./logger";

export type MailGonderim = {
  alici: string;
  konu: string;
  govde: string;
};

export async function mailGonder(m: MailGonderim): Promise<void> {

  logger.info(
    {
      alici: m.alici,
      konu: m.konu,
      govde: m.govde.length > 500 ? m.govde.slice(0, 500) + "..." : m.govde,
    },
    "[mail-stub] Mail gönderilecekti",
  );

  if (process.env.NODE_ENV !== "production") {

    console.log("\n----- MAIL (DEV) -----");
    console.log("To:", m.alici);
    console.log("Subject:", m.konu);
    console.log(m.govde);
    console.log("----------------------\n");
  }
}
