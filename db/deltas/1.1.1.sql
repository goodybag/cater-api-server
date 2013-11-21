-- Update version
insert into deltas (version, date) values ('1.1.1', 'now()');

-- #369 - Add restaurant meal type filters

DO $$
  BEGIN
    create table if not exists "meal_styles" (
      id            serial unique not null,
      created_at    timestamptz not null default now(),
      name          text primary key
    );
    
    create table if not exists "restaurant_meal_styles" (
      id            serial unique not null,
      created_at    timestamptz not null default now(),
      restaurant_id int not null references restaurants(id) on delete cascade,
      meal_style    text not null references meal_styles(name) on delete cascade,
      primary key   (restaurant_id, meal_style)
    );
    
    INSERT INTO meal_styles (name)
    SELECT existing.*
    FROM
      (SELECT unnest(array[
        'Individual'
      , 'Group'
      ]) as meal_style) AS existing
    WHERE NOT EXISTS (SELECT name from meal_styles WHERE existing.meal_style = meal_styles.name);
  END;
$$;
