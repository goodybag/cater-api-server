-- Delta

DO $$
  declare version       text := '1.2.115';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();
  create table "promo_codes" (
      id            serial primary key
    , created_at    timestamp not null default now()
    , promo_code    text
    , expires_at    timestamp
    , email         text not null
  );
end$$;
