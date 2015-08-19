-- Delta to create "user_invoice_recipients" table

DO $$
  declare version       text := '1.2.100';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  create table if not exists "user_invoice_recipients" (
    invoice_id   int references user_invoices(id) ON DELETE CASCADE
  , user_id      int references users(id) ON DELETE CASCADE
  , name         text NOT NULL
  , email        text NOT NULL
);

end$$;
