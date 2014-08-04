drop trigger if exists on_order_type_is_pickup_change on orders;
create trigger on_order_type_is_pickup_change
    after update of is_pickup
    on orders
    for each row
    when ( OLD.* is distinct from NEW.* )
    execute procedure on_order_type_is_pickup_change();

drop trigger if exists on_order_type_is_delivery_change on orders;
create trigger on_order_type_is_delivery_change
    after update of is_delivery
    on orders
    for each row
    when ( OLD.* is distinct from NEW.* )
    execute procedure on_order_type_is_delivery_change();

drop trigger if exists on_order_type_is_delivery_service_change on orders;
create trigger on_order_type_is_delivery_service_change
    after update of is_delivery_service
    on orders
    for each row
    when ( OLD.* is distinct from NEW.* )
    execute procedure on_order_type_is_delivery_service_change();