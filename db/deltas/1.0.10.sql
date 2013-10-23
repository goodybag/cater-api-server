-- Update version
insert into deltas (version, date) values ('1.0.10', 'now()');

-- #278: Dietary Tags
CREATE TABLE if not exists "tags" (
  name text primary key
);

CREATE TABLE if not exists "item_tags" (
  item_id   int  references items(id)  on delete cascade,
  tag       text references tags(name) on delete cascade,
  primary key (item_id, tag)
);

CREATE TABLE if not exists "restaurant_tags" (
  restaurant_id   int  references restaurants(id) on delete cascade,
  tag             text references tags(name)      on delete cascade,
  primary key (restaurant_id, tag)
);

INSERT INTO tags (name)
SELECT existing.*
FROM (SELECT unnest(array['glutenFree','vegan', 'vegetarian']) as tag) AS existing
WHERE NOT EXISTS (SELECT name from tags WHERE existing.tag = tags.name);