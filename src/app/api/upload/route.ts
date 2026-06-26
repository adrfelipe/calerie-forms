import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = createServiceRoleClient();

  const body = await req.json();
  const { file_name, content_type } = body;

  if (!file_name || !content_type) {
    return NextResponse.json({ error: "file_name e content_type são obrigatórios" }, { status: 400 });
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(content_type)) {
    return NextResponse.json({ error: "Tipo de arquivo não permitido" }, { status: 400 });
  }

  const timestamp = Date.now();
  const safeName = `${timestamp}-${file_name.replace(/[^a-zA-Z0-9._-]/g, "")}`;
  const storagePath = `uploads/${safeName}`;

  const { data, error } = await supabase.storage
    .from("document-photos")
    .createSignedUploadUrl(storagePath);

  if (error) {
    console.error("[upload] Erro ao gerar signed URL:", error);
    return NextResponse.json({ error: "Erro ao gerar URL de upload" }, { status: 500 });
  }

  return NextResponse.json({
    url: data.signedUrl,
    path: storagePath,
  });
}
