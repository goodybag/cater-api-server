-- Update version
insert into deltas (version, date) values ('1.0.11', 'now()');

-- #366: Add Kosher, Halal tags

INSERT INTO tags (name)
SELECT existing.*
FROM (SELECT unnest(array['kosher','halal']) as tag) AS existing
WHERE NOT EXISTS (SELECT name from tags WHERE existing.tag = tags.name);