"use client";

import { useState } from "react";

export function SyncButton() {
  const [loading, setLoading] = useState(false);

  return (
    <button
      disabled={loading}
      onClick={async () => {
        if (loading) return;
        setLoading(true);
        try {
          const res = await fetch("/api/admin/sync-sheets");
          const data = await res.json();
          alert(data.message || (data.processed > 0 ? `Sincronizado: ${data.processed} registro(s)` : "Nenhum registro pendente"));
        } catch {
          alert("Erro ao sincronizar");
        } finally {
          setLoading(false);
        }
      }}
      className="inline-flex items-center justify-center rounded-lg border border-input bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? "Sincronizando…" : "Sincronizar Sheets"}
    </button>
  );
}
