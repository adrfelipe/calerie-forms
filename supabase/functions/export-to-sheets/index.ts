import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SHEET_ID = Deno.env.get("GOOGLE_SHEET_ID")!;
const SERVICE_ACCOUNT_KEY = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface QueueItem {
  id: string;
  passenger_id: string;
  form_id: string;
  status: string;
  sync_id: string | null;
}

interface PassengerRow {
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
  vagas: { label: string; buyer_name: string } | null;
  forms: { title: string; slug: string } | null;
}

// Google Sheets API helper using service account JWT
async function appendToSheet(rows: string[][]) {
  const { GoogleAuth } = await import("npm:google-auth-library@9");
  const { google } = await import("npm:googleapis@144");

  const auth = new GoogleAuth({
    credentials: JSON.parse(SERVICE_ACCOUNT_KEY),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });

  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: "Sheet1!A1",
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: rows },
  });
}

async function readExistingSyncIds(): Promise<Set<string>> {
  try {
    const { GoogleAuth } = await import("npm:google-auth-library@9");
    const { google } = await import("npm:googleapis@144");

    const auth = new GoogleAuth({
      credentials: JSON.parse(SERVICE_ACCOUNT_KEY),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: "Sheet1!A1:Z",
    });

    const rows = res.data.values as string[][] | undefined;
    if (!rows || rows.length <= 1) return new Set();

    const existingIds = new Set<string>();
    for (let i = 1; i < rows.length; i++) {
      const syncId = rows[i][25]?.trim();
      if (syncId) existingIds.add(syncId);
    }
    return existingIds;
  } catch {
    return new Set();
  }
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

async function processQueue() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  // Read existing sync IDs from Google Sheets
  const existingSyncIds = await readExistingSyncIds();

  // Fetch pending items with sync_id
  const { data: queueItems, error: queueError } = await supabase
    .from("export_queue")
    .select(`
      id, passenger_id, form_id, status, sync_id,
      passengers!inner(
        vaga_id, full_name, cpf, passport_number, passport_expiry,
        date_of_birth, mobile_whatsapp, email, origin_airport, notes,
        emergency_name, emergency_phone, address_cep, address_street,
        address_number, address_complement, address_neighborhood,
        address_city, address_state, confirmed_at, submitted_at,
        vagas(label, buyer_name),
        forms(title, slug)
      )
    `)
    .eq("status", "pending")
    .limit(50)
    .returns<Array<QueueItem & { passengers: PassengerRow }>>();

  if (queueError || !queueItems || queueItems.length === 0) {
    return { processed: 0 };
  }

  // Filter out items already in the sheet
  const newItems = queueItems.filter(
    (item) => !item.sync_id || !existingSyncIds.has(item.sync_id)
  );

  // Mark skipped items as completed
  const skippedIds = queueItems
    .filter((item) => item.sync_id && existingSyncIds.has(item.sync_id))
    .map((item) => item.id);

  if (skippedIds.length > 0) {
    await supabase.from("export_queue").update({
      status: "completed",
      processed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).in("id", skippedIds);
  }

  if (newItems.length === 0) {
    return { processed: 0 };
  }

  const rows: string[][] = [];
  const completedIds: string[] = [];

  for (const item of newItems) {
    const p = item.passengers;
    const syncId = item.sync_id || crypto.randomUUID();
    rows.push([
      p.forms?.title || "",
      p.forms?.slug || "",
      p.vagas?.label || "",
      p.vagas?.buyer_name || "",
      p.full_name,
      p.cpf,
      p.passport_number,
      p.passport_expiry,
      p.date_of_birth,
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
    ]);
    completedIds.push(item.id);
  }

  try {
    await appendToSheet(rows);

    // Mark items as completed
    const { error: updateError } = await supabase
      .from("export_queue")
      .update({
        status: "completed",
        processed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .in("id", completedIds);

    if (updateError) throw updateError;
  } catch (err) {
    // Mark as failed with retry
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    for (const id of completedIds) {
      await supabase
        .from("export_queue")
        .update({
          status: "failed",
          error_message: errorMsg,
          updated_at: new Date().toISOString(),
        } as Record<string, unknown>)
        .eq("id", id);
    }
    return { processed: 0, error: errorMsg };
  }

  return { processed: rows.length };
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const result = await processQueue();
    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500 }
    );
  }
});
