"use client";

import { useState, useCallback } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { FileUpload } from "@/components/ui/FileUpload";
import { CepField } from "@/components/forms/CepField";
import { ConfirmationModal } from "@/components/forms/ConfirmationModal";
import type { Form, Vaga } from "@/types/forms";

interface FormShellProps {
  form: Form;
  vagas: Vaga[];
  submittedVagaIds?: Set<string>;
}

type Step = "passenger-data" | "insurance" | "photos" | "review";

const AIRPORTS = [
  "Aeroporto Internacional de São Paulo (GRU)",
  "Aeroporto de Congonhas (CGH)",
  "Aeroporto Internacional do Rio de Janeiro (GIG)",
  "Aeroporto Santos Dumont (SDU)",
  "Aeroporto Internacional de Brasília (BSB)",
  "Aeroporto Internacional de Belo Horizonte (CNF)",
  "Aeroporto Internacional de Recife (REC)",
  "Aeroporto Internacional de Salvador (SSA)",
  "Aeroporto Internacional de Fortaleza (FOR)",
  "Aeroporto Internacional de Manaus (MAO)",
  "Aeroporto Internacional de Curitiba (CWB)",
  "Aeroporto Internacional de Porto Alegre (POA)",
  "Aeroporto Internacional de Florianópolis (FLN)",
  "Aeroporto Internacional de Belém (BEL)",
  "Aeroporto Internacional de Vitória (VIX)",
].map((a) => ({ value: a, label: a }));

function formatCPF(val: string) {
  const d = val.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function formatPhone(val: string) {
  const d = val.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}
export function FormShell({ form, vagas, submittedVagaIds }: FormShellProps) {
  const [step, setStep] = useState<Step>("passenger-data");
  const [selectedVaga, setSelectedVaga] = useState<string>(
    form.type === "single" && vagas.length > 0 ? vagas[0].id : ""
  );
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [locallySubmitted, setLocallySubmitted] = useState<Set<string>>(new Set());
  // Snapshot of submitted data for review screen
  const [submittedData, setSubmittedData] = useState<{
    passenger: typeof p;
    insurance: typeof ins;
    vaga: Vaga | undefined;
  } | null>(null);

  const currentVaga = vagas.find((v) => v.id === selectedVaga);

  // Passenger data fields
  const [p, setP] = useState({
    full_name: "",
    cpf: "",
    passport_number: "",
    passport_expiry: "",
    date_of_birth: "",
    mobile_whatsapp: "",
    email: "",
    origin_airport: "",
    notes: "",
  });
  const [pErrors, setPErrors] = useState<Record<string, string>>({});

  // Insurance data fields
  const [ins, setIns] = useState({
    emergency_name: "",
    emergency_phone: "",
    address_cep: "",
    address_street: "",
    address_number: "",
    address_complement: "",
    address_neighborhood: "",
    address_city: "",
    address_state: "",
  });
  const [insErrors, setInsErrors] = useState<Record<string, string>>({});

  // Photos
  const [cpfPhoto, setCpfPhoto] = useState<File | null>(null);
  const [cpfPreview, setCpfPreview] = useState<string | null>(null);
  const [passportPhoto, setPassportPhoto] = useState<File | null>(null);
  const [passportPreview, setPassportPreview] = useState<string | null>(null);

  const handleP = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (field === "cpf") val = formatCPF(val);
    else if (field === "mobile_whatsapp") val = formatPhone(val);
    else if (field === "date_of_birth" || field === "passport_expiry") val = e.target.value;
    setP((prev) => ({ ...prev, [field]: val }));
    setPErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleFileSelect = (type: "cpf" | "passport") => (file: File | null) => {
    if (type === "cpf") {
      setCpfPhoto(file);
      setCpfPreview(file ? URL.createObjectURL(file) : null);
    } else {
      setPassportPhoto(file);
      setPassportPreview(file ? URL.createObjectURL(file) : null);
    }
  };

  const validatePassengerData = () => {
    const errs: Record<string, string> = {};
    if (!p.full_name || p.full_name.length < 3) errs.full_name = "Nome deve ter pelo menos 3 caracteres";
    if (!p.cpf || p.cpf.replace(/\D/g, "").length !== 11) errs.cpf = "CPF inválido";
    if (!p.passport_number || p.passport_number.length < 4) errs.passport_number = "Número do passaporte inválido";
    if (!p.passport_expiry || p.passport_expiry.length < 7) errs.passport_expiry = "Data inválida (MM/AAAA)";
    if (!p.date_of_birth || p.date_of_birth.length < 10) errs.date_of_birth = "Data inválida (DD/MM/AAAA)";
    if (!p.mobile_whatsapp || p.mobile_whatsapp.replace(/\D/g, "").length < 10) errs.mobile_whatsapp = "Telefone inválido";
    if (!p.email || !p.email.includes("@")) errs.email = "Email inválido";
    if (!p.origin_airport) errs.origin_airport = "Selecione o aeroporto de origem";
    setPErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateInsurance = () => {
    const errs: Record<string, string> = {};
    if (!ins.emergency_name || ins.emergency_name.length < 3) errs.emergency_name = "Nome do contato obrigatório";
    if (!ins.emergency_phone || ins.emergency_phone.replace(/\D/g, "").length < 10) errs.emergency_phone = "Telefone inválido";
    if (!ins.address_cep || ins.address_cep.replace(/\D/g, "").length !== 8) errs.address_cep = "CEP inválido";
    if (!ins.address_street || ins.address_street.length < 3) errs.address_street = "Rua obrigatória";
    if (!ins.address_neighborhood || ins.address_neighborhood.length < 2) errs.address_neighborhood = "Bairro obrigatório";
    if (!ins.address_city || ins.address_city.length < 2) errs.address_city = "Cidade obrigatória";
    if (!ins.address_state || ins.address_state.length !== 2) errs.address_state = "Estado deve ter 2 caracteres";
    setInsErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const nextStep = useCallback(() => {
    if (step === "passenger-data") {
      if (!validatePassengerData()) return;
      setStep("insurance");
    } else if (step === "insurance") {
      if (!validateInsurance()) return;
      setStep("photos");
    } else if (step === "photos") {
      setStep("review");
    }
  }, [step, p, ins]);

  const prevStep = useCallback(() => {
    if (step === "insurance") setStep("passenger-data");
    else if (step === "photos") setStep("insurance");
    else if (step === "review") setStep("photos");
  }, [step]);

  const handleSubmit = async () => {
    if (!currentVaga) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      // Upload photos first
      const uploadPhoto = async (file: File, type: string) => {
        const urlRes = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file_name: `${type}.jpg`, content_type: file.type }),
        });
        if (!urlRes.ok) throw new Error("Erro ao preparar upload da foto");
        const { url, path } = await urlRes.json();
        await fetch(url, { method: "PUT", body: file });
        return path;
      };

      const cpfPath = cpfPhoto ? await uploadPhoto(cpfPhoto, "cpf") : null;
      const passportPath = passportPhoto ? await uploadPhoto(passportPhoto, "passport") : null;

      // Submit passenger data with photo paths
      const res = await fetch(`/api/forms/${form.slug}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vaga_id: selectedVaga,
          passenger_data: p,
          insurance_data: ins,
          cpf_photo_path: cpfPath,
          passport_photo_path: passportPath,
        }),
      });

      const contentType = res.headers.get("content-type") || "";

      if (!res.ok) {
        if (!contentType.includes("application/json")) {
          throw new Error("Erro ao enviar formulário (servidor indisponível)");
        }
        const err = await res.json();
        const detailMsg = err.details
          ? Object.entries(err.details.fieldErrors || {})
              .map(([field, msgs]) => `${field}: ${(msgs as string[]).join(", ")}`)
              .join("; ")
          : "";
        throw new Error(detailMsg || err.error || "Erro ao enviar formulário");
      }

      if (!contentType.includes("application/json")) {
        throw new Error("Erro ao enviar formulário (servidor indisponível)");
      }

      const { passenger_id } = await res.json();

      setSuccess(true);
      setShowConfirm(false);
      // Snapshot data for review before resetting
      setSubmittedData({ passenger: { ...p }, insurance: { ...ins }, vaga: currentVaga });
      // Mark vaga as submitted locally so it disappears from the selector
      setLocallySubmitted((prev) => {
        const next = new Set(prev);
        next.add(selectedVaga);
        return next;
      });
      // Reset form state for next vaga
      if (form.type === "multi") {
        setP({
          full_name: "",
          cpf: "",
          passport_number: "",
          passport_expiry: "",
          date_of_birth: "",
          mobile_whatsapp: "",
          email: "",
          origin_airport: "",
          notes: "",
        });
        setIns({
          emergency_name: "",
          emergency_phone: "",
          address_cep: "",
          address_street: "",
          address_number: "",
          address_complement: "",
          address_neighborhood: "",
          address_city: "",
          address_state: "",
        });
        setCpfPhoto(null);
        setCpfPreview(null);
        setPassportPhoto(null);
        setPassportPreview(null);
        setPErrors({});
        setInsErrors({});
        setStep("passenger-data");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao enviar formulário";
      console.error("Submit error:", msg, err);
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (success && !showReview) {
    return (
      <div className="flex items-center justify-center min-h-dvh bg-background p-4">
        <div className="bg-card rounded-xl border border-border shadow-lg p-8 sm:p-10 text-center max-w-md w-full">
          <div className="mx-auto w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-6">
            <svg className="h-8 w-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-primary leading-tight mb-3">Dados enviados com sucesso!</h1>
          <p className="text-base text-muted-foreground mb-8">
            Seus dados foram registrados para o Cruzeiro Black. Em breve entraremos em contato.
          </p>
          <div className="flex flex-col gap-3">
            {form.type === "multi" && (
              <Button onClick={() => { setSuccess(false); setSelectedVaga(""); }}>
                Preencher outra vaga
              </Button>
            )}
            <Button variant="secondary" onClick={() => setShowReview(true)}>
              Revisar dados
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Review screen after success
  if (success && showReview) {
    const rd = submittedData;
    return (
      <div className="min-h-dvh bg-background">
        <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-10 space-y-8">
          <h1 className="text-2xl font-semibold text-foreground">Revisão dos Dados</h1>

          <div className="rounded-lg border border-border bg-card p-4 space-y-2 text-sm">
            <p className="font-semibold text-foreground border-b border-border pb-2 mb-2">Dados do Passageiro</p>
            <p><span className="text-muted-foreground">Comprador:</span> <span className="font-medium">{rd?.vaga?.buyer_name}</span></p>
            <p><span className="text-muted-foreground">Nome completo:</span> <span className="font-medium">{rd?.passenger?.full_name}</span></p>
            <p><span className="text-muted-foreground">CPF:</span> <span className="font-medium">{rd?.passenger?.cpf}</span></p>
            <p><span className="text-muted-foreground">Passaporte:</span> <span className="font-medium">{rd?.passenger?.passport_number}</span></p>
            <p><span className="text-muted-foreground">Validade Passaporte:</span> <span className="font-medium">{rd?.passenger?.passport_expiry}</span></p>
            <p><span className="text-muted-foreground">Data de Nascimento:</span> <span className="font-medium">{rd?.passenger?.date_of_birth}</span></p>
            <p><span className="text-muted-foreground">Celular:</span> <span className="font-medium">{rd?.passenger?.mobile_whatsapp}</span></p>
            <p><span className="text-muted-foreground">Email:</span> <span className="font-medium">{rd?.passenger?.email}</span></p>
            <p><span className="text-muted-foreground">Aeroporto:</span> <span className="font-medium">{rd?.passenger?.origin_airport}</span></p>
          </div>

          <div className="rounded-lg border border-border bg-card p-4 space-y-2 text-sm">
            <p className="font-semibold text-foreground border-b border-border pb-2 mb-2">Informações para o Seguro</p>
            <p><span className="text-muted-foreground">Contato de Emergência:</span> <span className="font-medium">{rd?.insurance?.emergency_name}</span></p>
            <p><span className="text-muted-foreground">Tel. Emergência:</span> <span className="font-medium">{rd?.insurance?.emergency_phone}</span></p>
            <p><span className="text-muted-foreground">Endereço:</span> <span className="font-medium">{rd?.insurance?.address_street}, {rd?.insurance?.address_number} - {rd?.insurance?.address_neighborhood}, {rd?.insurance?.address_city}/{rd?.insurance?.address_state}</span></p>
          </div>

          <div className="flex justify-center">
            <Button variant="secondary" onClick={() => setShowReview(false)}>
              Voltar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Block re-submission for already submitted vagas
  const allSubmittedIds = new Set([
    ...(submittedVagaIds ?? []),
    ...locallySubmitted,
  ]);
  const availableVagas = allSubmittedIds.size
    ? vagas.filter((v) => !allSubmittedIds.has(v.id))
    : vagas;

  if (availableVagas.length === 0 && vagas.length > 0) {
    return (
      <div className="flex items-center justify-center min-h-dvh p-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="mx-auto w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center">
            <svg className="h-8 w-8 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-foreground">Formulário já preenchido</h1>
          <p className="text-muted-foreground">
            Todas as vagas deste formulário já foram preenchidas. Caso precise corrigir alguma informação, entre em contato com a Calerie Brasil.
          </p>
        </div>
      </div>
    );
  }

  const stepLabels = ["Passageiro", "Seguro", "Documentos", "Revisão"];
  const stepKeys: Step[] = ["passenger-data", "insurance", "photos", "review"];
  const currentIdx = stepKeys.indexOf(step);

  const stepIcons = [
    <svg key="user" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
    <svg key="shield" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
    <svg key="file" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
    <svg key="check" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  ];

  const confirmationData = currentVaga ? {
    buyerName: currentVaga.buyer_name,
    fullName: p.full_name,
    cpf: p.cpf,
    dateOfBirth: p.date_of_birth,
    email: p.email,
    mobile: p.mobile_whatsapp,
    originAirport: p.origin_airport,
  } : undefined;

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Header */}
        <div className="mb-10 text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-semibold text-primary leading-tight">
            {form.title}
          </h1>
          <p className="text-base text-muted-foreground mt-2 font-sans">
            Cruzeiro Black &middot; Calerie Brasil
          </p>
        </div>

        {/* Vaga selector (multi only) */}
        {form.type === "multi" && (
          <div className="mb-8">
            <Select
              label="Selecione sua vaga"
              placeholder="Selecione..."
              options={availableVagas.map((v) => ({ value: v.id, label: `${v.label} - ${v.buyer_name}` }))}
              value={selectedVaga}
              onChange={(e) => setSelectedVaga(e.target.value)}
              required
            />
          </div>
        )}

        {/* Buyer card */}
        {currentVaga && (
          <div className="mb-8 p-5 rounded-lg bg-card border border-border shadow-sm">
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-1">Comprador</p>
            <p className="text-lg font-semibold text-foreground">{currentVaga.buyer_name}</p>
          </div>
        )}

        {/* Step indicator — ship route style */}
        <nav aria-label="Progresso do cadastro" className="mb-10">
          <ol className="flex items-center justify-center sm:justify-start gap-0">
            {stepLabels.map((label, i) => (
              <li key={label} className="flex items-center">
                <div className={`flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors ${
                  i === currentIdx ? "bg-primary-soft" : ""
                }`}>
                  <span className={`
                    w-9 h-9 rounded-full flex items-center justify-center shrink-0
                    transition-all duration-200
                    ${i === currentIdx
                      ? "bg-primary text-white shadow-sm"
                      : i < currentIdx
                        ? "bg-success/10 text-success"
                        : "bg-card text-muted-foreground border border-border"
                    }
                  `}>
                    {i < currentIdx ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className="font-semibold text-sm">{stepIcons[i]}</span>
                    )}
                  </span>
                  <span className={`text-sm font-medium whitespace-nowrap hidden sm:inline ${
                    i === currentIdx ? "text-primary" : i < currentIdx ? "text-success" : "text-muted-foreground"
                  }`}>
                    {label}
                  </span>
                </div>
                {i < stepLabels.length - 1 && (
                  <div className={`w-6 sm:w-10 h-0.5 mx-1 rounded-full ${
                    i < currentIdx ? "bg-success" : "bg-border"
                  }`} />
                )}
              </li>
            ))}
          </ol>
        </nav>

        {/* Form card */}
        <div className="bg-card rounded-xl border border-border shadow-md p-6 sm:p-8">

        {/* Form sections */}
        <div className="space-y-6">
          {step === "passenger-data" && (
            <section className="space-y-5">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                Dados do Passageiro
              </h2>
              <Input label="Nome completo do passageiro" value={p.full_name} onChange={handleP("full_name")} error={pErrors.full_name} required />
              <Input label="CPF" value={p.cpf} onChange={handleP("cpf")} error={pErrors.cpf} placeholder="000.000.000-00" required />
              <Input label="Número do Passaporte" value={p.passport_number} onChange={handleP("passport_number")} error={pErrors.passport_number} required />
              <Input label="Data de vencimento (Passaporte)" type="date" value={p.passport_expiry} onChange={handleP("passport_expiry")} error={pErrors.passport_expiry} required />
              <Input label="Data de nascimento" type="date" value={p.date_of_birth} onChange={handleP("date_of_birth")} error={pErrors.date_of_birth} required />
              <Input label="Celular com WhatsApp" value={p.mobile_whatsapp} onChange={handleP("mobile_whatsapp")} error={pErrors.mobile_whatsapp} placeholder="(11) 99999-0000" required />
              <Input label="Email" type="email" value={p.email} onChange={handleP("email")} error={pErrors.email} required />
              <Select label="Capital de Origem" options={AIRPORTS} placeholder="Selecione o aeroporto..." value={p.origin_airport} onChange={(e) => { setP((prev) => ({ ...prev, origin_airport: e.target.value })); setPErrors((prev) => ({ ...prev, origin_airport: "" })); }} error={pErrors.origin_airport} required />
              <Input label="Observação" placeholder="Ex: é casal, tem restrição alimentar, etc." value={p.notes} onChange={handleP("notes")} />
            </section>
          )}

          {step === "insurance" && (
            <section className="space-y-5">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                Informações para o Seguro
              </h2>
              <Input label="Nome do contato de emergência" value={ins.emergency_name} onChange={(e) => { setIns((prev) => ({ ...prev, emergency_name: e.target.value })); setInsErrors((prev) => ({ ...prev, emergency_name: "" })); }} error={insErrors.emergency_name} required />
              <Input label="Telefone do contato de emergência" value={ins.emergency_phone} onChange={(e) => { setIns((prev) => ({ ...prev, emergency_phone: formatPhone(e.target.value) })); setInsErrors((prev) => ({ ...prev, emergency_phone: "" })); }} error={insErrors.emergency_phone} placeholder="(11) 99999-0000" required />
              <CepField
                value={ins.address_cep}
                error={insErrors.address_cep}
                onChange={(val) => { setIns((prev) => ({ ...prev, address_cep: val })); setInsErrors((prev) => ({ ...prev, address_cep: "" })); }}
                onAddressFound={(data) => setIns((prev) => ({
                  ...prev,
                  address_street: data.street,
                  address_neighborhood: data.neighborhood,
                  address_city: data.city,
                  address_state: data.state,
                }))}
              />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <Input label="Rua" value={ins.address_street} onChange={(e) => { setIns((prev) => ({ ...prev, address_street: e.target.value })); setInsErrors((prev) => ({ ...prev, address_street: "" })); }} error={insErrors.address_street} required />
                </div>
                <Input label="Número" value={ins.address_number} onChange={(e) => setIns((prev) => ({ ...prev, address_number: e.target.value }))} />
              </div>
              <Input label="Complemento" value={ins.address_complement} onChange={(e) => setIns((prev) => ({ ...prev, address_complement: e.target.value }))} />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input label="Bairro" value={ins.address_neighborhood} onChange={(e) => { setIns((prev) => ({ ...prev, address_neighborhood: e.target.value })); setInsErrors((prev) => ({ ...prev, address_neighborhood: "" })); }} error={insErrors.address_neighborhood} required />
                <Input label="Cidade" value={ins.address_city} onChange={(e) => { setIns((prev) => ({ ...prev, address_city: e.target.value })); setInsErrors((prev) => ({ ...prev, address_city: "" })); }} error={insErrors.address_city} required />
                <Input label="Estado" value={ins.address_state} onChange={(e) => { setIns((prev) => ({ ...prev, address_state: e.target.value.toUpperCase().slice(0, 2) })); setInsErrors((prev) => ({ ...prev, address_state: "" })); }} error={insErrors.address_state} maxLength={2} placeholder="UF" required />
              </div>
            </section>
          )}

          {step === "photos" && (
            <section className="space-y-5">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Documentos
              </h2>
              <FileUpload
                label="Foto do CPF"
                preview={cpfPreview}
                onFileSelect={handleFileSelect("cpf")}
              />
              <FileUpload
                label="Foto do Passaporte"
                preview={passportPreview}
                onFileSelect={handleFileSelect("passport")}
              />
            </section>
          )}

          {step === "review" && (
            <section className="space-y-5">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Revisão dos Dados
              </h2>
              <div className="rounded-lg bg-background border border-border p-5 space-y-3 text-sm">
                <p><span className="text-muted-foreground">Comprador:</span> <span className="font-medium text-foreground">{currentVaga?.buyer_name}</span></p>
                <p><span className="text-muted-foreground">Passageiro:</span> <span className="font-medium text-foreground">{p.full_name}</span></p>
                <p><span className="text-muted-foreground">CPF:</span> <span className="font-medium text-foreground">{p.cpf}</span></p>
                <p><span className="text-muted-foreground">Passaporte:</span> <span className="font-medium text-foreground">{p.passport_number}</span></p>
                <p><span className="text-muted-foreground">Validade do Passaporte:</span> <span className="font-medium text-foreground">{p.passport_expiry}</span></p>
                <p><span className="text-muted-foreground">Data de Nascimento:</span> <span className="font-medium text-foreground">{p.date_of_birth}</span></p>
                <p><span className="text-muted-foreground">Celular:</span> <span className="font-medium text-foreground">{p.mobile_whatsapp}</span></p>
                <p><span className="text-muted-foreground">Email:</span> <span className="font-medium text-foreground">{p.email}</span></p>
                <p><span className="text-muted-foreground">Aeroporto:</span> <span className="font-medium text-foreground">{p.origin_airport}</span></p>
                <p><span className="text-muted-foreground">Contato de Emergência:</span> <span className="font-medium text-foreground">{ins.emergency_name}</span></p>
                <p><span className="text-muted-foreground">Tel. Emergência:</span> <span className="font-medium text-foreground">{ins.emergency_phone}</span></p>
                <p><span className="text-muted-foreground">Endereço:</span> <span className="font-medium text-foreground">{ins.address_street}, {ins.address_number} - {ins.address_neighborhood}, {ins.address_city}/{ins.address_state}</span></p>
                {p.notes && <p><span className="text-muted-foreground">Observação:</span> <span className="font-medium text-foreground">{p.notes}</span></p>}
              </div>
            </section>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t border-border">
          <Button variant="ghost" onClick={prevStep} disabled={step === "passenger-data"}>
            Voltar
          </Button>
          {step === "review" ? (
            <Button onClick={() => setShowConfirm(true)}>
              Confirmar Dados
            </Button>
          ) : (
            <Button onClick={nextStep}>
              {step === "photos" ? "Revisar" : "Próximo"}
            </Button>
          )}
        </div>

        </div>{/* end form card */}

        {/* Confirmation modal */}
        {confirmationData && (
          <ConfirmationModal
            open={showConfirm}
            data={confirmationData}
            onConfirm={handleSubmit}
            onClose={() => setShowConfirm(false)}
            loading={submitting}
            error={submitError}
          />
        )}
      </div>
    </div>
  );
}
