-- Update version
insert into deltas (version, date) values ('1.0.19', 'now()');

-- Replace contact info with array columns
DO $$
  BEGIN
    ALTER TABLE restaurants
      ADD sms_phones    varchar(10)[] default '{}' not null,
      ADD voice_phones  varchar(10)[] default '{}' not null,
      ADD emails        text[]        default '{}' not null;

    UPDATE restaurants
      SET sms_phones[1]   = sms_phone,
          voice_phones[1] = voice_phone,
          emails[1]       = email;

    ALTER TABLE restaurants
      DROP IF EXISTS sms_phone,
      DROP IF EXISTS voice_phone,
      DROP IF EXISTS email;
  END;
$$;