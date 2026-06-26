import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = createServiceRoleClient();

  const { data: form, error: formError } = await supabase
    .from("forms")
    .select("id, slug, title, type, status")
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  if (formError || !form) {
    return NextResponse.json({ error: "Formulário não encontrado" }, { status: 404 });
  }

  const { data: vagas } = await supabase
    .from("vagas")
    .select("id, label, buyer_name, sort_order")
    .eq("form_id", form.id)
    .order("sort_order", { ascending: true });

  return NextResponse.json({ form, vagas: vagas || [] });
}
