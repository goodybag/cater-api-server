var util = require('util');
var models = require('./models');
models.User.find({
  where: { id: 2 }
, embeds: [
    'payment_methods'
  , {
      table: 'addresses'
    , options: {
        order: ['is_default asc', 'id asc']
      }
    }
  ]
}, function( error, results ){
  console.log( error, results[0].attributes )
});