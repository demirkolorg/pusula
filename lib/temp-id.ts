import { nanoid } from "nanoid";

const ON_EK = "temp-";

export function tempId(): string {
  return `${ON_EK}${nanoid(12)}`;
}

export function tempIdMi(id: string | null | undefined): boolean {
  return typeof id === "string" && id.startsWith(ON_EK);
}
