module.exports = function(req, res, next){
  if (!req.header('Content-Type') || req.header('Content-Type') == 'text/html'|| req.header('Content-Type') == 'text/plain'){
    req.headers['Content-Type'] = 'application/json';
    if (typeof req.body == 'string') req.body = JSON.parse(req.body);
  }
  res.header('Content-Type', 'application/json');
  next();
}