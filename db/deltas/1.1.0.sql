-- Update version
insert into deltas (version, date) values ('1.0.20', 'now()');

-- #366: Add Nuts, Spicy tags

INSERT INTO tags (name)
SELECT existing.*
FROM (SELECT unnest(array['nuts','spicy']) as tag) AS existing
WHERE NOT EXISTS (SELECT name from tags WHERE existing.tag = tags.name);