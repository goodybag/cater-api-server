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

DROP TRIGGER schedule_remind_restaurant ON orders;
CREATE TRIGGER schedule_remind_restaurant 
  AFTER INSERT on orders
  FOR EACH ROW 
  EXECUTE PROCEDURE schedule_remind_restaurant();

DROP TRIGGER update_remind_restaurant ON orders;
CREATE TRIGGER update_remind_restaurant
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE PROCEDURE update_remind_restaurant();