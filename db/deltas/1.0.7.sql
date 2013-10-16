-- Update version
insert into deltas (version, date) values ('1.0.7', 'now()');

-- Support a few more things for address book
DO $$
  BEGIN
    BEGIN
      ALTER TABLE addresses 
        ADD COLUMN street2 text,
        ADD COLUMN phone varchar(10) CHECK (phone SIMILAR TO '[[:digit:]]{10}'),
        ADD COLUMN delivery_instructions text;
    EXCEPTION
      WHEN duplicate_column THEN RAISE NOTICE 'column <column_name> already exists in <table_name>.';
    END;
  END;
$$;