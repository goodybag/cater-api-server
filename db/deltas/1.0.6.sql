-- Update version
insert into deltas (version, date) values ('1.0.6', 'now()');

-- Add JSON data field to waitlist
DO $$
  BEGIN
    BEGIN
    alter table orders add tip int not null default 0;
    EXCEPTION
      WHEN duplicate_column THEN RAISE NOTICE 'column <column_name> already exists in <table_name>.';
    END;
  END;
$$;
