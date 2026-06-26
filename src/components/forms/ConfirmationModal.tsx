"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useState } from "react";

interface ConfirmationData {
  buyerName: string;
  fullName: string;
  cpf: string;
  dateOfBirth: string;
  email: string;
  mobile: string;
  originAirport: string;
}

interface ConfirmationModalProps {
  open: boolean;
  data: ConfirmationData;
  onConfirm: () => void;
  onClose: () => void;
  loading?: boolean;
  error?: string | null;
}

export function ConfirmationModal({
  open,
  data,
  onConfirm,
  onClose,
  loading,
  error,
}: ConfirmationModalProps) {
  const [checked, setChecked] = useState(false);

  const handleConfirm = () => {
    if (!checked || loading) return;
    onConfirm();
  };

  return (
    <Modal open={open} onClose={onClose} title="Termo de Responsabilidade">
      <div className="space-y-6">
        <div className="rounded-lg bg-primary-light border border-primary/20 p-4 text-sm">
          <p className="font-medium text-primary mb-1">Atenção</p>
          <p className="text-muted-foreground">
            A emissão das passagens e reservas será feita exatamente com os dados
            preenchidos anteriormente. Por favor, leia com atenção antes de finalizar.
          </p>
        </div>

        <div className="space-y-3 text-sm">
          <h3 className="font-semibold text-foreground">Resumo dos dados</h3>
          <div className="grid grid-cols-2 gap-2">
            <span className="text-muted-foreground">Comprador:</span>
            <span className="text-foreground font-medium">{data.buyerName}</span>
            <span className="text-muted-foreground">Passageiro:</span>
            <span className="text-foreground font-medium">{data.fullName}</span>
            <span className="text-muted-foreground">CPF:</span>
            <span className="text-foreground font-medium">{data.cpf}</span>
            <span className="text-muted-foreground">Data de Nascimento:</span>
            <span className="text-foreground font-medium">{data.dateOfBirth}</span>
            <span className="text-muted-foreground">Email:</span>
            <span className="text-foreground font-medium">{data.email}</span>
            <span className="text-muted-foreground">Celular:</span>
            <span className="text-foreground font-medium">{data.mobile}</span>
            <span className="text-muted-foreground">Aeroporto:</span>
            <span className="text-foreground font-medium">{data.originAirport}</span>
          </div>
        </div>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-0.5 h-5 w-5 rounded border-input text-primary focus:ring-ring"
          />
          <span className="text-sm text-foreground leading-relaxed">
            Confirmo que revisei todos os dados acima (Nome, CPF e Data de Nascimento)
            e atesto que estão corretos e compatíveis com o documento original do
            passageiro. Estou ciente de que erros de preenchimento podem impedir o
            embarque e gerar custos de reemissão sob minha responsabilidade.
          </span>
        </label>

        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive" role="alert">
            {error}
          </div>
        )}

        <div className="flex gap-3 justify-end pt-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Voltar
          </Button>
          <Button onClick={handleConfirm} disabled={!checked} loading={loading}>
            Confirmar e Enviar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
