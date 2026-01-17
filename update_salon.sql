-- Update existing salon Testeensalon with correct data
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