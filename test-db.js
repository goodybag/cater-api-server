var utils = require('./utils')
var db = require('./db');
var Models = require('./models');

var run =  function(){
  console.log('run');

  utils.async.parallel([
    Models.Order.find.bind( Models.order, { where: {} } )
  , Models.Order.find.bind( Models.order, { where: {} } )
  , Models.Order.find.bind( Models.order, { where: {} } )
  , Models.Order.find.bind( Models.order, { where: {} } )
  , Models.Order.find.bind( Models.order, { where: {} } )
  ], function( e ){
    console.log('complete', e);
    setTimeout( run, 6000 )
  });
};


run();