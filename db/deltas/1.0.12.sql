-- Update version
insert into deltas (version, date) values ('1.0.12', 'now()');

-- #369 - Add restaurant meal type filters

create table if not exists "restaurant_meal_types" (
  id            serial primary key,
  created_at    timestamptz not null default now(),
  restaurant_id int not null references restaurants(id) on delete cascade,
  meal_type     text
);