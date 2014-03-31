with unnested as (
 select unnest(emails) emails, restaurant_id from contacts
)
select array_agg(unnested.emails) as emails from restaurants
join unnested on restaurants.id=unnested.restaurant_id
where restaurants.id = 10;

---

with
  unnested_emails as (
    select unnest(emails) emails, restaurant_id from contacts
  ),

  unnested_sms_phones as (
    select unnest(sms_phones) sms_phones, restaurant_id from contacts
  ),

  unnested_voice_phones as (
    select unnest(voice_phones) voice_phones, restaurant_id from contacts
  )

select
  array_agg(unnested_emails.emails) as emails,
  array_agg(unnested_sms_phones.sms_phones) as sms_phones
from restaurants
join unnested_emails on restaurants.id=unnested_emails.restaurant_id
join unnested_sms_phones on restaurants.id=unnested_sms_phones.restaurant_id

where restaurants.id = 10;

---

with
  emails_str as (
    select
      array_to_string(emails, ',') emails,
      restaurant_id
    from contacts
  ),
  sms_phones_str as (
    select
      array_to_string(sms_phones, ',') sms_phones,
      restaurant_id
    from contacts
  ),
  voice_phones_str as (
    select
      array_to_string(voice_phones, ',') voice_phones,
      restaurant_id
    from contacts
  ),
select
  array_agg(c.emails),
  string_to_array(string_agg(c.emails, ','), ',') emails,
  string_to_array(string_agg(c.sms_phones, ','), ',') sms_phones,
  string_to_array(string_agg(c.voice_phones, ','), ',') voice_phones
from restaurants r
join poop c on r.id = c.restaurant_id
where r.id = 10;
