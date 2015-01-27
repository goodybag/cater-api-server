-- Delta

DO $$
  declare version       text := '1.2.61';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  perform add_column( 'restaurants', 'popularity', 'numeric(6,5) default 0.0 check ( popularity <= 1 )' );
end$$;