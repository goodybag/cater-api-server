var config = require('../config');

module.exports =  function(req,res,next) {
  // this is how you check it on heroku, because https terminates before it reaches our app
  (req.headers['x-forwarded-proto']!='https') ? res.redirect(config.baseUrl+req.url) : next();
};