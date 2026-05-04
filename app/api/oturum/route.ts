import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

// Client-tarafı için minimal oturum kullanıcı bilgisi.
// Optimistic mutation'larda yazan/yapan kullanıcının ad+soyad+email'i
// gerekiyor (avatar + initials için). Server Action içinden cookie/header
// alamadığımız client'ta bu endpoint kullanılır.

export async function GET() {
  const oturum = await auth();
  if (!oturum?.user) {
    return NextResponse.json({ kullanici: null }, { status: 200 });
  }
  const id = (oturum.user as { id?: string }).id;
  if (!id) return NextResponse.json({ kullanici: null }, { status: 200 });

  const k = await db.kullanici.findUnique({
    where: { id },
    select: { id: true, ad: true, soyad: true, email: true, birim_id: true },
  });
  if (!k) return NextResponse.json({ kullanici: null }, { status: 200 });

  return NextResponse.json({ kullanici: k });
}
