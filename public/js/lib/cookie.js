define(function (require, exports, module) {
  return module.exports = {
  	getItem: function (key) {
  		if (!key) { return null; }
  		var exp = [
  				'(?:(?:^|.*;)\\s*' 
  			, encodeURIComponent(key).replace(/[\-\.\+\*]/g, '\\$&') 
  			, '\\s*\\=\\s*([^;]*).*$)|^.*$'
  				].join('');

  		return decodeURIComponent(document.cookie.replace(new RegExp(exp), '$1')) || null;
    }

  , setItem: function (key, value) {
      if (!key || !value) { return false; }
      document.cookie = encodeURIComponent( key ) + "=" + encodeURIComponent( value ); 
      return true;
    }

  , removeItem: function (key) {
  		if (!this.hasItem(key)) { return false; }
  		document.cookie = encodeURIComponent(key) + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  		return true;
    }

  , hasItem: function (key) {
      if (!key) { return false; }
      var exp = [
      	"(?:^|;\\s*)"
      , encodeURIComponent(key).replace(/[\-\.\+\*]/g, "\\$&")
      , "\\s*\\="
      ].join('');
      return (new RegExp( exp )).test(document.cookie);
    }

  , keys: function () {
      var keys = document.cookie.replace(/((?:^|\s*;)[^\=]+)(?=;|$)|^\s*|\s*(?:\=[^;]*)?(?:\1|$)/g, "").split(/\s*(?:\=[^;]*)?;\s*/);
      for (var len = keys.length, i = 0; i < len; i++) { 
      	keys[i] = decodeURIComponent(keys[i]); 
      }
      return keys;
    }
  };
});
