import { createServiceRoleClient } from "@/lib/supabase/server";
import { FormShell } from "@/components/forms/FormShell";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function FormPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = createServiceRoleClient();

  const { data: form, error: formError } = await supabase
    .from("forms")
    .select("id, slug, title, type, status")
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  if (formError || !form) {
    notFound();
  }

  const { data: vagas } = await supabase
    .from("vagas")
    .select("id, label, buyer_name, sort_order")
    .eq("form_id", form.id)
    .order("sort_order", { ascending: true });

  // Get already submitted vaga IDs
  const { data: submittedPassengers } = await supabase
    .from("passengers")
    .select("vaga_id")
    .eq("form_id", form.id)
    .eq("status", "confirmed");

  const rawPassengers = (submittedPassengers || []) as { vaga_id: string }[];
  const submittedVagaIds = new Set<string>(rawPassengers.map((p) => p.vaga_id));

  return (
    <FormShell
      form={form}
      vagas={vagas || []}
      submittedVagaIds={submittedVagaIds}
    />
  );
}
