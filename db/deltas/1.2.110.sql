-- Delta for creating "user_emails" table

DO $$
  declare version       text := '1.2.110';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  create table if not exists "user_emails" (
    id            SERIAL PRIMARY KEY
  , created_at    timestamp NOT NULL DEFAULT now()
  , user_id       int references users(id) ON DELETE SET NULL
  , email         text NOT NULL
  , selected      boolean NOT NULL DEFAULT 'n'
  );

end$$;
