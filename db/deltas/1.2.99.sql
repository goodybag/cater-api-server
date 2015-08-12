-- Delta for creating "requested_restaurants" table

DO $$
  declare version       text := '1.2.99';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  create table if not exists "requested_restaurants" (
    id            SERIAL PRIMARY KEY
  , created_at    timestamp NOT NULL DEFAULT now()
  , user_id       int references users(id) ON DELETE CASCADE
  , restaurant    text NOT NULL
  );

end$$;
