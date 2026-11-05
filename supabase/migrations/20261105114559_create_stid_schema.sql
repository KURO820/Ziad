/*
# ST&ID — Smart Travel & Identity Schema

## Overview
Creates the complete database schema for the ST&ID travel identity platform.
This includes user profiles (with roles: traveler/business/admin), digital travel identities,
bookings, verifications, and mismatch reports.

## New Tables

### 1. profiles
Stores user role and display info linked to auth.users.
- id (uuid, PK, FK to auth.users)
- role (text: 'traveler' | 'business' | 'admin')
- full_name (text)
- avatar_url (text, nullable)
- phone (text, nullable)
- created_at (timestamptz)

### 2. businesses
Business-specific data for business-role users.
- id (uuid, PK)
- user_id (uuid, FK to profiles)
- business_name (text)
- business_type (text)
- country (text)
- city (text)
- address (text, nullable)
- verified (boolean, default false)
- created_at (timestamptz)

### 3. identities
Digital travel identity cards for travelers.
- id (uuid, PK)
- user_id (uuid, FK to profiles)
- full_name, nationality, passport_number, dates, etc.
- qr_token (text, unique)
- status, verified, timestamps

### 4. bookings
Travel bookings created by businesses for travelers.
- id, business_id, traveler_user_id, identity_id
- booking_reference (unique)
- service_type, origin, destination, dates, status, notes

### 5. verifications
Records of identity verification scans by businesses.
- id, business_id, traveler_user_id, identity_id
- qr_token_scanned, result, verified_fields (jsonb), notes

### 6. mismatch_reports
Reports filed when identity information doesn't match.
- id, verification_id, business_id, traveler_user_id, identity_id
- report_reason, details, status, admin_notes, timestamps

## Security
- RLS enabled on all tables.
- profiles: users read/update own; admins read all.
- businesses: owner read/update; admins read all.
- identities: travelers CRUD own; businesses/admins can read for verification.
- bookings: travelers see own; businesses see own; admins see all.
- verifications: businesses see own; travelers see own; admins see all.
- mismatch_reports: businesses see own; travelers see own; admins see all + update.
- All grants scoped to authenticated role (app requires sign-in).
*/

-- ==================== PROFILES ====================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'traveler' CHECK (role IN ('traveler', 'business', 'admin')),
  full_name text NOT NULL DEFAULT '',
  avatar_url text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ==================== BUSINESSES ====================
CREATE TABLE IF NOT EXISTS businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  business_name text NOT NULL,
  business_type text NOT NULL DEFAULT 'other' CHECK (business_type IN ('hotel', 'airline', 'car_rental', 'tour_operator', 'cruise', 'other')),
  country text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  address text,
  verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON businesses TO authenticated;

DROP POLICY IF EXISTS "select_businesses" ON businesses;
CREATE POLICY "select_businesses" ON businesses FOR SELECT
  TO authenticated USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "insert_own_business" ON businesses;
CREATE POLICY "insert_own_business" ON businesses FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "update_own_business" ON businesses;
CREATE POLICY "update_own_business" ON businesses FOR UPDATE
  TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ==================== IDENTITIES ====================
CREATE TABLE IF NOT EXISTS identities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  nationality text NOT NULL DEFAULT '',
  passport_number text NOT NULL DEFAULT '',
  passport_type text,
  date_of_birth date,
  gender text,
  place_of_birth text,
  issue_date date,
  expiry_date date,
  issuing_country text,
  document_type text NOT NULL DEFAULT 'passport',
  qr_token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'expired')),
  verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE identities ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON identities TO authenticated;

DROP POLICY IF EXISTS "select_own_identities" ON identities;
CREATE POLICY "select_own_identities" ON identities FOR SELECT
  TO authenticated USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'business'))
  );

DROP POLICY IF EXISTS "insert_own_identities" ON identities;
CREATE POLICY "insert_own_identities" ON identities FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "update_own_identities" ON identities;
CREATE POLICY "update_own_identities" ON identities FOR UPDATE
  TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "delete_own_identities" ON identities;
CREATE POLICY "delete_own_identities" ON identities FOR DELETE
  TO authenticated USING (user_id = auth.uid());

-- ==================== BOOKINGS ====================
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  traveler_user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  identity_id uuid REFERENCES identities(id) ON DELETE SET NULL,
  booking_reference text UNIQUE NOT NULL DEFAULT upper(encode(gen_random_bytes(6), 'hex')),
  service_type text NOT NULL DEFAULT 'other' CHECK (service_type IN ('flight', 'hotel', 'car_rental', 'tour', 'cruise', 'other')),
  origin text,
  destination text,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON bookings TO authenticated;

DROP POLICY IF EXISTS "select_bookings" ON bookings;
CREATE POLICY "select_bookings" ON bookings FOR SELECT
  TO authenticated USING (
    traveler_user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM businesses b WHERE b.id = bookings.business_id AND b.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "insert_bookings" ON bookings;
CREATE POLICY "insert_bookings" ON bookings FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM businesses b WHERE b.id = bookings.business_id AND b.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_bookings" ON bookings;
CREATE POLICY "update_bookings" ON bookings FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM businesses b WHERE b.id = bookings.business_id AND b.user_id = auth.uid())
    OR traveler_user_id = auth.uid()
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM businesses b WHERE b.id = bookings.business_id AND b.user_id = auth.uid())
    OR traveler_user_id = auth.uid()
  );

DROP POLICY IF EXISTS "delete_bookings" ON bookings;
CREATE POLICY "delete_bookings" ON bookings FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM businesses b WHERE b.id = bookings.business_id AND b.user_id = auth.uid())
  );

-- ==================== VERIFICATIONS ====================
CREATE TABLE IF NOT EXISTS verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  traveler_user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  identity_id uuid REFERENCES identities(id) ON DELETE SET NULL,
  qr_token_scanned text NOT NULL DEFAULT '',
  result text NOT NULL DEFAULT 'verified' CHECK (result IN ('verified', 'mismatch', 'not_found')),
  verified_fields jsonb DEFAULT '{}'::jsonb,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON verifications TO authenticated;

DROP POLICY IF EXISTS "select_verifications" ON verifications;
CREATE POLICY "select_verifications" ON verifications FOR SELECT
  TO authenticated USING (
    traveler_user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM businesses b WHERE b.id = verifications.business_id AND b.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "insert_verifications" ON verifications;
CREATE POLICY "insert_verifications" ON verifications FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM businesses b WHERE b.id = verifications.business_id AND b.user_id = auth.uid())
  );

-- ==================== MISMATCH REPORTS ====================
CREATE TABLE IF NOT EXISTS mismatch_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id uuid REFERENCES verifications(id) ON DELETE SET NULL,
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  traveler_user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  identity_id uuid REFERENCES identities(id) ON DELETE SET NULL,
  report_reason text NOT NULL DEFAULT '',
  details text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'dismissed')),
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

ALTER TABLE mismatch_reports ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON mismatch_reports TO authenticated;

DROP POLICY IF EXISTS "select_mismatch_reports" ON mismatch_reports;
CREATE POLICY "select_mismatch_reports" ON mismatch_reports FOR SELECT
  TO authenticated USING (
    traveler_user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM businesses b WHERE b.id = mismatch_reports.business_id AND b.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "insert_mismatch_reports" ON mismatch_reports;
CREATE POLICY "insert_mismatch_reports" ON mismatch_reports FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM businesses b WHERE b.id = mismatch_reports.business_id AND b.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_mismatch_reports" ON mismatch_reports;
CREATE POLICY "update_mismatch_reports" ON mismatch_reports FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ==================== INDEXES ====================
CREATE INDEX IF NOT EXISTS idx_businesses_user_id ON businesses(user_id);
CREATE INDEX IF NOT EXISTS idx_identities_user_id ON identities(user_id);
CREATE INDEX IF NOT EXISTS idx_identities_qr_token ON identities(qr_token);
CREATE INDEX IF NOT EXISTS idx_bookings_business_id ON bookings(business_id);
CREATE INDEX IF NOT EXISTS idx_bookings_traveler_user_id ON bookings(traveler_user_id);
CREATE INDEX IF NOT EXISTS idx_verifications_business_id ON verifications(business_id);
CREATE INDEX IF NOT EXISTS idx_verifications_traveler_user_id ON verifications(traveler_user_id);
CREATE INDEX IF NOT EXISTS idx_mismatch_reports_business_id ON mismatch_reports(business_id);
CREATE INDEX IF NOT EXISTS idx_mismatch_reports_traveler_user_id ON mismatch_reports(traveler_user_id);
CREATE INDEX IF NOT EXISTS idx_mismatch_reports_status ON mismatch_reports(status);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
