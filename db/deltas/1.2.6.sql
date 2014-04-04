-- # 795 - we were having trouble deleting summaries with
-- items. This adds delete behavior and fixes the issue

DO $$
  declare version       text := '1.2.6';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  alter table payment_summary_items
  drop constraint payment_summary_items_payment_summary_id_fkey,
  add constraint payment_summary_items_payment_summary_id_fkey
    foreign key (payment_summary_id)
    references payment_summaries(id)
    on delete cascade;
end$$;