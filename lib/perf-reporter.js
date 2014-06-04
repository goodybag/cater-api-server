module.exports = Perf;

function Perf( runner ){
  var this_ = this;

  runner.on( 'start', function(){

  });

  runner.on( 'suite', function( suite ){

  });

  runner.on( 'test start', function( test ){
    this_.testStart = new Date();
  });

  runner.on( 'test end', function( test ){
    this_.testEnd = new Date();
  });

  runner.on( 'pass', function( test ){

  });

  runner.on( 'fail', function( test, error ){

  });

  runner.on( 'end', function(){

  });

  runner.on( 'pending', function(){

  });
}