-- Delta

DO $$
  declare version       text := '1.2.65';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  create table if not exists "user_invoices" ();
  create table if not exists "user_invoice_orders" ();

  perform add_column( 'user_invoices', 'id', 'serial primary key' );
  perform add_column( 'user_invoices', 'user_id', 'int references users("id")' );
  perform add_column( 'user_invoices', 'billing_period_start', 'date not null');
  perform add_column( 'user_invoices', 'billing_period_end', 'date not null');
  perform add_column( 'user_invoices', 'created_at', 'timestamp not null default now()' );
  
  perform add_column( 'user_invoice_orders', 'id', 'serial primary key' );
  perform add_column( 'user_invoice_orders', 'user_invoice_id', 'int references user_invoices("id")' );
  perform add_column( 'user_invoice_orders', 'order_id', 'int references orders("id")' );

  -- Ensure we don't conflict with current invoice numbers:
  perform setval( 'user_invoices_id_seq', 100 );
end$$;