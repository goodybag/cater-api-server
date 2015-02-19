# Datetime

__Usage:__

```javascript
var datetimeStamp = require('stamps/datetime');

// Create a stamp using all datetime protos
var datetime = datetimeStamp.create();

// Create a custom stamp
datetime = require('stampit')()
  .compose( require('stamps/datetime/base') )
  .compose( require('stamps/datetime/business-hours') );

// Usage
datetime = datetimeStamp.create({
  datetime: '2015-02-12 3:00 PM'
, timezone: 'America/Chicago'
, businessHours: { start: 8, end: 17 }
});
datetime.isWeekday();     // true
datetime.isAfterHours();  // false
```

## Stamps

### Base

> stamps/datetime/base.js

#### Properties

##### .datetime

The date string or moment object

##### .timezone

String timezone such as `America/Chicago` or `America/New York`. By default, no
timezone is set.

##### .businessHours

Object containing `start` and `end` hours

```javascript
{ start: 8, end: 17 } // 8am - 5pm
```

All `businessHours` should represent time relative to the system timezone.

### Business Hours

> stamps/datetime/business-hours.js

Provides logic for formatting datetimes during business hours and after
hours.

#### Methods

##### .getWorkingHour( toTimezone )

Used to determine appropriate times for notifications. If datetime is
after hours, use the earliest datetime from the following day. Otherwise,
for hours during business hours return time.

* toTimezone - timezone string like 'America/Chicago'

This ensures dates from any timezone can be converted and checked against
business hours.

##### .isWeekend()

Returns boolean if datetime is on Saturday or Sunday.

##### .isWeekday()

Returns boolean if datetime falls on a business week day.

##### .isAfterHours()

Returns boolean if `.datetime` is outside of `.businessHours`.

##### .duringBusinessHours()

Returns boolean if `.datetime` is within `.businessHours`.

##### .isWithin()

Used to determine if the datetime is within some time from now.

`.isWithin` accepts the same parameters as [moment.add](http://momentjs.com/docs/#/manipulating/add/)

>.isWithin(Number, String)

>.isWithin(Duration)

>.isWithin(Object)

```javascript
datetime({ datetime: '2015-04-13 12:00 PM' }).isWithin(4, 'hours');
```
