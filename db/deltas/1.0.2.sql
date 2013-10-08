-- Update version
insert into deltas (version, date) values ('1.0.2', 'now()');

alter table orders
      add adjustment_amount integer,
      add adjustment_description text;
