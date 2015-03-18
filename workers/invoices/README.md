# Invoice Workers

This is a two-parter: Creating/updating and sending

## Create and Update

This will create or update all of the necessary invoices for the current billing period (performing upserts on `user_id` and `billing_period`. It can be run with arbitrary frequency, but should be _at least_ once every billing period. I recommend running at least once daily to update existing invoices.

## Send

This worker is responsible for sending invoices from the previous billing period. It can be run with arbitrary frequency, but should be _at least_ once every billing period. I recommend running it once daily, but know that the process will terminate early if the current day is not the start of a billing period.