if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define(function(require){
  var utils = require('utils');

  var normalizeUrlArg = function( def ){
    if ( ~[ 'string', 'number' ].indexOf( typeof def ) ){
      def = { url: def };
    }

    if ( def.url ) def.url += '';

    return def;
  };

  var baseFns = {
    getUrl: function(){
      return this.url;
    }

  , request: function( options, callback ){
      callback = callback || utils.noop;

      options = utils.defaults( options || {}, {
        headers:  { 'Conetnt-Type': 'application/json' }
      , json:     true
      , url:      this.url
      });

      options.type = options.method;

      if ( options.body ){
        options.body = JSON.stringify( options.body );
      }

      return utils.http( options )
        .error( callback )
        .then( function( data ){ callback( null, data ) } );
    }

  , get: utils.overload({
      'String,Object,Function?':
      function( urlAddon, data, callback ){
        return this.request({
          method: 'GET'
        , url:    [ this.url, urlAddon ].join('/') + utils.queryParams( data )
        }, callback );
      }
    , 'Object,Function?':
      function( data, callback ){
        return this.request({
          method: 'GET'
        , url:    this.url + utils.queryParams( data )
        }, callback );
      }
    , 'String,Function?':
      function( urlAddon, callback ){
        return this.request({
          method: 'GET'
        , url:    [ this.url, urlAddon ].join('/')
        }, callback );
      }
    , 'Number,Function?':
      function( urlAddon, callback ){
        return this.get( urlAddon + '', callback )
      }
    , 'Number,Object,Function?':
      function( urlAddon, data, callback ){
        return this.request({
          method: 'GET'
        , url:    [ this.url, urlAddon ].join('/') + utils.queryParams( data )
        }, callback );
      }
    , 'Function?':
      function( callback ){
        return this.request( { method: 'GET' }, callback );
      }
    })

  , post: utils.overload({
      'Object,Function?':
      function( data, callback ){
        return this.request({
          method: 'POST'
        , data:   data
        }, callback );
      }
    , 'Function?':
      function( data, callback ){
        return this.request( { method: 'POST'}, callback );
      }
    })

  , put: utils.overload({
      'Object,Function?':
      function( data, callback ){
        return this.request({
          method: 'PUT'
        , data:   data
        }, callback );
      }
    , 'Function?':
      function( data, callback ){
        return this.request( { method: 'PUT'}, callback );
      }
    })

  , patch: utils.overload({
      'Object,Function?':
      function( data, callback ){
        return this.request({
          method: 'PATCH'
        , data:   data
        }, callback );
      }
    , 'Function?':
      function( data, callback ){
        return this.request( { method: 'PATCH'}, callback );
      }
    })

  , del: utils.overload({
      'String,Function?':
      function( urlAddon, callback ){
        return this.request({
          method: 'DELETE'
        , url:    [ this.url, urlAddon ].join('/')
        }, callback );
      }
    , 'Number,Function?':
      function( urlAddon, callback ){
        return this.del( urlAddon + '', callback )
      }
    , 'Function?':
      function( callback ){
        return this.request( { method: 'DELETE' }, callback );
      }
    })
  };

  var resource = function( def, childrenDefs ){
    def = normalizeUrlArg( def || {} );

    var item = function( child, childChildrenDefs ){
      child = normalizeUrlArg( child || {} );

      if ( def.url ){
        child.url = def.url + ( child.url ? '/' + child.url : '' );
      }

      var _resource = resource( child, childChildrenDefs );

      if ( childrenDefs ){
        for ( var key in childrenDefs ){
          childrenDefs[ key ] = normalizeUrlArg( childrenDefs[ key ] || {} );
          _resource[ key ] = resource( utils.extend( {}, childrenDefs[ key ], {
            url: ( child.url ? child.url + '/' : '' ) + ( childrenDefs[ key ].url || '')
          }));
        }
      }

      return _resource;
    };

    var proto = utils.extend({}, baseFns, def );

    for ( var key in proto ){
      if ( typeof proto[ key ] === 'function' ){
        item[ key ] = proto[ key ].bind( proto );
      } else {
        item[ key ] = proto[ key ];
      }
    }

    return item;
  };

  return resource;

  // return resource = function( def, childDefs ){
  //   if ( typeof def === 'string' ){
  //     def = { url: def };
  //   }

  //   if ( typeof !def.url !== 'string' ){
  //     throw new Error('Invalid property `url`');
  //   }

  //   var url = def.url;

  //   var children = {};

  //   for ( var key in ( childDefs || {} ) ){
  //     children[ key ] = resource( utils.extend( childDefs[ key ], {
  //       url: [ def.url, childDefs[ key ].url ].join('/')
  //     }));
  //   }

  //   return Object.create(
  //     utils.defaults( def, {
  //       get baseUrl() {
  //         return [ config.apiBaseUrl, this.url ].join('/');
  //       }

  //     , children: children

  //     , extend: function( def, childDefs ){
  //         if ( typeof def === 'string' ){
  //           def = { url: def };
  //         }

  //         if ( typeof !def.url !== 'string' ){
  //           throw new Error('Invalid property `url`');
  //         }

  //         return resource( utils.extend( {}, this, def ), childDefs );
  //       }

  //     , item: function( id, data, callback ){
  //         return this.get( id + '', data, callback );
  //       }

  //     , list: function( data, callback ){
  //         return this.get( data, callback );
  //       }

  //     , get: function(){
  //         return utils.overload({
  //           'String,Object,Function':
  //           function( urlAddon, data, callback ){
  //             return this.request({
  //               method: 'GET'
  //             , url:    [ this.baseurl, urlAddon ].join('/') + utils.queryParams( data )
  //             }, callback );
  //           }
  //         , 'Object,Function':
  //           function( data, callback ){
  //             return this.request({
  //               method: 'GET'
  //             , url:    this.baseUrl + utils.queryParams( data )
  //             }, callback );
  //           }
  //         , 'String,Function':
  //           function( urlAddon, callback ){
  //             return this.request({
  //               method: 'GET'
  //             , url:    [ this.baseUrl, urlAddon ].join('/')
  //             }, callback );
  //           }
  //         , 'Function':
  //           function( callback ){
  //             return this.request( { method: 'GET' }, callback );
  //           }
  //         }, this ).apply( this, arguments );
  //       }

  //     , post: function(){

  //       }

  //     , request: function( options, callback ){
  //         return utils.http( utils.defaults( options, {
  //           url: [ config.apiBaseUrl, url,  ]
  //         })).error( callback ).then( function(){
  //           return callback.apply( this, [ null ].concat(
  //             Array.prototype.slice( arguments )
  //           ));
  //         });
  //       }
  //     });
  //   );
  // };
});