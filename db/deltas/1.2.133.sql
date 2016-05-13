-- Delta

DO $$
  declare version       text := '1.2.133';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  create table if not exists payment_summary_transfer_logs(
    id                  serial primary key
  , payment_summary_id  int references payment_summaries(id)
  , status              pms_status not null default 'pending'
  , data                jsonb not null default '{}'::jsonb
  , created_at          timestamp without time zone not null default now()
  );

  drop index if exists payment_summary_transfer_logs_payment_summary_id_idx;
  create index payment_summary_transfer_logs_payment_summary_id_idx
    on payment_summary_transfer_logs( payment_summary_id );

  drop index if exists payment_summary_transfer_logs_status_idx;
  create index payment_summary_transfer_logs_status_idx
    on payment_summary_transfer_logs( status );
end$$;
