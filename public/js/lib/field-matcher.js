/**
 * Component.FieldMatcher
 *
 * Ensures two input values are equivalent on form submit
 *
 * Returns an interface to control the navbar:
 *   Methods: init|validate|getVal
 *
 * Options:
 *   `fields`   - Array of input names
 *   `onError`  - Called when fields do not match
 */

define(function(require){
  'use strict';

  var $ = require('jquery') || jQuery;

  $.fn.fieldMatcher = function( options ){
    var $window = $(window);
    var $this = this;

    var defaults = {
      fields: []
    , onError: function( matcher, $this ){}
    };

    options = $.extend( {}, defaults, options );

    var matcher = {
      init: function(){
        $this.submit( function( e ){
          if ( !matcher.validate() ){
            e.preventDefault();
            options.onError( matcher, $this );
          }
        });

        return matcher;
      }

    , getVal: function( field ){
        return $this.find( [ '[name=', field, ']' ].join('"') ).val();
      }

    , validate: function(){
        var result = true;

        for ( var i = 1, l = options.fields.length; i < l; ++i ){
          result = matcher.getVal( options.fields[i - 1] ) == matcher.getVal( options.fields[i] );
          if ( !result ) return result;
        }

        return result;
      }
    };

    return matcher.init();
  };
});