-- Delta

DO $$
  declare version       text := '1.2.37';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  perform add_column( 'payment_summary_items', 'net_payout', 'int default 0' );
end$$;