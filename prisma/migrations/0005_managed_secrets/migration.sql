-- Retire generic settings-backed credentials. Historical values were readable
-- through the settings API and backups, so they must not be preserved as trusted
-- credentials. Operators re-enter rotated values through the dedicated managed-
-- secret APIs after this migration.
UPDATE "settings"
SET
    "integrations" = '[]'::jsonb,
    "environment_variables" = '[]'::jsonb
WHERE
    "integrations" <> '[]'::jsonb
    OR "environment_variables" <> '[]'::jsonb;
