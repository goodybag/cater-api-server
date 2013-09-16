-- 1.0.0.sql

-- #170: Schema Migration Shtuff
create table "deltas" (
  id            serial primary key,
  version       text,
  date          timestamp default now()
);

-- Update version
insert into deltas (version, date) values ('1.0.0', 'now()');