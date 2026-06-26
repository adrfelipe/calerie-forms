export interface Form {
  id: string;
  slug: string;
  title: string;
  type: "single" | "multi";
  status: "active" | "closed" | "draft";
  created_at: string;
  updated_at: string;
}

export interface Vaga {
  id: string;
  form_id: string;
  label: string;
  buyer_name: string;
  sort_order: number;
  created_at: string;
}

export type SubmissionStatus = "draft" | "confirmed";

export interface Passenger {
  id: string;
  vaga_id: string;
  form_id: string;
  status: SubmissionStatus;
  full_name: string;
  cpf: string;
  passport_number: string;
  passport_expiry: string;
  date_of_birth: string;
  mobile_whatsapp: string;
  email: string;
  origin_airport: string;
  notes: string;
  emergency_name: string;
  emergency_phone: string;
  address_cep: string;
  address_street: string;
  address_number: string;
  address_complement: string;
  address_neighborhood: string;
  address_city: string;
  address_state: string;
  confirmed_at: string | null;
  submitted_at: string;
  google_sheets_row: number | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentPhoto {
  id: string;
  passenger_id: string;
  type: "cpf" | "passport";
  storage_path: string;
  mime_type: string | null;
  file_size: number | null;
  uploaded_at: string;
}

export interface PassengerFormData {
  full_name: string;
  cpf: string;
  passport_number: string;
  passport_expiry: string;
  date_of_birth: string;
  mobile_whatsapp: string;
  email: string;
  origin_airport: string;
  notes: string;
}

export interface InsuranceFormData {
  emergency_name: string;
  emergency_phone: string;
  address_cep: string;
  address_street: string;
  address_number: string;
  address_complement: string;
  address_neighborhood: string;
  address_city: string;
  address_state: string;
}

export interface PassengerSession {
  vagaId: string;
  buyerName: string;
  label: string;
  status: "pending" | "filling" | "completed";
  passengerData: PassengerFormData | null;
  insuranceData: InsuranceFormData | null;
  cpfPhoto: File | null;
  cpfPreview: string | null;
  passportPhoto: File | null;
  passportPreview: string | null;
}

export interface CepResponse {
  cep: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}
