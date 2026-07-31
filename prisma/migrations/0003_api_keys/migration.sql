-- Retire the legacy settings-backed plaintext API-key payload before removing
-- its column. Existing values cannot be migrated securely because they were
-- stored as recoverable secrets and may already have been disclosed.
ALTER TABLE "settings" DROP COLUMN "api_keys";

-- Dedicated API credentials. Only a SHA-256 digest and display-safe prefix are
-- persisted; the raw credential is returned exactly once by the create route.
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "secret_hash" TEXT NOT NULL,
    "scopes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "expires_at" TIMESTAMP(3),
    "last_used_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "api_keys_secret_hash_key" ON "api_keys"("secret_hash");
CREATE INDEX "api_keys_created_by_id_idx" ON "api_keys"("created_by_id");
CREATE INDEX "api_keys_enabled_revoked_at_idx" ON "api_keys"("enabled", "revoked_at");
CREATE INDEX "api_keys_expires_at_idx" ON "api_keys"("expires_at");

ALTER TABLE "api_keys"
ADD CONSTRAINT "api_keys_created_by_id_fkey"
FOREIGN KEY ("created_by_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
