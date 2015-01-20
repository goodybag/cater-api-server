module.exports = Base;

var def = function( obj, key, member ){
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

Base.prototype.method = function( key, fn ){
  this.methods[ key ] = fn;
  def( this, key, fn );
  return this;
};