-- ============================================
-- COMPLETE DATABASE SCHEMA FIX
-- Ensures all tables match what the application expects
-- ============================================

-- ============================================
-- 1. PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    phone TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'owner', 'staff', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='phone') THEN
        ALTER TABLE profiles ADD COLUMN phone TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='role') THEN
        ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'user' CHECK (role IN ('user', 'owner', 'staff', 'admin'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='full_name') THEN
        ALTER TABLE profiles ADD COLUMN full_name TEXT;
    END IF;
END $$;

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- ============================================
-- 2. SALONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS salons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    subdomain TEXT UNIQUE,
    description TEXT,
    address TEXT,
    city TEXT,
    zip_code TEXT,
    email TEXT,
    phone TEXT,
    image_url TEXT,
    rating NUMERIC(3,2) DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='salons' AND column_name='slug') THEN
        ALTER TABLE salons ADD COLUMN slug TEXT UNIQUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='salons' AND column_name='subdomain') THEN
        ALTER TABLE salons ADD COLUMN subdomain TEXT UNIQUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='salons' AND column_name='description') THEN
        ALTER TABLE salons ADD COLUMN description TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='salons' AND column_name='zip_code') THEN
        ALTER TABLE salons ADD COLUMN zip_code TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='salons' AND column_name='email') THEN
        ALTER TABLE salons ADD COLUMN email TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='salons' AND column_name='phone') THEN
        ALTER TABLE salons ADD COLUMN phone TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='salons' AND column_name='image_url') THEN
        ALTER TABLE salons ADD COLUMN image_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='salons' AND column_name='rating') THEN
        ALTER TABLE salons ADD COLUMN rating NUMERIC(3,2) DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='salons' AND column_name='review_count') THEN
        ALTER TABLE salons ADD COLUMN review_count INTEGER DEFAULT 0;
    END IF;
    -- Add latitude and longitude columns for location-based search
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='salons' AND column_name='latitude') THEN
        ALTER TABLE salons ADD COLUMN latitude NUMERIC(10,8);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='salons' AND column_name='longitude') THEN
        ALTER TABLE salons ADD COLUMN longitude NUMERIC(11,8);
    END IF;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_salons_slug ON salons(slug);
CREATE INDEX IF NOT EXISTS idx_salons_subdomain ON salons(subdomain);
CREATE INDEX IF NOT EXISTS idx_salons_owner ON salons(owner_id);
CREATE INDEX IF NOT EXISTS idx_salons_city ON salons(city);

-- ============================================
-- 3. SERVICES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    category TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='services' AND column_name='description') THEN
        ALTER TABLE services ADD COLUMN description TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='services' AND column_name='category') THEN
        ALTER TABLE services ADD COLUMN category TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='services' AND column_name='active') THEN
        ALTER TABLE services ADD COLUMN active BOOLEAN DEFAULT TRUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='services' AND column_name='duration_minutes') THEN
        ALTER TABLE services ADD COLUMN duration_minutes INTEGER NOT NULL DEFAULT 30;
    END IF;
END $$;

-- Index
CREATE INDEX IF NOT EXISTS idx_services_salon ON services(salon_id);
CREATE INDEX IF NOT EXISTS idx_services_active ON services(active);

-- ============================================
-- 4. DEALS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    service_name TEXT NOT NULL,
    description TEXT,
    original_price NUMERIC(10,2) NOT NULL,
    discount_price NUMERIC(10,2) NOT NULL,
    date DATE NOT NULL,
    time TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='deals' AND column_name='description') THEN
        ALTER TABLE deals ADD COLUMN description TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='deals' AND column_name='status') THEN
        ALTER TABLE deals ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired'));
    END IF;
END $$;

-- Index
CREATE INDEX IF NOT EXISTS idx_deals_salon ON deals(salon_id);
CREATE INDEX IF NOT EXISTS idx_deals_date ON deals(date);
CREATE INDEX IF NOT EXISTS idx_deals_status ON deals(status);

-- ============================================
-- 5. APPOINTMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE SET NULL,
    deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    time TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no-show')),
    notes TEXT,
    price NUMERIC(10,2),
    staff_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='notes') THEN
        ALTER TABLE appointments ADD COLUMN notes TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='price') THEN
        ALTER TABLE appointments ADD COLUMN price NUMERIC(10,2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='staff_name') THEN
        ALTER TABLE appointments ADD COLUMN staff_name TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='deal_id') THEN
        ALTER TABLE appointments ADD COLUMN deal_id UUID REFERENCES deals(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_appointments_salon ON appointments(salon_id);
CREATE INDEX IF NOT EXISTS idx_appointments_user ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- ============================================
-- 6. FAVORITES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, salon_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_salon ON favorites(salon_id);

-- ============================================
-- 7. REVIEWS TABLE (for future use)
-- ============================================
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_reviews_salon ON reviews(salon_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);

-- ============================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE salons ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- PROFILES: Users can read their own profile, admins can read all
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- SALONS: Public read, owners can manage their own
DROP POLICY IF EXISTS "Salons are publicly viewable" ON salons;
CREATE POLICY "Salons are publicly viewable" ON salons
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Owners can manage their salons" ON salons;
CREATE POLICY "Owners can manage their salons" ON salons
    FOR ALL USING (auth.uid() = owner_id);

-- SERVICES: Public read, salon owners can manage
DROP POLICY IF EXISTS "Services are publicly viewable" ON services;
CREATE POLICY "Services are publicly viewable" ON services
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Salon owners can manage services" ON services;
CREATE POLICY "Salon owners can manage services" ON services
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM salons 
            WHERE salons.id = services.salon_id 
            AND salons.owner_id = auth.uid()
        )
    );

-- DEALS: Public read, salon owners can manage
DROP POLICY IF EXISTS "Deals are publicly viewable" ON deals;
CREATE POLICY "Deals are publicly viewable" ON deals
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Salon owners can manage deals" ON deals;
CREATE POLICY "Salon owners can manage deals" ON deals
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM salons 
            WHERE salons.id = deals.salon_id 
            AND salons.owner_id = auth.uid()
        )
    );

-- APPOINTMENTS: Users see their own, salon owners see their salon's
DROP POLICY IF EXISTS "Users can view own appointments" ON appointments;
CREATE POLICY "Users can view own appointments" ON appointments
    FOR SELECT USING (
        auth.uid() = user_id 
        OR EXISTS (
            SELECT 1 FROM salons 
            WHERE salons.id = appointments.salon_id 
            AND salons.owner_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can create appointments" ON appointments;
CREATE POLICY "Users can create appointments" ON appointments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own appointments" ON appointments;
CREATE POLICY "Users can update own appointments" ON appointments
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Salon owners can manage appointments" ON appointments;
CREATE POLICY "Salon owners can manage appointments" ON appointments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM salons 
            WHERE salons.id = appointments.salon_id 
            AND salons.owner_id = auth.uid()
        )
    );

-- FAVORITES: Users manage their own
DROP POLICY IF EXISTS "Users can view own favorites" ON favorites;
CREATE POLICY "Users can view own favorites" ON favorites
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own favorites" ON favorites;
CREATE POLICY "Users can manage own favorites" ON favorites
    FOR ALL USING (auth.uid() = user_id);

-- REVIEWS: Public read, users can create/edit their own
DROP POLICY IF EXISTS "Reviews are publicly viewable" ON reviews;
CREATE POLICY "Reviews are publicly viewable" ON reviews
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create reviews" ON reviews;
CREATE POLICY "Users can create reviews" ON reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own reviews" ON reviews;
CREATE POLICY "Users can update own reviews" ON reviews
    FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- 9. FIX TEST SALON DATA
-- ============================================
-- Force update test salon data (removes the slug IS NULL condition)
UPDATE salons 
SET 
    slug = 'beauty-test-studio',
    subdomain = 'beauty-test',
    description = 'Professional beauty salon offering nail services, lashes, and more',
    image_url = COALESCE(image_url, 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800')
WHERE name = 'Beauty Test Studio';

-- ============================================
-- 10. TRIGGERS FOR UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Only add triggers to tables that have updated_at column
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_salons_updated_at ON salons;
CREATE TRIGGER update_salons_updated_at BEFORE UPDATE ON salons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_services_updated_at ON services;
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_deals_updated_at ON deals;
CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON deals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_appointments_updated_at ON appointments;
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Note: favorites table only has created_at, no updated_at, so no trigger needed

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify everything works:

-- Check all tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'salons', 'services', 'deals', 'appointments', 'favorites', 'reviews')
ORDER BY table_name;

-- Check test salon
SELECT id, name, slug, subdomain, city FROM salons WHERE name LIKE '%Beauty%';

-- Check services for test salon
SELECT s.name, s.price, s.duration_minutes, sal.name as salon_name
FROM services s
JOIN salons sal ON s.salon_id = sal.id
WHERE sal.name = 'Beauty Test Studio';

-- Check deals for test salon
SELECT d.service_name, d.original_price, d.discount_price, sal.name as salon_name
FROM deals d
JOIN salons sal ON d.salon_id = sal.id
WHERE sal.name = 'Beauty Test Studio';

-- ============================================
-- UPDATE EXISTING SALON: Testeensalon
-- ============================================
UPDATE salons 
SET 
    address = 'Vezelstraat 20',
    city = 'Zeeland',
    zip_code = '5411AP',
    categories = ARRAY['Kapsalon'],
    latitude = 51.6966249,
    longitude = 5.6790838,
    status = 'active'
WHERE slug = 'testeensalon' OR name = 'Testeensalon';

-- Verify the update
SELECT id, name, slug, address, city, zip_code, categories, latitude, longitude, status 
FROM salons 
WHERE slug = 'testeensalon' OR name = 'Testeensalon';
