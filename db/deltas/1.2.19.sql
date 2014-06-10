-- #892 asap order part 3

DO $$
  declare version       text := '1.2.19';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  perform add_column( 'orders', 'pickup_datetime', 'timestamp without time zone' );
end$$;