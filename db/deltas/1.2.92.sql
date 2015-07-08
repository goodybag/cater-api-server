-- Delta

DO $$
  declare version       text := '1.2.92';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  perform add_column( 'contacts', 'receives_payment_summaries', 'boolean not null default false' );
end$$;