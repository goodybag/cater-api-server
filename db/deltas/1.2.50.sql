-- Delta

DO $$
  declare version       text := '1.2.50';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  perform add_column( 'restaurants', 'has_contract', 'boolean not null default false' );
  perform add_column( 'restaurants', 'no_contract_fee', 'numeric(5,5) not null default 0.0000' );
  perform add_column( 'orders', 'no_contract_amount', 'int not null default 0' );
end$$;