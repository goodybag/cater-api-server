DO $$
  declare version       text := '1.2.14';
  declare r             record;
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();
  FOR r IN execute 'SELECT * FROM restaurant_lead_times'
  LOOP
    update restaurant_lead_times set lead_time = r.lead_time*60 where id = r.id;
  END LOOP;
end$$;