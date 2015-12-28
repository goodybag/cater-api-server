var errors = require('../errors');
var utils  = require('../utils');
var config = require('../config');

var staticRender = function(view, req, res) {
  res.render(view, { config: config } ,function(err, html) {
    if (err) return res.error(errors.internal.UNKNOWN, err)
    res.send(html);
  });
}

module.exports.contactUs = utils.partial(staticRender, 'contact-us');

module.exports.requestDemo = utils.partial(staticRender, 'request-demo');

module.exports.legal = utils.partial(staticRender, 'legal');

module.exports.privacy = utils.partial(staticRender, 'privacy');

module.exports.createUser = utils.partial(staticRender, 'create-user');

module.exports.styleGuide = utils.partial(staticRender, 'docs/style-guide');
