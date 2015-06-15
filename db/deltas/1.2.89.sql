-- Delta

DO $$
  declare version       text := '1.2.89';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  perform add_column( 'order_feedback', 'submitting_notes', 'text' );
end$$;