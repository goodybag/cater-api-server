-- Update version
insert into deltas (version, date) values ('1.0.18', 'now()');

DO $$
  BEGIN
    BEGIN
      alter table "orders" add column "status" order_status default 'pending';
    EXCEPTION
      WHEN duplicate_column THEN RAISE NOTICE 'column <column_name> already exists in <table_name>.';
    END;
  END;
$$;

update orders
set status = "s"."status"
from (
  select "statuses"."order_id", "statuses"."status"
  from "order_statuses" "statuses"
  inner join (
    select "order_statuses"."order_id", max(created_at) as created_at
    from "order_statuses"
    group by "order_statuses"."order_id"
  ) "recent"
  on "recent"."order_id" = "statuses"."order_id" and "recent"."created_at" = "statuses"."created_at"
) s
where "orders"."id" = "s"."order_id"
;

create or replace function process_updated_order() returns trigger as $process_updated_order$
  begin
    insert into order_statuses(order_id, status) values(NEW.id, NEW.status);
    return null;
  end
$process_updated_order$ language plpgsql;

create or replace function process_new_order() returns trigger as $process_new_order$
  begin
    insert into order_statuses(order_id, status) values(NEW.id, NEW.status);
    return null;
  end
  $process_new_order$ language plpgsql;

DROP TRIGGER IF EXISTS update_order_status ON orders;
create trigger update_order_status
  after update on orders
  for each row
  when (old.status is distinct from new.status)
  execute procedure process_updated_order();

DROP TRIGGER IF EXISTS new_order_status ON orders;
create trigger new_order_status
  after insert on orders
  for each row
  execute procedure process_new_order();

CREATE TYPE payment_method AS ENUM('card', 'bank');
CREATE TYPE payment_type AS ENUM('debit', 'credit');
CREATE TYPE payment_status AS ENUM('pending', 'processing', 'paid', 'invoiced', 'error');


CREATE TABLE IF NOT EXISTS payment_methods (
  id SERIAL NOT NULL
, created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
, type PAYMENT_METHOD NOT NULL
, uri TEXT NOT NULL
, data JSON NOT NULL

, CONSTRAINT payment_methods_pkey PRIMARY KEY (id)
, CONSTRAINT payment_methods_uri_key UNIQUE (uri)
);

CREATE TABLE IF NOT EXISTS restaurant_cuts (
  id SERIAL NOT NULL
, created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
, restaurant_id INT4 NOT NULL
, amount INT4 NOT NULL
, percentage FLOAT4 NOT NULL

, CONSTRAINT restaurant_cuts_pkey PRIMARY KEY (id)
, CONSTRAINT restaurant_cuts_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES restaurants (id) ON UPDATE NO ACTION ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS transaction_errors (
  id SERIAL NOT NULL
, created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
, order_id INT4 NOT NULL
, request_id TEXT
, data JSON

, CONSTRAINT transaction_errors_pkey PRIMARY KEY (id)
, CONSTRAINT transaction_errors_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders (id) ON UPDATE NO ACTION ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL NOT NULL
, created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
, type PAYMENT_TYPE NOT NULL
, order_id INT4 NOT NULL
, uri TEXT NOT NULL
, data JSON

, CONSTRAINT transactions_pkey PRIMARY KEY (id)
, CONSTRAINT transactions_uri_key UNIQUE (uri)
, CONSTRAINT transactions_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders (id) ON UPDATE NO ACTION ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS users_payment_methods (
  id SERIAL NOT NULL
, created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
, user_id INT4 NOT NULL
, payment_method_id INT4 NOT NULL

, CONSTRAINT users_payment_methods_pkey PRIMARY KEY (user_id, payment_method_id)
, CONSTRAINT users_payment_methods_id_key UNIQUE (id)
, CONSTRAINT users_payment_methods_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id) ON UPDATE NO ACTION ON DELETE CASCADE
, CONSTRAINT users_payment_methods_payment_method_id_fkey FOREIGN KEY (payment_method_id) REFERENCES payment_methods (id) ON UPDATE NO ACTION ON DELETE CASCADE
);


ALTER TABLE restaurants ADD balanced_customer_uri TEXT;
ALTER TABLE restaurants ADD payment_method_id INT4;
ALTER TABLE restaurants ADD CONSTRAINT restaurants_payment_method_id_fkey FOREIGN KEY (payment_method_id) REFERENCES payment_methods (id) ON UPDATE NO ACTION ON DELETE SET NULL;
ALTER TABLE restaurants ADD CONSTRAINT restaurants_balanced_customer_uri_key UNIQUE (balanced_customer_uri);

ALTER TABLE users ADD balanced_customer_uri TEXT;
ALTER TABLE users ADD is_invoiced BOOL NOT NULL DEFAULT 'false';
ALTER TABLE users ADD CONSTRAINT users_balanced_customer_uri_key UNIQUE (balanced_customer_uri);

ALTER TABLE orders ADD cut INT4;
ALTER TABLE orders ADD payment_method_id INT4;
ALTER TABLE orders ADD payment_status PAYMENT_STATUS;
ALTER TABLE orders ADD CONSTRAINT orders_payment_method_id_fkey FOREIGN KEY (payment_method_id) REFERENCES payment_methods (id) ON UPDATE NO ACTION;
