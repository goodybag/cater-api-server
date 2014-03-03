-- #708 fix old pending orders

DO $$
  declare version     text          := '1.1.13';
  declare status_from order_status  := 'pending';
  declare status_to   order_status  := 'canceled';
  declare cutoff_date timestamp     := '2013-11-19';
  declare o record;
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  raise notice 'Setting orders created before v% from v% to v%', cutoff_date, status_from, status_to;

  for o in update orders
    set status = status_to
    where status      = status_from
      and created_at  < cutoff_date
    returning *
  loop
    insert into order_statuses ( order_id, status ) values ( o.id, status_to );
  end loop;
end$$;
