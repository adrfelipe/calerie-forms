import { GoogleAuth } from "google-auth-library";

function formatTimestamp(dateStr: string): string {
  const d = new Date(dateStr);
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const min = String(d.getUTCMinutes()).padStart(2, "0");
  const ss = String(d.getUTCSeconds()).padStart(2, "0");
  return `${dd}/${mm} ${hh}:${min}:${ss}`;
}

export interface SheetRowData {
  formTitle: string;
  formSlug: string;
  vagaLabel: string;
  buyerName: string;
  fullName: string;
  cpf: string;
  passportNumber: string;
  passportExpiry: string;
  dateOfBirth: string;
  mobileWhatsapp: string;
  email: string;
  originAirport: string;
  notes: string;
  emergencyName: string;
  emergencyPhone: string;
  addressCep: string;
  addressStreet: string;
  addressNumber: string;
  addressComplement: string;
  addressNeighborhood: string;
  addressCity: string;
  addressState: string;
  confirmedAt: string;
  submittedAt: string;
  syncId: string;
}

export function toSheetRow(data: SheetRowData): string[] {
  return [
    data.formTitle,
    data.formSlug,
    data.vagaLabel,
    data.buyerName,
    data.fullName,
    data.cpf,
    data.passportNumber,
    data.passportExpiry?.split("T")[0] || "",
    data.dateOfBirth?.split("T")[0] || "",
    data.mobileWhatsapp,
    data.email,
    data.originAirport,
    data.notes || "",
    data.emergencyName,
    data.emergencyPhone,
    data.addressCep,
    data.addressStreet,
    data.addressNumber || "",
    data.addressComplement || "",
    data.addressNeighborhood,
    data.addressCity,
    data.addressState,
    data.confirmedAt ? formatTimestamp(data.confirmedAt) : "",
    data.submittedAt ? formatTimestamp(data.submittedAt) : "",
    data.syncId,
  ];
}

export async function appendToSheet(rows: string[][]): Promise<{ ok: true } | { ok: false; error: string }> {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const serviceKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

  if (!sheetId || !serviceKey) {
    return { ok: false, error: "Google Sheets não configurado" };
  }

  try {
    const auth = new GoogleAuth({
      credentials: JSON.parse(serviceKey),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const client = await auth.getClient();
    const token = await client.getAccessToken();

    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Forms!A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token.token!}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ values: rows }),
      }
    );

    if (!res.ok) {
      const errBody = await res.text();
      return { ok: false, error: `Erro Google Sheets: ${res.status} - ${errBody}` };
    }

    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Erro desconhecido ao exportar para Sheets" };
  }
}
