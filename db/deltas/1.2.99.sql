-- Delta

DO $$
  declare version       text := '1.2.99';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  perform add_column( 'delivery_services', 'disable_searching_within_fulfillability', 'boolean not null default false' );
end$$;