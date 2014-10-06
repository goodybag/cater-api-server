-- Delta

DO $$
  declare version       text := '1.2.38';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  perform add_column( 'restaurants', 'pms_contact_id', 'int references contacts(id) on delete set null' );
end$$;