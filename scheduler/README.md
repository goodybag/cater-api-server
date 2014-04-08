Scheduler
--------

Schedule general purpose jobs like notifications,
external api service calls, etc. Think of it as a
priority queue in which you specify priority based
on a flexible json store.

The typical use case will be:

1. Producer queues job
2. Scheduler polls for open jobs
3. Consumers works jobs from the queue

** Usage **

In other processes, use the scheduler to queue jobs
passing in data. Here's an example for phone notification
scheduled sometime in the future.

```
scheduler.queue('restaurant:orderSubmitted', {
  message: 'You have an order ready!'
, deliverAt: moment().addDay(1)
}, function(error) {
  if (error) console.log('Could not schedule phone call');
});
```

Then work on pending jobs in a cron task:
```
var scheduler = require('./scheduler')
scheduler.work('restaurant:orderSubmitted', function(jobs, callback) {

  // array of calling procedures
  var calls = jobs.map( function(job) { return makeCall(job); });

  // run procedures and callback
  async.parallel(calls, callback);
});

```

API
----

### queue(action, consume)

* `action` - string
* `consume(data, callback)` - consumer function which is passed all pending
jobs


### schedule(action, data, [callback])

* `action` - string
* `data` - object
* `callback(error)` - optional callback function indicating
if scheduling was successful
