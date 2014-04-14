var setup = require('./setup');

module.exports.events = setup({app: 'cater', component: 'events'});
module.exports.routes = setup({app: 'cater', component: 'routes'});
module.exports.models = setup({app: 'cater', component: 'models'});
module.exports.debit = setup({app: 'cater', component: 'debit'});
module.exports.db = setup({app: 'cater', component: 'db'});
module.exports.reminder = setup({app: 'cater', component: 'reminder'});
module.exports.paymentSummaryPhantom = setup({app: 'cater', component: 'paymentSummaryPhantom'});
module.exports.points = setup({app: 'cater', component: 'points'});
module.exports.welcomeEmail = setup({app: 'cater', component: 'welcomeEmail'});
module.exports.scheduler = setup({app: 'cater', component: 'scheduler'});
module.exports.receipt = setup({app: 'cater', component: 'receipt'});

var expressLogger = setup({app: 'cater', component: 'express'});

module.exports.expressError = function (err, req, res, next) {
  if (err) expressLogger.error(err);
  return next(err);
};
