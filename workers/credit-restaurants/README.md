Credit Restaurants Worker
---

This script will periodically check for restaurants with a credit balance
and make special transfers as needed.

### Context

In some special cases, an order may have user adjustments that allow for
restaurants to receive more than the "total amount" can provide.

Let's take a look at an example

1. An order totals $100.00, so the user is charged this amount.
2. The user uses a promo code for a free meal. The user adjustment is
   effectively -$100.00
3. The restaurant, however, should be paid out the full amount less the GB Fee
   = `$100.00 - (12.5% * $100.00)`

Because Stripe charges the user $0.00, the restaurant will receive $0.00.

Here we must make a special transfer to properly compensate the restaurant. This
compensation will be calculated _without_ user adjustments.
