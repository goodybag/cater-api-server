-- Update version
insert into deltas (version, date) values ('1.0.3', 'now()');

CREATE TYPE "tag_type" as 
  ENUM ('Vegan', 'Vegetarian', 'Gluten Free');

CREATE TABLE if not exists "item_tags" (
  id                  serial primary key,
  item_id             int references items(id) on delete cascade,
  tag                 tag_type not null
);

CREATE TABLE if not exists "restaurant_tags" (
  id                  serial primary key,
  restaurant_id       int references restaurants(id) on delete cascade,
  tag                 tag_type not null
);