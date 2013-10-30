-- Update version
insert into deltas (version, date) values ('1.0.15, 'now()');

-- #369 - Add address fields to restaurants, orders schema

DO $$
  BEGIN
    BEGIN
      ALTER TABLE restaurants
        ADD COLUMN street2 text,
        ADD COLUMN delivery_instructions text;
      ALTER TABLE orders
        ADD COLUMN street2 text,
        ADD COLUMN delivery_instructions text;
    EXCEPTION
      WHEN duplicate_column THEN RAISE NOTICE 'column <column_name> already exists in <table_name>.';
    END;
  END;
$$;
