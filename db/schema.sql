-- Postgres schema mirroring src/lib/store.ts. Requires the pgvector extension for memory.
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE users (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email                  text UNIQUE,
  age_status             text NOT NULL DEFAULT 'unverified'
                         CHECK (age_status IN ('unverified','pending','verified','rejected')),
  age_verification_ref   text,               -- provider reference only; never store ID images
  banned                 boolean NOT NULL DEFAULT false,
  strikes                integer NOT NULL DEFAULT 0,
  created_at             timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE characters (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        text NOT NULL,
  age         integer NOT NULL CHECK (age >= 18 AND age <= 99),   -- adult-only enforced in the DB too
  hair        text NOT NULL,
  eyes        text NOT NULL,
  build       text NOT NULL,
  style       text NOT NULL,
  personality text NOT NULL,
  hobbies     text[] NOT NULL DEFAULT '{}',
  backstory   text NOT NULL DEFAULT '',
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE messages (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  character_id uuid NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  role         text NOT NULL CHECK (role IN ('user','assistant')),
  content      text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX messages_thread_idx ON messages (user_id, character_id, created_at);

CREATE TABLE memory_facts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  character_id uuid NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  fact         text NOT NULL,
  embedding    vector(1536),
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Append-only: balance = SUM(delta). Never UPDATE or DELETE rows.
CREATE TABLE token_ledger (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  delta      integer NOT NULL CHECK (delta <> 0),
  reason     text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX token_ledger_user_idx ON token_ledger (user_id);

CREATE TABLE audit_log (
  id         bigserial PRIMARY KEY,
  user_id    uuid,
  kind       text NOT NULL,
  category   text,
  detail     text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
