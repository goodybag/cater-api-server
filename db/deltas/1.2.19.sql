-- #943

create or replace function on_order_items_delete()
returns trigger as $$
begin
  perform update_order_totals( OLD.order_id );
  return OLD;
end;
$$ language plpgsql;

DO $$
 declare version       text := '1.2.19';

begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  drop trigger if exists order_order_items_change on order_items;

  create trigger order_order_items_change
    after insert or update
    on order_items
    for each row
    execute procedure on_order_items_change();

  create trigger order_order_items_delete
    after delete
    on order_items
    for each row
    execute procedure on_order_items_delete();

end$$;
