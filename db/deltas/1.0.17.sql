-- Update version
insert into deltas (version, date) values ('1.0.11', 'now()');

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



create trigger update_order_status
  after update on orders
  for each row
  when (old.status is distinct from new.status)
  execute procedure process_updated_order();

create trigger new_order_status
  after insert on orders
  for each row
  execute procedure process_new_order();