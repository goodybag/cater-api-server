-- #287: Address book management
create table "addresses" (
  id            serial primary key,
  user_id       int references users(id) on delete cascade,
  street        text,
  city          text,
  state         varchar(2),
  zip           varchar(5),
  is_default    boolean
);

-- Update version
insert into deltas (version, date) values ('1.0.1', 'now()');