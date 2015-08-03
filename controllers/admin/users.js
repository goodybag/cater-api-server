var putils = require('../../public/js/lib/utils');
var Models = require('../../models');

var User = Models.User;

module.exports.handleError = function(err, req, res, next) {
  res.error(err);
};

module.exports.create = function(req, res, next) {
  var data = parseBody(req.body);

  new User(data).create(function(err, user) {
    if (err) {
      return next(err);
    }

    res.json(user);
  });
};

function parseBody(body) {
  return {
    name: body.name,
    email: body.email,
    password: body.password,
    organization: body.organization,
    region_id: body.region_id || 1,
    groups: body.groups || [],
    is_tax_exempt: body.is_tax_exempt || false,
    is_invoiced: body.is_invoiced || false
  };
}
