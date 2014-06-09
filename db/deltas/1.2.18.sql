-- Delta

DO $$
  declare version       text := '1.2.18';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  perform add_column('orders', 'sub_total', 'int not null default 0');

  execute 'CREATE FUNCTION calc_order_totals() RETURNS trigger AS $calc_order_totals$
    DECLARE
      sub_total        integer;
    BEGIN
      UPDATE orders set sub_total = 1234 where orders.id = NEW.order_id;
      RETURN NEW;
    END;
  $calc_order_totals$ LANGUAGE plpgsql;';

  -- Create order subtotal trigger
  execute 'CREATE TRIGGER order_totals_trigger
    AFTER INSERT OR UPDATE on order_items
    FOR EACH ROW EXECUTE PROCEDURE calc_order_totals();';
end$$;