var Table = require('cli-table');

module.exports = Perf;

function Perf( runner ){
  var this_ = this;

  this.stats = {};

  runner.on( 'start', function(){
console.log('start');
  });

  runner.on( 'suite', function( suite ){
    this_.stats[ suite.title ] = {};
  });

  runner.on( 'test', function( test ){
    this_.stats[ test.parent.title ][ test.title ] = {};
    this_.stats[ test.parent.title ][ test.title ].expected = test.ctx.expected;
    test.start = new Date();
  });

  runner.on( 'test end', function( test ){
      this_.stats[ test.parent.title ][ test.title ].duration = new Date() - test.start;
  });

  runner.on( 'pass', function( test ){

  });

  runner.on( 'fail', function( test, error ){

  });

  runner.on( 'end', function(){
    try {
      Object.keys( this_.stats ).filter( function( suiteName ){
        return Object.keys( this_.stats[ suiteName ] ).length > 0;
      }).forEach( function( suiteName ){
        console.log( '#', suiteName );

        var table = this_.getTable();

        Object.keys( this_.stats[ suiteName ] ).forEach( function( testName ){
          var test = this_.stats[ suiteName ][ testName ];

          table.push([
            testName
          , (test.expected || 0) + 'ms'
          , test.duration + 'ms'
          , ((1 / (test.duration / (test.expected || 0))) * 100).toFixed(2) + '%'
          ]);
        });

        console.log( table.toString() );
      });
    } catch ( e ){
      console.log(e);
    }
  });

  runner.on( 'pending', function(){

  });
}

Perf.prototype.getTable = function(){
  var termW = process.stdout.columns - 4;

  return new Table({
    head: ['Test', 'Expected', 'Actual', 'Diff']
  , colWidths: [
      parseInt( termW * 0.5 )
    , parseInt( termW * 0.5 * 0.3333333 )
    , parseInt( termW * 0.5 * 0.3333333 )
    , parseInt( termW * 0.5 * 0.3333333 )
    ]
  });
};