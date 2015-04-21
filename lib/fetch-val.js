var utils = require('../utils');

module.exports = function( options ){
  options = utils.defaults( options || {}, {
    period:       1000 * 60
  , initialValue: []
  });

  if ( typeof options.fetch !== 'function' ){
    throw new Error('Must provide `fetch` function');
  }

  return Object.create({
    options: options

  , value: options.initialValue
  , error: null

  , onTick: function(){
      this.options.fetch( function( error, result ){
        if ( error ){
          this.error = error;
          return;
        }

        this.error = null;
        this.value = result;
      }.bind( this ));
    }

  , start: function(){
      if ( this.fetchInteval ) return this;

      this.fetchInteval = setInterval(
        this.onTick.bind( this )
      , this.options.period
      );

      this.onTick();

      return this;
    }

  , stop: function(){
      if ( !this.fetchInteval ) return this;

      clearInterval( this.fetchInteval );
      delete this.fetchInteval;

      return this;
    }

  , valueOf: function(){
      return this.value;
    }
  }).start();
};