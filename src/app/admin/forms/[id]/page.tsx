import Link from "next/link";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CopyUrlButton } from "@/components/admin/CopyUrlButton";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function FormDetail({ params }: PageProps) {
  const { id } = await params;
  const supabase = createServiceRoleClient();

  const { data: form, error: formError } = await supabase
    .from("forms")
    .select("*")
    .eq("id", id)
    .single();

  if (formError || !form) notFound();

  const { data: vagas } = await supabase
    .from("vagas")
    .select("*")
    .eq("form_id", id)
    .order("sort_order", { ascending: true });

  const { data: passengers } = await supabase
    .from("passengers")
    .select("id, vaga_id, full_name, cpf, status, confirmed_at")
    .eq("form_id", id)
    .order("created_at", { ascending: false }) as unknown as { data: Array<{ id: string; vaga_id: string; full_name: string; cpf: string; status: string; confirmed_at: string | null }> | null };

  const vagasList = vagas as Array<{ id: string; label: string; buyer_name: string; sort_order: number; created_at: string; form_id: string }> | null;
  const passengersList = passengers;
  const vagasWithPassenger = (vagasList || []).map((v) => ({
    ...v,
    passenger: passengersList?.find((p) => p.vaga_id === v.id) || null,
  }));

  const confirmedCount = passengersList?.filter((p) => p.status === "confirmed").length || 0;

  const baseUrl = process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : `https://${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace("https://", "").split(".")[0] || "localhost:3000"}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Dashboard
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-sm text-foreground">{form.title}</span>
          </div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">{form.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {form.type === "single" ? "Vaga única" : "Multi vagas"}
            {" · "}
            {confirmedCount} de {vagas?.length || 0} preenchidos
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin">
            <Button variant="outline" size="sm">Voltar</Button>
          </Link>
        </div>
      </div>

      {/* Share link */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Link do formulário</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <code className="flex-1 rounded-lg border border-input bg-muted px-3 py-2 text-sm text-foreground break-all">
              {baseUrl}/f/{form.slug}
            </code>
            <CopyUrlButton url={`${baseUrl}/f/${form.slug}`} />
          </div>
        </CardContent>
      </Card>

      {/* Vagas & Submissions */}
      <Card>
        <CardHeader>
          <CardTitle>Vagas e Submissões</CardTitle>
        </CardHeader>
        <CardContent>
          {vagasWithPassenger && vagasWithPassenger.length > 0 ? (
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Vaga</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Comprador</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Passageiro</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">CPF</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Confirmado em</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {vagasWithPassenger.map((v) => (
                    <tr key={v.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground">{v.label}</td>
                      <td className="px-4 py-3 text-foreground">{v.buyer_name}</td>
                      <td className="px-4 py-3">
                        {v.passenger ? (
                          <Badge variant="success">Preenchido</Badge>
                        ) : (
                          <Badge variant="secondary">Pendente</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        {v.passenger?.full_name || "-"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {v.passenger?.cpf || "-"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {v.passenger?.confirmed_at
                          ? new Date(v.passenger.confirmed_at).toLocaleString("pt-BR")
                          : "-"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {v.passenger && (
                          <Link
                            href={`/admin/passengers/${v.passenger.id}`}
                            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-hover transition-colors"
                          >
                            Detalhes
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                            </svg>
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex items-center justify-center py-12 text-center">
              <p className="text-sm text-muted-foreground">Nenhuma vaga cadastrada</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
