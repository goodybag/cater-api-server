var proto = {
  profile: function( name ){
    if ( !this.timers[ name ] ){
      return this.timers[ name ] = new Date();
    }

    var result = new Date() - this.timers[ name ];
    delete this.timers[ name ];

    console.log( name + ': ' + result + 'ms' );
  }
};

module.exports = function(){
  var profiler = Object.create( proto );
  profiler.timers = {};
  return profiler;
};