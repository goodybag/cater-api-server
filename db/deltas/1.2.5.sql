-- Delta
-- This is a noop delta because the real work is done in the
-- Post-delta bin script

DO $$
  declare version       text := '1.2.5';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();
end$$;