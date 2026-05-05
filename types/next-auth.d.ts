import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    name?: string | null;
    adSoyad?: string;
    birimId?: string | null;
    roller?: string[];
    izinler?: string[];
    izinVersiyonu?: number;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      adSoyad?: string;
      birimId?: string | null;
      roller?: string[];
      izinler?: string[];
      izinVersiyonu?: number;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    email?: string;
    adSoyad?: string;
    birimId?: string | null;
    roller?: string[];
    izinler?: string[];
    izinVersiyonu?: number;
  }
}
