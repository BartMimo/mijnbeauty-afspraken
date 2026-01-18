-- Check column types for appointments and deals tables
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM
    information_schema.columns
WHERE
    table_name IN ('appointments', 'deals')
    AND column_name = 'time'
ORDER BY
    table_name, ordinal_position;