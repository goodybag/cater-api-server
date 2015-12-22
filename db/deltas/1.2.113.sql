-- Delta

DO $$
  declare version       text := '1.2.113';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  create index orders_datetime_idx on orders (datetime);
    
end$$;
