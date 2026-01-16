#!/usr/bin/env python3
import csv

def escape_sql_string(s):
    """Escape a string for PostgreSQL using E'...' syntax if it contains quotes"""
    if "'" in s:
        # Use E'...' syntax with backslash escaping
        escaped = s.replace("'", "\\'")
        return f"E'{escaped}'"
    else:
        # Use regular quotes
        return f"'{s}'"

def generate_inserts():
    inserts = []
    with open('locations.csv', 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        for row in reader:
            if len(row) == 5:
                city, postcode, lat, lng, province = row
                escaped_city = escape_sql_string(city)
                escaped_province = escape_sql_string(province)
                insert = f"INSERT INTO locations (city, postcode, latitude, longitude, province) VALUES ({escaped_city}, '{postcode}', {lat}, {lng}, {escaped_province});"
                inserts.append(insert)

    # Split into batches of 500
    batch_size = 500
    for i in range(0, len(inserts), batch_size):
        batch = inserts[i:i + batch_size]
        batch_num = chr(97 + (i // batch_size))  # a, b, c, etc.
        batch_file = f'scripts/insert_locations_batch_{batch_num}'
        with open(batch_file, 'w', encoding='utf-8') as f:
            f.write('\n'.join(batch))
            f.write('\n')

if __name__ == '__main__':
    generate_inserts()