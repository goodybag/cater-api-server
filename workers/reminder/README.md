# Reminder System

Periodically runs all modules in the ```./reminders``` directory to send out notifications and reminders.

## Adding a New Reminder

Create a new module in the ```./reminders``` directory with the following command:

```
grunt generate.reminder:my-reminder-name
```

Each reminder module must implement a ```name``` property and ```check``` and ```work``` functions. The ```check``` function decides whether or not the reminder should be sent. The ```work``` function actually does the work of sending the reminder.

### check( storage, callback )

An asynchronous truth test to decide whether or not to send a reminder.

__Arguments:__

* storage - persistent JSON between calls to the module
* callback( error, passesCheck )

The second argument to callback should be a boolean denoting whether or not to run the work function.

### work( storage, callback )

Send the reminder to the concerning parties

__Arguments:__

* storage - persistent JSON between calls to the module
* callback( error, stats )

The second argument to callback should be a statistics object containing any information you'd like to see in the logs. Use the format seen in the examples and the other workers and the output will look this:

![http://storage.j0.hn/Screen%20Shot%202013-12-31%20at%2010.12.42%20AM.png](http://storage.j0.hn/Screen%20Shot%202013-12-31%20at%2010.12.42%20AM.png)

### The `storage` parameter

It's useful to persist data between calls to the reminder module. To make it easier to implement new reminders, you can use the `storage` parameter to store data between calls. So, instead of making a new table for each type of reminder and putting records of when you last sent someone a notification, you can just store all of your data on the storage object.

#### Storage Schema

Since it's a flexible store, you would need to setup the structure of your object before checking for variables. To facilitate that process, you can specify an object schema on the reminder module that will automatically setup the object skeleton for your storage object.

For example:

```javascript
module.exports.schema = {
  restaurantOrders: {
    lastNotified: true
  }
, userOrders: {
    lastNotified: true
  }
};
```

Will produce the following object:

```javascript
{
  restaurantOrders: {
    lastNotified: {}
  }
, userOrders: {
    lastNotified: {}
  }
}
```

Then in your ```check``` or ```work``` functions, you can be sure that the property ```storage.restaurantOrders.lastNotified``` actually exists. Any new properties added to the schema will get added before the reminder module is run.
