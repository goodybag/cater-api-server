# User Invoices

__Usage__

```javascript
var invoices = require('stamps/user-invoice');
var invoice = invoices.create({
  user_id: 1
, billing_period_start: '2015-01-01'
, billing_period_end: '2015-01-15'
});

// Get orders from the billing period and populate model
// and persist to user_invoice_orders
invoice.populateOrdersBasedOnDate( function( error ){
  /* ... */

  invoice.save( funcion( error ){
    /* ... */
  });
});
```

### Auto Populate

#### `.populateOrdersBasedOnDate( error )`

Get orders from the billing period and populate model and persist to user_invoice_orders.

### DB

#### `.save( error )`

Save current model state