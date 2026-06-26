import Link from "next/link";

export default function FormNotFound() {
  return (
    <div className="flex items-center justify-center min-h-dvh p-4">
      <div className="text-center space-y-4 max-w-md">
        <h1 className="text-2xl font-semibold text-ink">Formulário não encontrado</h1>
        <p className="text-ink-muted">
          Este formulário pode estar expirado ou o link está incorreto.
          Entre em contato com a Calerie Brasil para mais informações.
        </p>
      </div>
    </div>
  );
}
