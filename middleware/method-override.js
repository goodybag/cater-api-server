// method override functionality before express 4.x
module.exports = require('method-override')(function(req, res) {
  if ( req.body && typeof req.body === 'object' && '_method' in req.body ) {
    // look in urlencoded POST bodies and delete it
    var method = req.body._method;
    delete req.body._method;
    return method;
  }
});
