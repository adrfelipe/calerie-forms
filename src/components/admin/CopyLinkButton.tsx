"use client";

export function CopyLinkButton({ slug }: { slug: string }) {
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(
            `${window.location.origin}/f/${slug}`
          );
        } catch {}
      }}
      className="text-primary hover:text-primary-hover text-xs font-medium transition-colors"
      title="Copiar link"
    >
      Copiar link
    </button>
  );
}
