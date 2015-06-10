-- Delta

DO $$
  declare version       text := '1.2.88';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  update restaurants set has_contract = true where plan_id is null;
end$$;
