var models = require('../models');

module.exports = function(req, res, next) {
  if(!req.session || !req.session.user || req.session.user.id == null) return next();

  var query = {
    where: { id: req.session.user.id }
  , embeds: ['groups']
  }

  models.User.findOne(query, function (error, user) {
    if (error) return next(error);

    req.user = user;

    res.locals.user = user.toJSON();
    delete res.locals.user.password;

    next();
  });
}