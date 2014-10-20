-- Delta

DO $$
  declare version       text := '1.2.43';
  declare count         text;
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  -- Hook up orders to the correct payment methods
  with updated_rows as (update orders
    set
      payment_method_id = (
        select payment_method_id
        from users_payment_methods
        where users_payment_methods.id = orders.payment_method_id
      ),
      payment_status = null
    from transaction_errors
    where
      payment_status = 'error' and
      datetime >= '2014-10-03' and
      transaction_errors.order_id = orders.id  and
      (transaction_errors.id > 245 or transaction_errors.id between 212 and 238)
    returning orders.*
  )
  select count(*) from updated_rows into count;

  raise notice 'Updated % orders', count;

end$$;
