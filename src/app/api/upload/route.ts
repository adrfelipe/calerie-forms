import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = createServiceRoleClient();

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const type = formData.get("type") as string | null;

  if (!file || !type) {
    return NextResponse.json({ error: "file e type são obrigatórios" }, { status: 400 });
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: "Tipo de arquivo não permitido" }, { status: 400 });
  }

  const timestamp = Date.now();
  const ext = file.name.split(".").pop() || "jpg";
  const safeName = `${timestamp}-${type}.${ext}`;
  const storagePath = `uploads/${safeName}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from("document-photos")
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("[upload] Erro no Supabase Storage:", uploadError);
    return NextResponse.json({ error: "Erro ao fazer upload da foto" }, { status: 500 });
  }

  return NextResponse.json({ path: storagePath });
}
