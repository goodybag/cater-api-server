-- #343 Pickup orders

DO $$
  declare version text := '1.2.0';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  perform add_column( 'orders', 'pickup_person_name',   'text' );
  perform add_column( 'orders', 'pickup_person_phone',  'character varying(10)' );
  perform add_column( 'orders', 'is_pickup',            'boolean not null default false' );

  perform add_column( 'restaurants', 'allows_pickup',   'boolean not null default true' );
end$$;
