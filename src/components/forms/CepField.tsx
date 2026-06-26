"use client";

import { Input } from "@/components/ui/Input";
import { useState } from "react";

interface AddressData {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}

interface CepFieldProps {
  value: string;
  error?: string;
  onChange: (cep: string) => void;
  onAddressFound: (data: AddressData) => void;
}

export function CepField({ value, error, onChange, onAddressFound }: CepFieldProps) {
  const [loading, setLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const handleBlur = async () => {
    const digits = value.replace(/\D/g, "");
    if (digits.length !== 8) return;

    setLoading(true);
    setLookupError(null);

    try {
      const res = await fetch(`/api/cep/${digits}`);
      if (!res.ok) {
        const msg = res.status === 404 ? "CEP não encontrado" : "Erro ao consultar CEP";
        setLookupError(`${msg}. Preencha o endereço manualmente.`);
        return;
      }
      const data = await res.json();
      onAddressFound(data);
    } catch {
      setLookupError("Erro de conexão. Preencha o endereço manualmente.");
    } finally {
      setLoading(false);
    }
  };

  const formatCep = (val: string) => {
    const d = val.replace(/\D/g, "").slice(0, 8);
    if (d.length <= 5) return d;
    return `${d.slice(0, 5)}-${d.slice(5)}`;
  };

  return (
    <div className="relative">
      <Input
        label="CEP"
        placeholder="00000-000"
        value={formatCep(value)}
        error={error || lookupError || undefined}
        hint={loading ? "Consultando CEP..." : undefined}
        onChange={(e) => onChange(formatCep(e.target.value))}
        onBlur={handleBlur}
        maxLength={9}
        required
      />
    </div>
  );
}
