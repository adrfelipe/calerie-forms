export async function fetchCep(cep: string): Promise<{
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  error?: string;
}> {
  const digits = cep.replace(/\D/g, "");
  if (digits.length !== 8) {
    return { street: "", neighborhood: "", city: "", state: "", error: "CEP deve ter 8 dígitos" };
  }

  try {
    const res = await fetch(`https://brasilapi.com.br/api/cep/v2/${digits}`);
    if (!res.ok) {
      if (res.status === 404) {
        return { street: "", neighborhood: "", city: "", state: "", error: "CEP não encontrado" };
      }
      return { street: "", neighborhood: "", city: "", state: "", error: "Erro ao consultar CEP" };
    }
    const data = await res.json();
    return {
      street: data.street || "",
      neighborhood: data.neighborhood || "",
      city: data.city || "",
      state: data.state || "",
    };
  } catch {
    return { street: "", neighborhood: "", city: "", state: "", error: "Erro de conexão ao consultar CEP" };
  }
}
