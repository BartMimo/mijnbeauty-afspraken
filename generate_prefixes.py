import csv
from collections import defaultdict

# Read the locations CSV
postcode_data = defaultdict(list)

with open('locations.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        postcode = row['postcode']
        if len(postcode) >= 4:
            prefix = postcode[:4]
            lat = float(row['latitude'])
            lng = float(row['longitude'])
            city = row['city']
            province = row['province']
            postcode_data[prefix].append({
                'lat': lat,
                'lng': lng,
                'city': city,
                'province': province,
                'full_postcode': postcode
            })

# Calculate averages
with open('scripts/postcode_prefixes.sql', 'w', encoding='utf-8') as f:
    f.write('-- Postcode prefixes with average coordinates\n')
    f.write('CREATE TABLE IF NOT EXISTS postcode_prefixes (\n')
    f.write('    prefix VARCHAR(4) PRIMARY KEY,\n')
    f.write('    avg_latitude DECIMAL(10,8),\n')
    f.write('    avg_longitude DECIMAL(11,8),\n')
    f.write('    province VARCHAR(50),\n')
    f.write('    city VARCHAR(100)\n')
    f.write(');\n\n')

    f.write('INSERT INTO postcode_prefixes (prefix, avg_latitude, avg_longitude, province, city) VALUES\n')

    inserts = []
    for prefix, locations in sorted(postcode_data.items()):
        avg_lat = sum(loc['lat'] for loc in locations) / len(locations)
        avg_lng = sum(loc['lng'] for loc in locations) / len(locations)

        # Use the most common city/province for this prefix
        cities = [loc['city'] for loc in locations]
        provinces = [loc['province'] for loc in locations]
        most_common_city = max(set(cities), key=cities.count)
        most_common_province = max(set(provinces), key=provinces.count)

        inserts.append(f"('{prefix}', {avg_lat:.8f}, {avg_lng:.8f}, '{most_common_province}', '{most_common_city}')")

    f.write(',\n'.join(inserts))
    f.write('\nON CONFLICT (prefix) DO NOTHING;\n')

print('Generated postcode_prefixes.sql')</content>
<parameter name="filePath">/Users/bartvangemert/Downloads/mijn-beauty-afspraken/generate_prefixes.py