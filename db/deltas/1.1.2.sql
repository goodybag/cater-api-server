-- Update version
insert into deltas (version, date) values ('1.1.2', 'now()');

-- #366: Add Nuts, Spicy tags

INSERT INTO tags (name)
SELECT existing.*
FROM (SELECT unnest(array['nuts','spicy']) as tag) AS existing
WHERE NOT EXISTS (SELECT name from tags WHERE existing.tag = tags.name);