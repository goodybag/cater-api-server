var errors = require('../errors');
var utils  = require('../utils');

var staticRender = function(view, req, res) {
  res.render(view, function(err, html) {
    if (err) return res.error(errors.internal.UNKNOWN, err)
    res.send(html);
  });
}

module.exports.contactUs = utils.partial(staticRender, 'contact-us');

module.exports.aboutUs = utils.partial(staticRender, 'about-us');

module.exports.legal = utils.partial(staticRender, 'legal');

module.exports.privacy = utils.partial(staticRender, 'privacy');
