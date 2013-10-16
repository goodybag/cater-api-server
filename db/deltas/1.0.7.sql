-- Update version
insert into deltas (version, date) values ('1.0.7', 'now()');

-- Add JSON data field to waitlist
DO $$
  BEGIN
    BEGIN
    ALTER TABLE users ADD name text;
    UPDATE users set first_name=null where first_name='';
    UPDATE users set last_name=null where last_name='';
    UPDATE users SET name = CASE WHEN first_name IS NOT NULL AND last_name IS NOT NULL
                                 THEN first_name || ' ' || last_name
                                 ELSE coalesce(first_name, '') || coalesce(last_name, '')
                                 END;
    EXCEPTION
      WHEN duplicate_column THEN RAISE NOTICE 'column <column_name> already exists in <table_name>.';
    END;
  END;
$$;

ALTER TABLE users DROP COLUMN IF EXISTS first_name, DROP COLUMN IF EXISTS last_name;
