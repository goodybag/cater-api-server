var utils = require('utils');
var db = require('db');

var q = utils.async.queue(function (id, callback) {
  utils.stripe.accounts.update(id, {
    transfer_schedule: {
      interval: 'manual'
    }
  }, callback);
}, 5);


// assign a callback
q.drain = function() {
    console.log('all items have been processed');
}

db.restaurants.find({ stripe_id: { $notNull: true }}, function(err, restaurants) {
  if (err) {
    return console.error(err);
  }

  var ids = utils.pluck(restaurants, 'stripe_id');
  console.log('Queueing ' + restaurants.length + ' restaurants to manual transfers');
  q.push(ids, function(err, acct) {
    if (err) console.log('error processing', err);
    console.log('finished processing ', acct.business_name, acct.id);
  });
});
