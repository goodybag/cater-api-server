-- Delta

DO $$
  declare version       text := '1.2.119';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  insert into features ( id, name ) values ( 'cater-web', 'Cater Web' );
end$$;