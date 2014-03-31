var models = require('./models');

models.Restaurant.findOne({}, function(err, order) {
  console.log(arguments);
});
