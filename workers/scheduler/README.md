Scheduler
=========

The scheduler is an abstraction for declaring action workflows.
You can then queue and process jobs against these actions.

Note that the scheduler module is a singleton, so be mindful to
declare actions before attempting to work on them.

Usage
=====

Declare scheduled actions.

```javascript
var scheduler = require('../lib/scheduler');
scheduler.registerAction('make-call', function(job, done) {
  twilio.makeCall(job.data, function(error) {
    if (error) {
      logger.error('Could not place call for job #' + job.id, error);
      done('failed');
    } else {
      logger.info('Made call successfully', job);
      done('completed');
    }
  });
});
```

Queue jobs by specifying target date, job data. A callback
can be specified to ensure the queue was placed successfully.

```javascript
scheduler.enqueue('make-call', moment().addDay(1), {
  to: '7135178077'
, from: '2813308004'
, message: 'Hello world'
}, function(err, job) {
  if (err) console.log('could not make call', err);
});
```

Then in the worker script, embed a cron style runner

```javascript
var cron = require('crontab');
var scheduler = require('../lib/scheduler');

cron.add('0 * * * * *', function() {
  // Run all tasks
  scheduler.runAll();

  // or individual tasks
  scheduler.run('make-call');
});
```

API
===

.registerAction(action, fn)
--------------------------

Register a new action workflow. The work function has the signature `fn(job, done)`.
Once the job is complete, run the `done` function with either 'failed' or
'complete'.

.enqueue(action, datetime, data, [callback])
-------------------------------------------

Places a new job on the queue. An optional `callback(error, job)` can be
specified.

.run(action)
-----------

Runs all pending jobs of this particular action.

.runAll()
--------

Runs all pending jobs.

Job object
==========

Each job describes some data and when to run. Using `.enqueue()` builds
a new job, whereas `.registerAction()` lets you consume the job data.

Jobs contain:

 * id
 * datetime
 * data
 * status (pending|in-progress|completed|failed)

Future plans
============

* Monitor jobs page
