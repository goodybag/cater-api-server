INSERT INTO groups (name) VALUES ('admin');
INSERT INTO groups (name) VALUES ('client');
INSERT INTO groups (name) VALUES ('restaurant');
INSERT INTO groups (name) VALUES ('receipts');
INSERT INTO groups (name) VALUES ('pms');

INSERT INTO users (email, password) VALUES ('receipts@goodybag.com', '$2a$10$8egVetFrE7OAk1B.v36dOOdhS9TXt98PN7/zCvLdeAuOa0KLXIzIi');
INSERT INTO users_groups (user_id, "group") SELECT id, 'receipts' FROM users WHERE email = 'receipts@goodybag.com';

INSERT INTO users (email, password) VALUES ('pms@goodybag.com', '$2a$10$FGN90mpEJjVxieb1B.98YeVF6fJQ1/Bs6BQZ5wAEyCTnmxvLFazlq');
INSERT INTO users_groups (user_id, "group") SELECT id, 'pms' FROM users WHERE email = 'pms@goodybag.com';

INSERT INTO tags (name)
SELECT existing.*
FROM (SELECT unnest(array['glutenFree','vegan', 'vegetarian','kosher','halal', 'dairyFree']) as tag) AS existing
WHERE NOT EXISTS (SELECT name from tags WHERE existing.tag = tags.name);

INSERT INTO meal_types (name)
SELECT existing.*
FROM
  (SELECT unnest(array[
    'Appetizers'
  , 'Breakfast'
  , 'Brunch'
  , 'Lunch'
  , 'Dinner'
  , 'Dessert'
  ]) as meal_type) AS existing
WHERE NOT EXISTS (SELECT name from meal_types WHERE existing.meal_type = meal_types.name);



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