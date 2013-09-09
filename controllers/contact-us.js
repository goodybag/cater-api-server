var config = require('../config')
  , utils  = require('../utils');

module.exports.sendSupportEmail = function(req, res, next) {
  if (req.body.name && req.body.email && req.body.message) {
    utils.sendMail({
      to: config.emails.support
    , from: req.body.email
    , subject: 'Feedback from ' + req.body.name
    , text: req.body.message
    }, function(err, data) {
        res.json(err ? 400 : 200, err || null);
    });
  } else {
    res.json(400, 'Missing request name, email or message');
  }
};