begin;
-- Update version
insert into deltas (version, date) values ('1.0.18', 'now()');

-- fix some address stuff, especially uniqueness
UPDATE addresses SET street2='' WHERE street2 IS NULL;
UPDATE addresses SET phone='' WHERE phone IS NULL;

ALTER TABLE addresses
      ALTER COLUMN street SET NOT NULL,
      ALTER COLUMN city SET NOT NULL,
      ALTER COLUMN "state" SET NOT NULL,
      ALTER COLUMN zip SET NOT NULL,
      ALTER COLUMN is_default SET NOT NULL,
      ALTER COLUMN phone SET NOT NULL,
      ALTER COLUMN street2 SET NOT NULL,
      ALTER COLUMN street2 SET DEFAULT '';

ALTER TABLE addresses DROP CONSTRAINT IF EXISTS addresses_pkey cascade,
                      DROP CONSTRAINT IF EXISTS address_phone_check;

ALTER TABLE addresses ALTER COLUMN id SET NOT NULL;
ALTER TABLE addresses ADD UNIQUE (id);

ALTER TABLE addresses ADD PRIMARY KEY (user_id, street, street2, zip);

ALTER TABLE restaurants ADD FOREIGN KEY(address_id) REFERENCES addresses(id);


-- add tip percentage to orders
DO $$
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tip_percentage') THEN
      CREATE TYPE tip_percentage AS ENUM('0', 'custom', '5', '10', '15', '18', '20', '25');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'tip_percent') THEN
      ALTER TABLE orders ADD COLUMN tip_percent tip_percentage;
    END IF;
  END;
$$;

commit;