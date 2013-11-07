INSERT INTO groups (name) VALUES ('admin');
INSERT INTO groups (name) VALUES ('client');
INSERT INTO groups (name) VALUES ('receipts');

INSERT INTO users (email, password) VALUES ('receipts@goodybag.com', '$2a$10$8egVetFrE7OAk1B.v36dOOdhS9TXt98PN7/zCvLdeAuOa0KLXIzIi');

create function process_updated_order() returns trigger as $process_updated_order$
  begin
    insert into order_statuses(order_id, status) values(NEW.id, NEW.status);
    return null;
  end
$process_updated_order$ language plpgsql;

create function process_new_order() returns trigger as $process_new_order$
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
