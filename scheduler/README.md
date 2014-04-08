Scheduler
--------

Schedule general purpose jobs like notifications,
external api service calls, etc.

** Usage **

Register "actions" to be run when the scheduler is executed
periodically.
```
var scheduler = require('./scheduler')
schedule.register('restaurant:orderSubmitted', function() {
  db.getPendingNotifications( ... )
  twilio.call( ... )
});
```

In other processes, use the scheduler to schedule jobs
passing in the following data:

```
schedule.schedule('restaurant:orderSubmitted', data);
```

API
----

### register(action, callback)

* `action` - string
* `callback` - function handles given action


### schedule(action, data, [callback])

* `action` - string
* `data` - object
* `callback(error)` - optional callback function indicating
if scheduling was successful

### run()

Run all of the registered jobs.
