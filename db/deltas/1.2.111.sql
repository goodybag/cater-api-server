-- Delta to update "user_invoice_recipients" table

DO $$
  declare version       text := '1.2.110';
  declare u             users;

begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  -- Drop NOT NULL constraint from user_invoice_recipients.name
  alter table user_invoice_recipients alter name drop not null;

  -- Init copy user (id, name, email) to user_invoice_recipients
  for u in ( select * from users )
  loop
    insert into user_invoice_recipients
      ( user_id, name, email ) values ( u.id, u.name, u.email );
  end loop;

end$$;
