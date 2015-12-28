-- Delta

DO $$
  declare version       text := '1.2.113';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();
  
  CREATE TABLE IF NOT EXISTS demo_requests (
    id                 SERIAL PRIMARY KEY
  , region_id          INT NOT NULL REFERENCES regions (id)
  , created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
  , preferred_datetime TIMESTAMPTZ NOT NULL
  , contact_name       TEXT NOT NULL
  , contact_email      CITEXT NOT NULL
  , contact_company    TEXT
  , contact_phone      VARCHAR(10) CHECK (contact_phone SIMILAR TO '[[:digit:]]{10}')
  );
end$$;
