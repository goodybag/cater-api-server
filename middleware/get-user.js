var models = require('../models');

module.exports = function(req, res, next) {
  if(!req.session || !req.session.user || req.session.user.id == null) return next();

  models.User.findOne({where: {id: req.session.user_id}}, function (error, user) {
    if (error || !user) return next(error);

    req.user = user;

    res.locals.user = user.toJSON();
    delete res.locals.user.password;

    next();
  });
};
