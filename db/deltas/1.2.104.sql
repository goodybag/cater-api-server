-- Delta

DO $$
  declare version       text := '1.2.104';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  create unique index dirac_session_sid_idx on dirac_session(sid);
end$$;