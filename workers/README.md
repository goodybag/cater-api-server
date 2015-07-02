Workers
---

The workers are processes separate from the main web worker that handles
http requests for Goodybag.com. Ideally, computationally heavy or I/O intensive
work should be separated from the web worker.

Some of the existing workers handle offline tasks such as processing credit card payments, awarding reward points, calculating popularity scores, and running
reminder notifications.

In addition, we can use the scheduler module to schedule tasks in the future.

### Creating a new worker

Create a new folder within `/workers` for your worker. Keeping the worker
scripts isolated makes it easier to set up on npm. Not all workers will be
publishable, but it helps to spin things off when designed this way from the
beginning.

To run them on production, go to Heroku and set up a [scheduled cron
 job](https://scheduler.heroku.com/dashboard).

 The `grunt namedModules` task handles aliasing
 some of our commonly used modules like require('utils'). Read more here
 (todo: link to namedModules doc)

![Heroku Scheduler](https://s3.amazonaws.com/uploads.hipchat.com/42627/356137/QLkEXrrQJGCPupN/Screen%20Shot%202015-07-02%20at%2011.30.01%20AM.png)

Note that the *Heroku scheduler* handles cron jobs for our workers. The
[Goodybag scheduler](scheduler/README.md) is a separate module that coordinates
jobs to run on a dyno separate from the web dyno as well as scheduling jobs in
advance.
