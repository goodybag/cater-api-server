var setup = require('./setup');

module.exports.routes = setup({app: 'cater', component: 'routes'});
module.exports.models = setup({app: 'cater', component: 'models'});
module.exports.debit = setup({app: 'cater', component: 'debit'});
module.exports.db = setup({app: 'cater', component: 'db'});

var expressLogger = setup({app: 'cater', component: 'express'});

module.exports.expressError = function (err, req, res, next) {
  if (err) expressLogger.error(err);
  return next(err);
};