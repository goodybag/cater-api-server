-- Update version
insert into deltas (version, date) values ('1.1.3', 'now()');

-- #468 Order changes

DO $$
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'change_status') THEN
      CREATE TYPE change_status AS ENUM('canceled', 'submitted', 'denied', 'accepted');
    END IF;
  END;
$$;

CREATE TABLE IF NOT EXISTS order_changes (
  id                serial primary key,
  created_at        timestamptz not null default now(),
  order_id          int not null references orders(id),
  status            change_status not null default 'submitted',
  change_summaries  text[]
);
