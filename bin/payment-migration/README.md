# Migrating to Stripe

The tables that need to be migrated from Balanced to Stripe are:

* users
* restaurants
* payment_methods

In both systems, each entity has some metadata that identifies itself on the Stripe.
We will use this metadata to populate stripe_id on each of the tables.

Notice the meta info for Dos Batos on Balanced's dashboard:

![balanced dashboard](https://s3.amazonaws.com/uploads.hipchat.com/42627/356137/7gixeWekIHdHi2t/Screen%20Shot%202015-04-16%20at%203.08.30%20PM.png)

## Testing

Testing the migration will involve going into balanced and stripe and creating objects
with the appropriate metadata. This is a lengthy process, so you can ask Preston for more
details.

## Deployment

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

Here's a brief summary of what each script will do:

users
---

Each `users` row will be associated to a "customer" object on Stripe.

restaurants
---

Each `restaurants` will be associated to a "managed account" on Stripe. If no
previous transaction history exists on Balanced, we will create a new managed account.

payment_methods
---

Each `payment_method` will be associated to a "card" object on Stripe. All of the card
meta information will be updated in the payment_methods.data json column.

The card data format is slightly different from the balanced "payment method" format so
all of the templating related refactors are in #1517. The scripts should be right before
1517 is  deployed.
