-- Delta

DO $$
  declare version       text := '1.2.118';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  perform add_column( 'regions', 'default_price_hike', 'numeric(5, 5) not null default 0' );

  update regions set default_price_hike = 0.04 where id = 1;
end$$;