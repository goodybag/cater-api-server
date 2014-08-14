drop trigger if exists on_order_create on orders;
create trigger on_order_create
    after insert
    on orders
    for each row
    execute procedure on_order_create();

drop trigger if exists on_order_type_change on orders;
create trigger on_order_type_change
    after update of type
    on orders
    for each row
    execute procedure on_order_type_change();