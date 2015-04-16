# Migrating to Stripe

The tables that need to be migrated from Balanced to Stripe are:

* users
* restaurants
* payment_methods

In both systems, each entity has some metadata that identifies itself on the Stripe.
We will use this metadata to populate stripe_id on each of the tables.

Note the meta info for Dos Batos on Balanced's dashboard:

![balanced dashboard](https://s3.amazonaws.com/uploads.hipchat.com/42627/356137/7gixeWekIHdHi2t/Screen%20Shot%202015-04-16%20at%203.08.30%20PM.png)

## Testing

To test, I would recommend to carefully mimic the production environment and run each of the scripts locally.


Get the latest backup of production. Note that this sanitizes all customer info except balanced ids.

```
./bin/prod-to-local
```

### Set up testing configuration

1. Copy the production config for balanced into `balanced-config.json`.
2. Swap the secret & key for config/stripe.js

We have to do this for testing because stripe and balanced do not have metadata for the dev marketplaces.

The scripts will only affect our local database.

From now on, be **very careful** not to run any debiting scripts as that may double charge customers!


Next, run the scripts

```
node ./bin/payment-migration/users
node ./bin/payment-migration/restaurants
node ./bin/payment-migration/payment-methods
```

Migrating data will take a few minutes. After testing restore the environment configurations:

1. Restore balanced-config via `cp balanced-config.json.sample balanced-config.json`. Note: This file is not checked into git so we must restore manually.
2. Restore stripe configuration via `git checkout config/stripe`

### Actual Deploy

Run the scripts in a bash session on production.

```
heroku run bash -a goodybag-production-cater
~ $
```

Then run each script

```
node ./bin/payment-migration/users
node ./bin/payment-migration/restaurants
node ./bin/payment-migration/payment-methods
```

These can be run at anytime, but **must be run once before deploying the stripe related
changes** (Branch #1517) i.e. new user sign-ups and restaurant creation will access the
Stripe api instead of Balanced.
