import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { passengerSchema, insuranceSchema } from "@/lib/validation/schemas";
import { toSheetRow, appendToSheet } from "@/lib/google-sheets";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = createServiceRoleClient();

  // Validate form exists and is active
  const { data: form } = await supabase
    .from("forms")
    .select("id, type")
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  if (!form) {
    return NextResponse.json({ error: "Formulário não encontrado" }, { status: 404 });
  }

  const body = await req.json();
  const { vaga_id, passenger_data, insurance_data } = body;

  if (!vaga_id) {
    return NextResponse.json({ error: "Vaga não informada" }, { status: 400 });
  }

  // Validate vaga belongs to this form
  const { data: vaga } = await supabase
    .from("vagas")
    .select("id")
    .eq("id", vaga_id)
    .eq("form_id", form.id)
    .single();

  if (!vaga) {
    return NextResponse.json({ error: "Vaga não encontrada neste formulário" }, { status: 400 });
  }

  // Check if vaga already has a confirmed submission
  const { data: existing } = await supabase
    .from("passengers")
    .select("id")
    .eq("vaga_id", vaga_id)
    .eq("status", "confirmed")
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "Esta vaga já foi preenchida" }, { status: 409 });
  }

  // Validate data
  const passengerResult = passengerSchema.safeParse(passenger_data);
  if (!passengerResult.success) {
    return NextResponse.json(
      { error: "Dados do passageiro inválidos", details: passengerResult.error.flatten() },
      { status: 400 }
    );
  }

  const insuranceResult = insuranceSchema.safeParse(insurance_data);
  if (!insuranceResult.success) {
    return NextResponse.json(
      { error: "Dados do seguro inválidos", details: insuranceResult.error.flatten() },
      { status: 400 }
    );
  }

  // Dates come as YYYY-MM-DD from type="date" inputs
  const parseDateOfBirth = (val: string) => val;
  const parsePassportExpiry = (val: string) => val;

  // Accept optional photo paths to insert server-side
  const { cpf_photo_path, passport_photo_path } = body;

  const { data: passenger, error: insertError } = await supabase
    .from("passengers")
    .insert({
      vaga_id,
      form_id: form.id,
      status: "confirmed",
      full_name: passengerResult.data.full_name,
      cpf: passengerResult.data.cpf,
      passport_number: passengerResult.data.passport_number,
      passport_expiry: parsePassportExpiry(passengerResult.data.passport_expiry),
      date_of_birth: parseDateOfBirth(passengerResult.data.date_of_birth),
      mobile_whatsapp: passengerResult.data.mobile_whatsapp,
      email: passengerResult.data.email,
      origin_airport: passengerResult.data.origin_airport,
      notes: passengerResult.data.notes || "",
      emergency_name: insuranceResult.data.emergency_name,
      emergency_phone: insuranceResult.data.emergency_phone,
      address_cep: insuranceResult.data.address_cep,
      address_street: insuranceResult.data.address_street,
      address_number: insuranceResult.data.address_number || "",
      address_complement: insuranceResult.data.address_complement || "",
      address_neighborhood: insuranceResult.data.address_neighborhood,
      address_city: insuranceResult.data.address_city,
      address_state: insuranceResult.data.address_state,
      confirmed_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (insertError) {
    return NextResponse.json({ error: "Erro ao salvar dados" }, { status: 500 });
  }

  // Insert photo references server-side (avoids RLS issue with anon key)
  if (cpf_photo_path || passport_photo_path) {
    const photoRows = [];
    if (cpf_photo_path) photoRows.push({ passenger_id: passenger.id, type: "cpf", storage_path: cpf_photo_path });
    if (passport_photo_path) photoRows.push({ passenger_id: passenger.id, type: "passport", storage_path: passport_photo_path });
    await supabase.from("document_photos").insert(photoRows);
  }

  // Write directly to Google Sheets
  const syncId = crypto.randomUUID();

  // Fetch form + vaga data for the sheet row
  const [formRes, vagaRes] = await Promise.all([
    supabase.from("forms").select("title, slug").eq("id", form.id).single(),
    supabase.from("vagas").select("label, buyer_name").eq("id", vaga_id).single(),
  ]);

  const sheetRow = toSheetRow({
    formTitle: formRes.data?.title || "",
    formSlug: formRes.data?.slug || "",
    vagaLabel: vagaRes.data?.label || "",
    buyerName: vagaRes.data?.buyer_name || "",
    fullName: passengerResult.data.full_name,
    cpf: passengerResult.data.cpf,
    passportNumber: passengerResult.data.passport_number,
    passportExpiry: passengerResult.data.passport_expiry,
    dateOfBirth: passengerResult.data.date_of_birth,
    mobileWhatsapp: passengerResult.data.mobile_whatsapp,
    email: passengerResult.data.email,
    originAirport: passengerResult.data.origin_airport,
    notes: passengerResult.data.notes || "",
    emergencyName: insuranceResult.data.emergency_name,
    emergencyPhone: insuranceResult.data.emergency_phone,
    addressCep: insuranceResult.data.address_cep,
    addressStreet: insuranceResult.data.address_street,
    addressNumber: insuranceResult.data.address_number || "",
    addressComplement: insuranceResult.data.address_complement || "",
    addressNeighborhood: insuranceResult.data.address_neighborhood,
    addressCity: insuranceResult.data.address_city,
    addressState: insuranceResult.data.address_state,
    confirmedAt: new Date().toISOString(),
    submittedAt: new Date().toISOString(),
    syncId,
  });

  const sheetResult = await appendToSheet([sheetRow]);
  if (!sheetResult.ok) {
    console.error("Falha ao exportar para Google Sheets:", sheetResult.error);
  }

  return NextResponse.json({ success: true, passenger_id: passenger.id });
}
