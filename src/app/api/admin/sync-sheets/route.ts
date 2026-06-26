import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { GoogleAuth } from "google-auth-library";

async function getGoogleAccessToken(): Promise<string> {
  const auth = new GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY!),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  return token.token!;
}

async function appendToSheet(rows: string[][]): Promise<string | null> {
  try {
    const token = await getGoogleAccessToken();
    const sheetId = process.env.GOOGLE_SHEET_ID!;

    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Forms!A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ values: rows }),
      }
    );

    if (!res.ok) {
      const errBody = await res.text();
      return `Erro ao exportar: ${res.status} - ${errBody}`;
    }

    return null;
  } catch (err) {
    return err instanceof Error ? err.message : "Erro desconhecido ao exportar";
  }
}

async function readExistingSyncIds(): Promise<Set<string>> {
  try {
    const token = await getGoogleAccessToken();
    const sheetId = process.env.GOOGLE_SHEET_ID!;

    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Forms!A1:Z`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!res.ok) return new Set();

    const data = await res.json();
    const rows = data.values as string[][] | undefined;
    if (!rows || rows.length <= 1) return new Set(); // header only or empty

    const existingIds = new Set<string>();
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      // sync_id is the last column (index Z = 25)
      const syncId = row[25]?.trim();
      if (syncId) existingIds.add(syncId);
    }
    return existingIds;
  } catch {
    return new Set();
  }
}

export async function GET() {
  const result = await doSync();
  return NextResponse.json(result);
}

export async function POST() {
  const result = await doSync();
  return NextResponse.json(result);
}

interface PendingItem {
  id: string;
  passenger_id: string;
  form_id: string;
  retry_count: number;
  sync_id: string | null;
}

interface PassengerItem {
  id: string;
  vaga_id: string;
  full_name: string;
  cpf: string;
  passport_number: string;
  passport_expiry: string;
  date_of_birth: string;
  mobile_whatsapp: string;
  email: string;
  origin_airport: string;
  notes: string;
  emergency_name: string;
  emergency_phone: string;
  address_cep: string;
  address_street: string;
  address_number: string;
  address_complement: string;
  address_neighborhood: string;
  address_city: string;
  address_state: string;
  confirmed_at: string;
  submitted_at: string;
}

function formatTimestamp(dateStr: string): string {
  const d = new Date(dateStr);
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const min = String(d.getUTCMinutes()).padStart(2, "0");
  const ss = String(d.getUTCSeconds()).padStart(2, "0");
  return `${dd}/${mm} ${hh}:${min}:${ss}`;
}

async function doSync() {
  const supabase = createServiceRoleClient();

  // Read existing sync IDs from Google Sheets to avoid duplicates
  const existingSyncIds = await readExistingSyncIds();

  // Select pending items first (separate from update for reliability)
  const { data: pending, error: selectError } = await supabase
    .from("export_queue")
    .select("id, passenger_id, form_id, retry_count, sync_id")
    .eq("status", "pending")
    .limit(50)
    .order("created_at", { ascending: true });

  if (selectError || !pending || pending.length === 0) {
    return { processed: 0, message: "Nenhum item pendente" };
  }

  // Mark them as processing
  const pendingIds = pending.map((p: PendingItem) => p.id);
  await supabase
    .from("export_queue")
    .update({ status: "processing", updated_at: new Date().toISOString() })
    .in("id", pendingIds);

  // Filter out items whose sync_id already exists in the sheet
  const newItems = pending
    ? pending.filter((item: PendingItem) => !item.sync_id || !existingSyncIds.has(item.sync_id))
    : [];

  // Mark skipped items as completed (already synced)
  const skippedIds = pending
    ? pending.filter((item: PendingItem) => item.sync_id && existingSyncIds.has(item.sync_id)).map((i: PendingItem) => i.id)
    : [];

  if (skippedIds.length > 0) {
    await supabase.from("export_queue").update({
      status: "completed",
      processed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).in("id", skippedIds);
  }

  if (newItems.length === 0) {
    // Restore items back to pending since nothing new to sync
    await supabase.from("export_queue")
      .update({ status: "pending", updated_at: new Date().toISOString() })
      .in("id", pendingIds);
    return { processed: 0, message: "Nenhum item pendente" };
  }

  // Fetch all passenger data for new items
  const passengerIds = newItems.map((p: PendingItem) => p.passenger_id);
  const { data: passengers, error: passError } = await supabase
    .from("passengers")
    .select(`
      id, vaga_id, full_name, cpf, passport_number, passport_expiry,
      date_of_birth, mobile_whatsapp, email, origin_airport, notes,
      emergency_name, emergency_phone, address_cep, address_street,
      address_number, address_complement, address_neighborhood,
      address_city, address_state, confirmed_at, submitted_at
    `)
    .in("id", passengerIds) as unknown as { data: PassengerItem[] | null; error: unknown };

  if (passError || !passengers) {
    return { error: "Erro ao buscar dados dos passageiros" };
  }

  // Fetch vagas and forms data
  const vagaIds = passengers.map((p: PassengerItem) => p.vaga_id).filter(Boolean);
  const formIds = newItems.map((p: PendingItem) => p.form_id).filter(Boolean);

  const [vagasRes, formsRes] = await Promise.all([
    supabase.from("vagas").select("id, label, buyer_name").in("id", vagaIds),
    supabase.from("forms").select("id, title, slug").in("id", formIds),
  ]);

  const vagasArr = vagasRes.data as Array<{ id: string; label: string; buyer_name: string }> | null;
  const formsArr = formsRes.data as Array<{ id: string; title: string; slug: string }> | null;
  const vagasMap = new Map((vagasArr || []).map((v) => [v.id, v]));
  const formsMap = new Map((formsArr || []).map((f) => [f.id, f]));

  // Build rows with sync_id as last column
  const rows: string[][] = newItems
    .map((item: PendingItem) => {
      const p = passengers.find((ps: PassengerItem) => ps.id === item.passenger_id);
      if (!p) return null;
      const vaga = vagasMap.get(p.vaga_id);
      const form = formsMap.get(item.form_id);
      const syncId = item.sync_id || crypto.randomUUID();

      return [
        form?.title || "",
        form?.slug || "",
        vaga?.label || "",
        vaga?.buyer_name || "",
        p.full_name,
        p.cpf,
        p.passport_number,
        p.passport_expiry?.split("T")[0] || "",
        p.date_of_birth?.split("T")[0] || "",
        p.mobile_whatsapp,
        p.email,
        p.origin_airport,
        p.notes || "",
        p.emergency_name,
        p.emergency_phone,
        p.address_cep,
        p.address_street,
        p.address_number || "",
        p.address_complement || "",
        p.address_neighborhood,
        p.address_city,
        p.address_state,
        p.confirmed_at ? formatTimestamp(p.confirmed_at) : "",
        p.submitted_at ? formatTimestamp(p.submitted_at) : "",
        syncId,
      ];
    })
    .filter(Boolean) as string[][];

  if (!process.env.GOOGLE_SHEET_ID || !process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    return {
      processed: rows.length,
      pending_rows: rows.length,
      message: `${rows.length} registro(s) prontos, mas Google Sheets não configurado. Configure as variáveis.`,
    };
  }

  // Write to Google Sheets
  const sheetError = await appendToSheet(rows);
  if (sheetError) {
    for (const item of newItems) {
      await supabase
        .from("export_queue")
        .update({
          status: "failed",
          error_message: sheetError,
          updated_at: new Date().toISOString(),
        } as Record<string, unknown>)
        .eq("id", item.id);
    }
    return { processed: 0, error: sheetError };
  }

  // Mark all as completed
  const newIds = newItems.map((item: PendingItem) => item.id);
  await supabase
    .from("export_queue")
    .update({
      status: "completed",
      processed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .in("id", newIds);

  return {
    processed: rows.length,
    message: `${rows.length} registro(s) exportado(s) com sucesso.`,
  };
}
