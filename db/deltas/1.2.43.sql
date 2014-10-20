-- Delta

DO $$
  declare version       text := '1.2.43';
  declare r             record;
  declare count         integer := 0;
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  -- Hook up orders to the correct payment methods
  for r in ( select * from transaction_errors where id > 245 or id between 212 and 238 )
  loop
    count:= count + 1;
    update orders
      set
        payment_method_id = (
          select payment_method_id
          from users_payment_methods
          where users_payment_methods.id = orders.payment_method_id
        ),
        payment_status = null
      where
        payment_status = 'error' and
        datetime >= '2014-10-03' and
        orders.id = r.order_id;
  end loop;
  raise notice 'Updated % orders', count;
  return;

end$$;
