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


API
----

### queue(action, data, [callback])

* `action` - string
* `data` - object
* `callback(error)` - optional callback function indicating
if scheduling was successful


### work(action, consume, [callback])

* `action` - string
* `consume(error, data, next)` - iterator function for each job found per action
* `callback` - optional callback function once all jobs are completed

Example
--------

In this example, we will
schedule an email to get delivered at a certain date. First, let's require
the scheduler.

```javascript
var scheduler = require('./scheduler');
```

Now, let's use the scheduler to queue some data.

```javascript
scheduler.queue('send-email', {
  to: 'john.doe@gmail.com'
, from: 'preston@goodybag.com'
, body: 'Reminder you have an order coming up!'
, deliverAt: moment().addDay(1)
});
```

Let's invoke the scheduler to work on an action. The second parameter of `work`
is called upon every pending job. The next function will continue onto the next
job until all other pending jobs have been completed. Passing an error to next
will mark that job status 'failed'.

```javascript
// worker.js run as cron job
sendMail = function(error, message, next) {
  if (message.deliverAt <= now) {
    return mailer.send(message, next);
  } else {
    next('Invalid job!');
  }
}

scheduler.work('email', sendMail, function(error) {
  if (error) return console.log(error);
  console.log('Completed ' + results.length + ' email jobs')
});
```
