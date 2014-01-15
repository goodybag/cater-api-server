-- #574 PDF Summaries

DO $$
  declare version       text := '1.2.0';

begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  create table if not exists "payment_summaries" (
    id            serial primary key
  , created_at    timestamp not null default now()
  , payment_date  timestamp
  , restaurant_id int not null references restaurants ("id") on delete set null
  );

  create table if not exists "payment_summary_item" (
    id                  serial primary key
  , created_at          timestamp not null default now()
  , payment_summary_id  int not null references payment_summaries ("id")
  , order_id            int not null references orders ("id")
  , delivery_fee        int default 0
  , tip                 int default 0
  , order_total         int default 0
  , gb_fee              int default 0
  , sales_tax           int default 0
  );

end$$;
