-- Delta

DO $$
  declare version       text := '1.2.95';
  declare otip          int;
  declare o             orders;
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  for o in (
    select * from orders
      where tip_percent != 'custom'
        and tip_percent is not null
        and tip = 0
  ) loop
    otip := floor( (o.tip_percent::text)::int * o.sub_total / 100 );

    if otip > 0 then
      raise notice 'Setting tip to % for order #%', otip, o.id;
      update orders set tip = otip where id = o.id;
    end if;
  end loop;
end$$;