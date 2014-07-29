-- Delta

DO $$
  declare version       text := '1.2.26';
  declare r             record;
  declare min           int;
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  for r in ( select * from restaurants ) loop
    if r.minimum_order is not null then
      update restaurants
        set minimum_order = null
          , delivery_service_order_amount_threshold = r.minimum_order
        where id = r.id;
    end if;
  end loop;
end$$;