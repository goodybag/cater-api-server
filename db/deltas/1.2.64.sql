-- Delta

DO $$
  declare version       text := '1.2.64';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  perform add_column( 'restaurants', 'is_featured', 'boolean not null default false'  );
end$$;
