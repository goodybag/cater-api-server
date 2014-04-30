-- #835 More restaurant info

DO $$
  declare version       text := '1.2.9';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  perform add_column( 'restaurants', 'billing_email', 'text' );
  perform add_column( 'restaurants', 'billing_street', 'text' );
  perform add_column( 'restaurants', 'billing_street2', 'text' );
  perform add_column( 'restaurants', 'billing_city', 'text' );
  perform add_column( 'restaurants', 'billing_state', 'character varying(2)' );
  perform add_column( 'restaurants', 'billing_zip', 'character varying(5)' );

  perform add_column( 'restaurants', 'gb_fee', 'numeric(5,5) not null default 0.1275' );

  perform add_column( 'restaurants', 'is_direct_deposit', 'boolean not null default true' );

  perform add_column( 'restaurants', 'is_fee_on_total', 'boolean not null default true' );

end$$;