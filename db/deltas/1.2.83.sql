-- Delta

DO $$
  declare version       text := '1.2.83';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  drop domain if exists feedback_rating cascade;
  create domain feedback_rating as int
  check(
      value > 0
  and value < 6
  );

  drop table if exists "order_feedback";
  create table if not exists "order_feedback" (
    id                         serial primary key
  , created_at                 timestamptz not null default now()
  , order_id                   int not null references orders(id) on delete cascade
  , ease_of_submitting_rating  feedback_rating
  );

  end$$;