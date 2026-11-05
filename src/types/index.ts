export type UserRole = 'traveler' | 'business' | 'admin';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
  created_at: string;
}

export interface Business {
  id: string;
  user_id: string;
  business_name: string;
  business_type: BusinessType;
  country: string;
  city: string;
  address: string | null;
  verified: boolean;
  created_at: string;
}

export type BusinessType = 'hotel' | 'airline' | 'car_rental' | 'tour_operator' | 'cruise' | 'other';

export interface Identity {
  id: string;
  user_id: string;
  full_name: string;
  nationality: string;
  passport_number: string;
  passport_type: string | null;
  date_of_birth: string | null;
  gender: string | null;
  place_of_birth: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  issuing_country: string | null;
  document_type: string;
  qr_token: string;
  status: 'active' | 'suspended' | 'expired';
  verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  business_id: string;
  traveler_user_id: string;
  identity_id: string | null;
  booking_reference: string;
  service_type: ServiceType;
  origin: string | null;
  destination: string | null;
  start_date: string;
  end_date: string | null;
  status: BookingStatus;
  notes: string | null;
  created_at: string;
  business?: Business;
  traveler?: Profile;
  identity?: Identity;
}

export type ServiceType = 'flight' | 'hotel' | 'car_rental' | 'tour' | 'cruise' | 'other';
export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface Verification {
  id: string;
  business_id: string;
  traveler_user_id: string;
  identity_id: string | null;
  qr_token_scanned: string;
  result: 'verified' | 'mismatch' | 'not_found';
  verified_fields: Record<string, boolean>;
  notes: string | null;
  created_at: string;
  business?: Business;
  traveler?: Profile;
  identity?: Identity;
}

export interface MismatchReport {
  id: string;
  verification_id: string | null;
  business_id: string;
  traveler_user_id: string;
  identity_id: string | null;
  report_reason: string;
  details: string | null;
  status: 'open' | 'investigating' | 'resolved' | 'dismissed';
  admin_notes: string | null;
  created_at: string;
  resolved_at: string | null;
  business?: Business;
  traveler?: Profile;
  identity?: Identity;
}

export interface OCRResult {
  full_name?: string;
  nationality?: string;
  passport_number?: string;
  passport_type?: string;
  date_of_birth?: string;
  gender?: string;
  place_of_birth?: string;
  issue_date?: string;
  expiry_date?: string;
  issuing_country?: string;
  document_type?: string;
  raw_text?: string;
  confidence?: number;
}
