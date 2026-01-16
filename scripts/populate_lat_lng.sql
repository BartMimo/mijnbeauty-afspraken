-- Update salons with approximate lat/lng based on city for distance filtering
-- Run after adding lat/lng columns

-- Amsterdam
UPDATE salons SET latitude = 52.3676, longitude = 4.9041 WHERE city ILIKE '%amsterdam%';

-- Rotterdam
UPDATE salons SET latitude = 51.9225, longitude = 4.4792 WHERE city ILIKE '%rotterdam%';

-- Utrecht
UPDATE salons SET latitude = 52.0907, longitude = 5.1214 WHERE city ILIKE '%utrecht%';

-- Den Haag
UPDATE salons SET latitude = 52.0705, longitude = 4.3007 WHERE city ILIKE '%den haag%' OR city ILIKE '%s-gravenhage%';

-- Eindhoven
UPDATE salons SET latitude = 51.4416, longitude = 5.4697 WHERE city ILIKE '%eindhoven%';

-- Groningen
UPDATE salons SET latitude = 53.2194, longitude = 6.5665 WHERE city ILIKE '%groningen%';

-- Tilburg
UPDATE salons SET latitude = 51.5555, longitude = 5.0913 WHERE city ILIKE '%tilburg%';

-- Almere
UPDATE salons SET latitude = 52.3508, longitude = 5.2647 WHERE city ILIKE '%almere%';

-- Breda
UPDATE salons SET latitude = 51.5719, longitude = 4.7683 WHERE city ILIKE '%breda%';

-- Nijmegen
UPDATE salons SET latitude = 51.8126, longitude = 5.8372 WHERE city ILIKE '%nijmegen%';

-- Enschede
UPDATE salons SET latitude = 52.2215, longitude = 6.8937 WHERE city ILIKE '%enschede%';

-- Haarlem
UPDATE salons SET latitude = 52.3874, longitude = 4.6462 WHERE city ILIKE '%haarlem%';

-- Uden
UPDATE salons SET latitude = 51.6667, longitude = 5.6167 WHERE city ILIKE '%uden%';

-- Zwolle
UPDATE salons SET latitude = 52.5168, longitude = 6.0830 WHERE city ILIKE '%zwolle%';

-- Arnhem
UPDATE salons SET latitude = 51.9851, longitude = 5.8987 WHERE city ILIKE '%arnhem%';

-- Maastricht
UPDATE salons SET latitude = 50.8514, longitude = 5.6910 WHERE city ILIKE '%maastricht%';

-- Leiden
UPDATE salons SET latitude = 52.1601, longitude = 4.4970 WHERE city ILIKE '%leiden%';

-- Default for others (use a central location, e.g., Amsterdam)
UPDATE salons SET latitude = 52.3676, longitude = 4.9041 WHERE latitude IS NULL;