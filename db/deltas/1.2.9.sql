-- #835 More restaurant info

DO $$
  declare version       text := '1.2.9';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  perform add_column( 'restaurants', 'mailing_street', 'text' );
  perform add_column( 'restaurants', 'mailing_street2', 'text' );
  perform add_column( 'restaurants', 'mailing_city', 'text' );
  perform add_column( 'restaurants', 'mailing_state', 'character varying(2)' );
  perform add_column( 'restaurants', 'mailing_zip', 'character varying(5)' );

  perform add_column( 'restaurants', 'flat_rate', 'numeric(5,5) not null default 0.12500' );

  perform add_column( 'restaurants', 'is_direct_deposit', 'boolean not null default true' );

  perform add_column( 'restaurants', 'is_fee_on_total', 'boolean not null default true' );

end$$;