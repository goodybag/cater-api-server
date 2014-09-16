-- Delta

DO $$
  declare version       text := '1.2.36';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  perform add_column( 'regions', 'is_hidden', 'bool not null default false' );
  update regions set is_hidden = true where name = 'None';
end$$;