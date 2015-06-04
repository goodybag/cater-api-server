-- Delta

DO $$
  declare version       text := '1.2.84';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  -- All previous invoiced orders should be labeled 'paid'.
  -- The new debit processing will automatically use our invoicing account
  -- in place of the customer for invoiced orders.

  -- An invoiced order is one such that payment_method_id is null.

  update orders
    set payment_status = 'paid'
    where payment_status is null
      and payment_method_id is null
      and status = 'accepted';
end$$;
