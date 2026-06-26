"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface VagaEntry {
  label: string;
  buyer_name: string;
}

export default function NewForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"single" | "multi">("single");
  const [vagas, setVagas] = useState<VagaEntry[]>([
    { label: "Vaga 1", buyer_name: "" },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const addVaga = () => {
    setVagas((prev) => [
      ...prev,
      { label: `Vaga ${prev.length + 1}`, buyer_name: "" },
    ]);
  };

  const removeVaga = (idx: number) => {
    setVagas((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateVaga = (idx: number, field: keyof VagaEntry, value: string) => {
    setVagas((prev) =>
      prev.map((v, i) => (i === idx ? { ...v, [field]: value } : v))
    );
  };

  const generateSlug = (title: string) => {
    const prefix = title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 30);
    const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${suffix}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!title.trim()) {
      setError("Título é obrigatório");
      setLoading(false);
      return;
    }

    const slug = generateSlug(title);
    const vagasData = type === "single"
      ? [{ label: "Vaga 1", buyer_name: vagas[0]?.buyer_name || "" }]
      : vagas.filter((v) => v.buyer_name.trim());

    if (vagasData.length === 0) {
      setError("Adicione pelo menos uma vaga com nome do comprador");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, slug, type, vagas: vagasData }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao criar formulário");
      }

      const { form } = await res.json();
      router.push(`/admin/forms/${form.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar formulário");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm text-muted-foreground">Dashboard</span>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm text-foreground">Novo Formulário</span>
        </div>
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">Novo Formulário</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Crie um novo formulário para coleta de dados de passageiros
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados do Formulário</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Título"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Cruzeiro Black 2026 - Cabine 42"
              required
            />

            <Select
              label="Tipo de formulário"
              value={type}
              onChange={(e) => setType(e.target.value as "single" | "multi")}
              options={[
                { value: "single", label: "Vaga única" },
                { value: "multi", label: "Multi vagas" },
              ]}
            />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Vagas</label>
                {type === "multi" && (
                  <Button type="button" variant="outline" size="sm" onClick={addVaga}>
                    + Adicionar vaga
                  </Button>
                )}
              </div>

              <div className="space-y-3">
                {vagas.map((vaga, idx) => (
                  <div key={idx} className="flex gap-3 items-start rounded-lg border border-border bg-muted/30 p-4">
                    <div className="flex-1 space-y-3">
                      {type === "multi" && (
                        <Input
                          label="Identificação"
                          value={vaga.label}
                          onChange={(e) => updateVaga(idx, "label", e.target.value)}
                          placeholder="Vaga 1"
                        />
                      )}
                      <Input
                        label="Nome do comprador"
                        value={vaga.buyer_name}
                        onChange={(e) => updateVaga(idx, "buyer_name", e.target.value)}
                        placeholder="Nome de quem comprou a vaga"
                        required
                      />
                    </div>
                    {type === "multi" && vagas.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeVaga(idx)}
                        className="mt-6 text-muted-foreground hover:text-destructive transition-colors text-sm"
                      >
                        Remover
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive" role="alert">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="submit" loading={loading}>
                Criar Formulário
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push("/admin")}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
