begin;
-- Update version
insert into deltas (version, date) values ('1.0.11', 'now()');

UPDATE addresses SET street2='' WHERE street2 IS NULL;

ALTER TABLE addresses
      ALTER COLUMN street SET NOT NULL,
      ALTER COLUMN city SET NOT NULL,
      ALTER COLUMN "state" SET NOT NULL,
      ALTER COLUMN zip SET NOT NULL,
      ALTER COLUMN is_default SET NOT NULL,
      ALTER COLUMN phone SET NOT NULL,
      ALTER COLUMN street2 SET NOT NULL,
      ALTER COLUMN street2 SET DEFAULT '';

ALTER TABLE addresses DROP CONSTRAINT IF EXISTS addresses_pkey cascade;

ALTER TABLE addresses ALTER COLUMN id SET NOT NULL;
ALTER TABLE addresses ADD UNIQUE (id);

ALTER TABLE addresses ADD PRIMARY KEY (user_id, street, street2, zip);

ALTER TABLE restaurants ADD FOREIGN KEY(address_id) REFERENCES addresses(id);

ALTER TABLE orders ADD COLUMN tip_percent tip_percentage;

commit;
