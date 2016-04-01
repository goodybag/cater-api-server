module.exports = function(_sort, other){
  return function(req, res, next){
    var direction = "desc", sort = req.param('sort') || _sort;

    if (sort[0] == '+')
      direction = "asc";

    req.queryOptions.order = req.queryOptions.order || [];
    req.queryOptions.order.push( sort.substring(1) + " " + direction + (other ? ' ' + other : '') );

    next();
  }
};