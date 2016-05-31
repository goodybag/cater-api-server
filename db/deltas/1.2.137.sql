-- Delta

DO $$
  declare version       text := '1.2.137';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  alter table order_revisions
    drop constraint if exists order_revisions_order_id_fkey;

  alter table order_revisions
    add constraint order_revisions_order_id_fkey
    foreign key (order_id) references orders(id)
    on delete cascade;

  alter table order_statuses
    drop constraint if exists order_statuses_order_id_fkey;

  alter table order_statuses
    add constraint order_statuses_order_id_fkey
    foreign key (order_id) references orders(id)
    on delete cascade;

  alter table payment_summary_items
    drop constraint if exists payment_summary_items_order_id_fkey;

  alter table payment_summary_items
    add constraint payment_summary_items_order_id_fkey
    foreign key (order_id) references orders(id)
    on delete cascade;
end$$;
