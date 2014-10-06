-- Delta

DO $$
  declare version       text := '1.2.40';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  perform add_column( 'orders', 'user_adjustment_amount', 'int not null default 0' );
  perform add_column( 'orders', 'user_adjustment_description', 'int not null default 0' );
  perform add_column( 'orders', 'restaurant_total', 'int not null default 0' );
end$$;