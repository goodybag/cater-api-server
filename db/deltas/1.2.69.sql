-- Delta

DO $$
  declare version       text := '1.2.69';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();
  
  create table if not exists audit_orders (
    id            serial unique not null,
    created_at    timestamptz not null default now(),
    before        hstore,
    after         hstore
  );
end$$;
