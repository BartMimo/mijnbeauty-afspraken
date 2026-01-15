-- FIX RLS POLICIES: Allow public read, restrict writes

-- Re-enable RLS on public tables
ALTER TABLE salons ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

-- SALONS: Everyone can read, only owners can write
DROP POLICY IF EXISTS "Salons are publicly readable" ON salons;
CREATE POLICY "Salons are publicly readable" ON salons
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Only owners can update salons" ON salons;
CREATE POLICY "Only owners can update salons" ON salons
    FOR UPDATE USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Only owners can delete salons" ON salons;
CREATE POLICY "Only owners can delete salons" ON salons
    FOR DELETE USING (auth.uid() = owner_id);

-- SERVICES: Everyone can read, only salon owners can write
DROP POLICY IF EXISTS "Services are publicly readable" ON services;
CREATE POLICY "Services are publicly readable" ON services
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Salon owners can manage services" ON services;
CREATE POLICY "Salon owners can manage services" ON services
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM salons 
            WHERE salons.id = services.salon_id 
            AND salons.owner_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Salon owners can update services" ON services;
CREATE POLICY "Salon owners can update services" ON services
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM salons 
            WHERE salons.id = services.salon_id 
            AND salons.owner_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Salon owners can delete services" ON services;
CREATE POLICY "Salon owners can delete services" ON services
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM salons 
            WHERE salons.id = services.salon_id 
            AND salons.owner_id = auth.uid()
        )
    );

-- DEALS: Everyone can read, only salon owners can write
DROP POLICY IF EXISTS "Deals are publicly readable" ON deals;
CREATE POLICY "Deals are publicly readable" ON deals
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Salon owners can manage deals" ON deals;
CREATE POLICY "Salon owners can manage deals" ON deals
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM salons 
            WHERE salons.id = deals.salon_id 
            AND salons.owner_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Salon owners can update deals" ON deals;
CREATE POLICY "Salon owners can update deals" ON deals
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM salons 
            WHERE salons.id = deals.salon_id 
            AND salons.owner_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Salon owners can delete deals" ON deals;
CREATE POLICY "Salon owners can delete deals" ON deals
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM salons 
            WHERE salons.id = deals.salon_id 
            AND salons.owner_id = auth.uid()
        )
    );

-- Test query
SELECT id, name, slug FROM salons WHERE slug = 'beauty-test-studio';
