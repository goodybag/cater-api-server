Orders Query Building Stamp
---

> stamps/db/orders

This stamp facilitates building mongo-sql queries easily.

There are a number of option facets by which you can configure a query:


```javascript
// Create a query builder for orders
var sql = orders({
, month: 2
, year: 2015
, user: true
}).get();

// Find orders in February 2015 and join users
db.orders.find(sql.$query, sql.$options, callback);
```

Options

* status: string
* month: number
* year: number
* week: number
* submittedDate: boolean to attach submitted datetime
* restaurant: boolean to attach restaurant info (default true)
* user: boolean to attach user info (default true)
* rename: string to rename results on res.locals (default res.locals.orders)
* groupByMonth: boolean to group orders by month
* indexBy: string for re-indexing results by property
