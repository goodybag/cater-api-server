-- Delta

DO $$
  declare version       text := '1.2.42';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();


  -- Hook up orders to the correct payment methods
  update orders
    set
      payment_method_id = (select payment_method_id from users_payment_methods where users_payment_methods.id = orders.payment_method_id),
      payment_status = null
    where payment_status = 'error' and datetime >= '2014-10-03';

end$$;
