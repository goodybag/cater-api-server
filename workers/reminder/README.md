# Reminder System

Periodically runs all modules in the ```./reminders``` directory to send out notifications and reminders.

## Adding a New Reminder

Create a new module in the ```./reminders``` directory with the following scaffolding:

```javascript
/**
 * My Reminder
 *
 * Description:
 *   Checks for pending something or another and
 *   sends a reminder to the concerning party
 */

module.exports.name = 'My Reminder';

module.exports.check = function( callback ){
  callback( null, false );
};

module.exports.work = function( callback ){
  var stats = {
    myStat: { text: 'My Statistic', value: 0 }
  };

  stats.myStat.value++;

  callback( null, stats );
};
```

Each reminder module must implement a ```name``` property and ```check``` and ```work``` functions. The ```check``` function decides whether or not the reminder should be sent. The ```work``` function actually does the work of sending the reminder.

### check( callback )

An asynchronous truth test to decide whether or not to send a reminder.

__Arguments:__

* callback( error, passesCheck )

The second argument to callback should be a boolean denoting whether or not to run the work function.

### work( callback )

Send the reminder to the concerning parties

__Arguments:__

* callback( error, stats )

The second argument to callback should be a statistics object containing any information you'd like to see in the logs.
