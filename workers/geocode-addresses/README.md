# Geocode Addresses

> Attempts to geocodes restaurant locations and user addresses where `lat_lng` is null.

__Usage__

```
node workers/geocode-addresses
```

__Output__

Check `workers/geocode-addresses/log.json` for errors and results.

## A note on rate limiting

We only get 2500 requests per day for geocoding, so just be careful running this!