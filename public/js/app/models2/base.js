module.exports = Base;

var def = function( obj, key, member ){
  typeof member !== 'function' || (function(){
    var _member = member;
    member = function(){ return _member; };
  })();

  console.log( key, member );

  Object.defineProperty( obj, key, {
    enumerable: false
  , get: member
  });
};

function Base( data ){
  utils.extend( this, data );

  def( this, 'methods', {} );

  return this;
}

Base.create = function( data ){
  return new Base( data );
};

Base.prototype.method = function( key, fn ){
  this.methods[ key ] = fn;
  def( this, key, fn.bind( this ) );
  return this;
};