-- Delta

create or replace function update_order_totals( oid int )
returns void as $$
  declare order_item record;
  declare sub_total int;
begin
  sub_total := 0;
  for order_item in (
    select * from order_items where order_id = oid
  )
  loop
    sub_total := sub_total + order_item.price;
    sub_total := sub_total + (
      select sum( order_item.options_sets)
    );
  end loop;
end;
$$ language plpgsql;

DO $$
  declare version       text := '1.2.18';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  perform add_column( 'orders', 'sub_total',  'int not null default 0' );
  perform add_column( 'orders', 'sales_tax',  'int not null default 0' );
  perform add_column( 'orders', 'total',      'int not null default 0' );
end$$;