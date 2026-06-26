import { createServiceRoleClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getPhotoUrl(supabase: ReturnType<typeof createServiceRoleClient>, path: string) {
  const { data } = await supabase.storage
    .from("document-photos")
    .createSignedUrl(path, 3600);
  return data?.signedUrl || null;
}

export default async function PassengerDetail({ params }: PageProps) {
  const { id } = await params;
  const supabase = createServiceRoleClient();

  const { data: passenger, error } = await supabase
    .from("passengers")
    .select("*, vagas(label, buyer_name), forms(title, slug)")
    .eq("id", id)
    .single();

  if (error || !passenger) notFound();

  const { data: photos } = await supabase
    .from("document_photos")
    .select("type, storage_path, mime_type")
    .eq("passenger_id", id);

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
            <Link href={`/admin/forms/${passenger.form_id}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {passenger.forms?.title}
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-sm text-foreground">{passenger.full_name}</span>
          </div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">{passenger.full_name}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {passenger.forms?.title} · {passenger.vagas?.label}
          </p>
        </div>
        <Link href={`/admin/forms/${passenger.form_id}`}>
          <Button variant="outline" size="sm">Voltar</Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Dados do Passageiro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field label="Comprador" value={passenger.vagas?.buyer_name} />
            <Field label="Nome completo" value={passenger.full_name} />
            <Field label="CPF" value={passenger.cpf} />
            <Field label="Passaporte" value={passenger.passport_number} />
            <Field label="Validade Passaporte" value={passenger.passport_expiry} />
            <Field label="Data de Nascimento" value={passenger.date_of_birth} />
            <Field label="Celular" value={passenger.mobile_whatsapp} />
            <Field label="Email" value={passenger.email} />
            <Field label="Aeroporto" value={passenger.origin_airport} />
            {passenger.notes && <Field label="Observação" value={passenger.notes} />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Seguro Viagem</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field label="Contato Emergência" value={passenger.emergency_name} />
            <Field label="Tel. Emergência" value={passenger.emergency_phone} />
            <Field label="CEP" value={passenger.address_cep} />
            <Field label="Endereço" value={`${passenger.address_street}, ${passenger.address_number}`} />
            {passenger.address_complement && <Field label="Complemento" value={passenger.address_complement} />}
            <Field label="Bairro" value={passenger.address_neighborhood} />
            <Field label="Cidade/Estado" value={`${passenger.address_city}/${passenger.address_state}`} />
          </CardContent>
        </Card>
      </div>

      {photos && photos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Documentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {await Promise.all(photos.map(async (photo: { type: string; storage_path: string }) => {
                const url = await getPhotoUrl(supabase, photo.storage_path);
                return (
                  <div key={photo.type} className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
                    <p className="text-sm font-medium text-foreground">
                      {photo.type === "cpf" ? "Foto do CPF" : "Foto do Passaporte"}
                    </p>
                    {url ? (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-hover transition-colors"
                      >
                        Abrir foto
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                      </a>
                    ) : (
                      <p className="text-sm text-muted-foreground">Link expirado</p>
                    )}
                  </div>
                );
              }))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="space-y-1 pt-6">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Status:</span>
            <Badge variant={passenger.status === "confirmed" ? "success" : "secondary"}>
              {passenger.status === "confirmed" ? "Confirmado" : "Rascunho"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Enviado em: {new Date(passenger.submitted_at).toLocaleString("pt-BR")}
          </p>
          {passenger.confirmed_at && (
            <p className="text-sm text-muted-foreground">
              Confirmado em: {new Date(passenger.confirmed_at).toLocaleString("pt-BR")}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="border-b border-border/50 pb-2 last:border-0 last:pb-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground font-medium">{value || "-"}</p>
    </div>
  );
}
