-- Delta #871 add hide toggle for menu items

DO $$
  declare version       text := '1.2.15';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  perform add_column( 'items', 'is_hidden', 'boolean not null default false' );
end$$;
