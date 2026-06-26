"use client";

export function CopyUrlButton({ url }: { url: string }) {
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
        } catch {}
      }}
      className="inline-flex items-center justify-center rounded-lg border border-input bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
    >
      Copiar
    </button>
  );
}
