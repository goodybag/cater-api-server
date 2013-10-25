-- Update version
insert into deltas (version, date) values ('1.0.12', 'now()');

-- #369 - Add restaurant meal type filters

create table if not exists "meal_types" (
  id            serial,
  created_at    timestamptz not null default now(),
  name          text primary key
);

create table if not exists "restaurant_meal_types" (
  id            serial unique not null,
  created_at    timestamptz not null default now(),
  restaurant_id int not null references restaurants(id) on delete cascade,
  meal_type     text not null references meal_types(name) on delete cascade,
  primary key   (restaurant_id, meal_type)
);

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
