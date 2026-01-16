-- Migration: create postcode_prefixes table with average coordinates
-- Safe to run multiple times
CREATE TABLE IF NOT EXISTS postcode_prefixes (
    prefix VARCHAR(4) PRIMARY KEY,
    avg_latitude DECIMAL(10,8),
    avg_longitude DECIMAL(11,8),
    province VARCHAR(50),
    city VARCHAR(100)
);

-- Insert some example prefixes (will be populated by application logic)
INSERT INTO postcode_prefixes (prefix, avg_latitude, avg_longitude, province, city) VALUES
('1000', 52.3362429, 4.8694444, 'Noord-Holland', 'Amsterdam'),
('2000', 51.9225000, 4.4791670, 'Zuid-Holland', 'Rotterdam'),
('3000', 52.0908330, 5.1222220, 'Utrecht', 'Utrecht'),
('4000', 51.5591670, 5.0916670, 'Noord-Brabant', 'Eindhoven')
ON CONFLICT (prefix) DO NOTHING;