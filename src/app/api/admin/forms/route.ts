import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = createServiceRoleClient();
  const body = await req.json();
  const { title, slug, type, vagas } = body;

  if (!title || !slug || !type || !vagas || !Array.isArray(vagas) || vagas.length === 0) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  if (!["single", "multi"].includes(type)) {
    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  }

  // Create form
  const { data: form, error: formError } = await supabase
    .from("forms")
    .insert({ title, slug, type })
    .select("id, slug, title, type")
    .single();

  if (formError) {
    return NextResponse.json({ error: "Erro ao criar formulário" }, { status: 500 });
  }

  // Create vagas
  const vagasData = vagas.map((v: { label: string; buyer_name: string }, i: number) => ({
    form_id: form.id,
    label: v.label || `Vaga ${i + 1}`,
    buyer_name: v.buyer_name,
    sort_order: i,
  }));

  const { error: vagasError } = await supabase.from("vagas").insert(vagasData);

  if (vagasError) {
    // Cleanup form if vagas fail
    await supabase.from("forms").delete().eq("id", form.id);
    return NextResponse.json({ error: "Erro ao criar vagas" }, { status: 500 });
  }

  return NextResponse.json({ form }, { status: 201 });
}
