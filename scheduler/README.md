Scheduler
--------

Schedule general purpose jobs like notifications,
external api service calls, etc. Think of it as a
queue prioritized by timestamp.

The typical use case will be:

1. Producer queues job
2. Scheduler polls for pending jobs
3. Consumers works jobs from the queue

### Jobs

Jobs are just objects scheduled with `queue()` and processed by `work()`. Each
job contains:
* datetime
* data
* status - pending, in-progress, completed, or failed

API
----

### queue(action, datetime, data, [callback])

Scheduled a new job containing the timestamp to run and JSON data.

* `datetime` - timestamp with timezone
* `data` - object
* `callback(error, job)` - optional callback function indicating
if scheduling was successful


### work(action, consume, [callback])

This function will retrieve all pending jobs of a particular _action_.
The consume function will iterate on each job, and is passed a next function
which passes control to the next job.

* `action` - string
* `consume(job, next)` - iterator function for each job found per action
  * next(null) will mark current job status `completed`
  * next(error) will mark curret job status `failed`
* `callback` - optional callback function

Example
--------

In this example, we will schedule an email for some later date. First, let's
require the scheduler.

```javascript
var scheduler = require('./scheduler');
```

Now, let's use the scheduler to queue a new job for tomorrow.

```javascript
scheduler.queue('send-email', moment().addDay(1), {
  to: 'john.doe@gmail.com'
, from: 'preston@goodybag.com'
, body: 'Reminder you have an order coming up!'
});
```

Let's invoke the scheduler to work on jobs per the 'send-email' action. We can
set up the following code as a cron script.

Note that `sendMail` is called on every pending job. The `next` function
will continue onto the next job until all other pending jobs have
been completed. Passing an error to next will mark that job status
'failed'. This makes it easy to hook into external services and
simply pass next as the callback.

```javascript
// send-email-worker.js
// cron running every minute
sendMail = function(job, next) {
  mailer.send(job.data, next);
}

scheduler.work('send-email', sendMail, function(error, results) {
  if (error) return console.log('One or more jobs failed');
  console.log('Completed ' + results.length + ' email jobs')
});
```
