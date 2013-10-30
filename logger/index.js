var setup = require('./setup');

module.exports.events = setup({app: 'cater', component: 'events'});
module.exports.routes = setup({app: 'cater', component: 'routes'});
module.exports.models = setup({app: 'cater', component: 'models'});
module.exports.db = setup({app: 'cater', component: 'db'});

var expressLogger = setup({app: 'cater', component: 'express'});

module.exports.expressError = function (err, req, res, next) {
  if (err) expressLogger.error(err);
  return next(err);
};