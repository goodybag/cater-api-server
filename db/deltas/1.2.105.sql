-- Delta

DO $$
  declare version       text := '1.2.105';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  -- We want our new columns to have `not null` constraints, but
  -- our existing records should default to `now()`
  perform add_column( 'payment_summaries', 'period_begin', 'date' );
  perform add_column( 'payment_summaries', 'period_end', 'date' );

  update payment_summaries set period_begin = now(), period_end = now();

  alter table payment_summaries
    alter column period_begin
    set not null;

  alter table payment_summaries
    alter column period_end
    set not null;
end$$;