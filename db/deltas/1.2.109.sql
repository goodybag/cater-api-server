-- Delta

DO $$
  declare version       text := '1.2.109';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  perform add_column(
    'orders'
  , 'priority_account_price_hike_percentage'
  , 'numeric(5, 5) not null default 0'
  );
end$$;