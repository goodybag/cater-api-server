-- Update version
insert into deltas (version, date) values ('1.0.11', 'now()');

ALTER TABLE addresses
      ALTER COLUMN street SET NOT NULL,
      ALTER COLUMN city SET NOT NULL,
      ALTER COLUMN "state" SET NOT NULL,
      ALTER COLUMN zip SET NOT NULL,
      ALTER COLUMN is_default SET NOT NULL,
      ALTER COLUMN phone SET NOT NULL;
