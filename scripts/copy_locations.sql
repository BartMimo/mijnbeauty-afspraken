-- Copy locations from CSV
COPY locations (city, postcode, latitude, longitude, province) 
FROM '/path/to/locations.csv' 
WITH (FORMAT csv, HEADER false);
