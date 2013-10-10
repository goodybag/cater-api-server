-- Update version
insert into deltas (version, date) values ('1.0.2', 'now()');

-- there's no add column if not exists
DO $$
    BEGIN
        BEGIN
        ALTER TABLE restaurants ADD is_hidden NOT NULL DEFAULT TRUE;
        EXCEPTION
            WHEN duplicate_column THEN RAISE NOTICE 'column <column_name> already exists in <table_name>.';
        END;
    END;
$$;

UPDATE restaurants SET is_hidden=FALSE WHERE name NOT IN ('Cow Bells',
'Sugaplump Pastries',
'Texas Honey Ham Company',
'Cupprimo Cupcakery',
'Bamboo Grille',
'TEST',
'Lucky J''s Chicken & Waffles',
'Bar-B-Que Heaven',
'Maoz');
