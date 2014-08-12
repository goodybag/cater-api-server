-- #1044 - Add `type` to orders
-- #1044 - Remove unnecessary triggers and functions

DO $$
  declare version       text := '1.2.29';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  perform add_column( 'orders', 'type', E'order_type not null default \'delivery\'' );

  update orders o set type = ( case
    when o.is_pickup is true then 'pickup'
    when o.is_delivery_service is true then 'courier'
    else 'delivery'
    end
  )::order_type;

  drop trigger if exists on_order_type_is_pickup_change on orders;
  drop trigger if exists on_order_type_is_delivery_change on orders;
  drop trigger if exists on_order_type_is_delivery_service_change on orders;

  drop function if exists on_order_type_is_pickup_change();
  drop function if exists on_order_type_is_delivery_change();
  drop function if exists on_order_type_is_delivery_service_change();

  drop function if exists ensure_order_type( oid int );
  drop function if exists ensure_order_type( o orders );

  drop function if exists update_order_types( oid int, type text );
  drop function if exists update_order_types( o orders, type text );

  perform drop_column( 'orders', 'is_pickup' );
  perform drop_column( 'orders', 'is_delivery' );
  perform drop_column( 'orders', 'is_delivery_service' );
end$$;