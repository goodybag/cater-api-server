-- #574 PDF Summaries

DO $$
  declare version       text := '1.2.0';

begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  create table if not exists "payment_summaries" (
    id                  serial primary key
  , created_at          timestamp not null default now()
  , payment_date        date default now()
  , restaurant_id       int not null references restaurants ("id") on delete set null
  , adjustment          int default 0
  , adjustment_text     text
  );

  create table if not exists "payment_summary_items" (
    id                  serial primary key
  , created_at          timestamp not null default now()
  , payment_summary_id  int not null references payment_summaries ("id")
  , order_id            int not null references orders ("id")
  , delivery_fee        int default 0
  , tip                 int default 0
  , sub_total           int default 0
  , gb_fee              numeric( 5, 5 ) default 0
  , sales_tax           numeric( 5, 5 ) default 0
  );


  if not exists( select 1 from groups where name = 'pms' )
  then
    INSERT INTO groups (name) VALUES ('pms');
  end if;

  if not exists( select 1 from users where email = 'pms@goodybag.com' )
  then
    INSERT INTO users (email, password) VALUES ('pms@goodybag.com', '$2a$10$FGN90mpEJjVxieb1B.98YeVF6fJQ1/Bs6BQZ5wAEyCTnmxvLFazlq');
  end if;

  if not exists( select 1 from users_groups, users where users_groups."group" = 'pms' and users_groups.user_id = users.id and users.email = 'pms@goodybag.com'  )
  then
    INSERT INTO users_groups (user_id, "group") SELECT id, 'pms' FROM users WHERE email = 'pms@goodybag.com';
  end if;

end$$;
