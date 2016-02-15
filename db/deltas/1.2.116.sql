-- Delta

DO $$
  declare version       text := '1.2.116';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  perform add_column('regions', 'support_phone', 'text');

  update regions set support_phone = '5126774224';
  update regions set support_phone = '2067758025' where id = 4;
  update regions set support_phone = '6154324065' where id = 5;
end$$;