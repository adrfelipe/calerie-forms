import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = createServiceRoleClient();

  const body = await req.json();
  const { file_name, content_type, base64 } = body;

  if (!file_name || !content_type || !base64) {
    return NextResponse.json({ error: "file_name, content_type e base64 são obrigatórios" }, { status: 400 });
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(content_type)) {
    return NextResponse.json({ error: "Tipo de arquivo não permitido" }, { status: 400 });
  }

  const timestamp = Date.now();
  const safeName = `${timestamp}-${file_name.replace(/[^a-zA-Z0-9._-]/g, "")}`;
  const storagePath = `uploads/${safeName}`;

  const buffer = Buffer.from(base64, "base64");

  const { error: uploadError } = await supabase.storage
    .from("document-photos")
    .upload(storagePath, buffer, {
      contentType: content_type,
      upsert: false,
    });

  if (uploadError) {
    console.error("[upload] Erro no Supabase Storage:", uploadError);
    return NextResponse.json({ error: "Erro ao fazer upload da foto" }, { status: 500 });
  }

  return NextResponse.json({ path: storagePath });
}
