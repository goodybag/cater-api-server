Restaurant Filters
===

All you need to do is export a function that accepts `req.params.q` and returns an object representing a filter.

The downstream templates can then use the `res.locals.filter['your-filter-name']`.

See other filters in this directory for examples. Note how the query param
state affects the query string for filter options.

For example, viewing `localhost:3000/admin/restaurants?region=houston` produces filtering links

```
<a href="?">Houston</a>
<a href="?region=houston&region=seattle">Seattle</a>
<a href="?region=houston&region=austin">Austin</a>
```
