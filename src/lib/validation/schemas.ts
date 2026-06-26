import { z } from "zod";

// CPF validation: 11 digits with checksum
const cpfSchema = z.string().refine(
  (val) => {
    const digits = val.replace(/\D/g, "");
    if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;

    const calcDigit = (start: number) => {
      let sum = 0;
      for (let i = 0; i < start; i++) {
        sum += parseInt(digits[i]) * (start + 1 - i);
      }
      const rest = (sum * 10) % 11;
      return rest === 10 ? 0 : rest;
    };

    return (
      calcDigit(9) === parseInt(digits[9]) &&
      calcDigit(10) === parseInt(digits[10])
    );
  },
  { message: "CPF inválido" }
);

export const passengerSchema = z.object({
  full_name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  cpf: cpfSchema,
  passport_number: z.string().min(4, "Número do passaporte inválido"),
  passport_expiry: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  date_of_birth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  mobile_whatsapp: z
    .string()
    .regex(/^\(\d{2}\)\s?\d{4,5}-\d{4}$/, "Telefone inválido"),
  email: z.string().email("Email inválido"),
  origin_airport: z.string().min(3, "Selecione o aeroporto de origem"),
  notes: z.string().optional(),
});

export const insuranceSchema = z.object({
  emergency_name: z.string().min(3, "Nome do contato obrigatório"),
  emergency_phone: z
    .string()
    .regex(/^\(\d{2}\)\s?\d{4,5}-\d{4}$/, "Telefone inválido"),
  address_cep: z.string().regex(/^\d{5}-\d{3}$/, "CEP inválido"),
  address_street: z.string().min(3, "Rua obrigatória"),
  address_number: z.string().optional(),
  address_complement: z.string().optional(),
  address_neighborhood: z.string().min(2, "Bairro obrigatório"),
  address_city: z.string().min(2, "Cidade obrigatória"),
  address_state: z.string().length(2, "Estado deve ter 2 caracteres"),
});

export type PassengerFormData = z.infer<typeof passengerSchema>;
export type InsuranceFormData = z.infer<typeof insuranceSchema>;
