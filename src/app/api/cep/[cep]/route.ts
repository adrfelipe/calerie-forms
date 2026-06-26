import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ cep: string }> }
) {
  const { cep } = await params;
  const digits = cep.replace(/\D/g, "");

  if (digits.length !== 8) {
    return NextResponse.json({ error: "CEP deve ter 8 dígitos" }, { status: 400 });
  }

  try {
    const res = await fetch(`https://brasilapi.com.br/api/cep/v2/${digits}`);
    if (!res.ok) {
      if (res.status === 404) {
        return NextResponse.json({ error: "CEP não encontrado" }, { status: 404 });
      }
      return NextResponse.json({ error: "Erro ao consultar CEP" }, { status: 502 });
    }
    const data = await res.json();
    return NextResponse.json({
      cep: data.cep,
      street: data.street || "",
      neighborhood: data.neighborhood || "",
      city: data.city || "",
      state: data.state || "",
    });
  } catch {
    return NextResponse.json({ error: "Erro de conexão" }, { status: 502 });
  }
}
