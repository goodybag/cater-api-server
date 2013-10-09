-- #287: Address book management

/* 
 *  User       <-> Address  1-many
 *  Restaurant <-> Address  1-1
 */
create table if not exists "addresses" (
  id            serial primary key,
  user_id       int references users(id) on delete cascade,
  name          text,
  street        text,
  city          text,
  state         varchar(2),
  zip           varchar(5),
  is_default    boolean
);

alter table "restaurants"
  add column "address_id" int 
  references addresses(id)
  on delete cascade;

-- Update version
insert into deltas (version, date) values ('1.0.2', 'now()');
