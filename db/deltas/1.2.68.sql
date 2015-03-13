-- Delta

DO $$
  declare version       text := '1.2.68';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  perform add_column( 'payment_summaries', 'payment_status', E'payment_status default \'pending\'' );
end$$;
