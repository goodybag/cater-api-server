-- Delta

DO $$
  declare version       text := '1.2.68';
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
  perform add_column( 'user_invoices', 'status', E'invoice_status not null default \'pending\'');
  perform add_column( 'user_invoices', 'email_sent_date', 'timestamp' );
  perform add_column( 'user_invoices', 'created_at', 'timestamp not null default now()' );
  
  perform add_column( 'user_invoice_orders', 'user_invoice_id', 'int not null references user_invoices("id") on delete cascade' );
  perform add_column( 'user_invoice_orders', 'order_id', 'int not null references orders("id")' );

  alter table "user_invoice_orders" drop constraint if exists user_invoice_orders_pkey;
  alter table "user_invoice_orders" add primary key ( user_invoice_id, order_id );

  -- Ensure we don't conflict with current invoice numbers:
  perform setval( 'user_invoices_id_seq', 100 );
end$$;