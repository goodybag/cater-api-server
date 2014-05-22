/**
 * Tree Editor
 */

if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define(function(require, exports, module) {
  var Hbs       = require('handlebars');
  var utils     = require('utils');
  var config    = require('config');
  var spinner   = require('spinner');

  return module.exports = utils.View.extend({
    events: {
      'change .node-col-x select': 'onXSelectChange'
    }

  , template: Hbs.partials['2d_matrix_editor']

  , initialize: function( options ){
      utils.enforceRequired( options, [
        'set'
      ]);

      utils.defaults( options, {
        size:    20
      , xTitle:  'X'
      , yTitle:  'Y'
      });

      this.set = options.set;

      this.x = utils.chain( options.set ).pluck('x').unique().value();
      this.y = utils.chain( options.set ).pluck('y').unique().value();

      return this;
    }

  , render: function(){
      this.$el.html( this.template({
        x:      this.x
      , y:      this.y
      , set:    this.set
      , xTitle: this.options.xTitle
      , yTitle: this.options.yTitle
      , size:   this.options.size
      }));

      return this
    }

  , highlightConnections: function( value ){
      console.log('highlightConnections', value);

      var filtered = utils.filter( this.set, function( item ){
        return item.x == value;
      });
console.log(filtered);
      var $y = this.$el.find('.node-col-y');

      $y.find('option[selected="selected"]').attr( 'selected', null );
      $y.find(
        utils.map( filtered, function( item ){
          return '[value="' + item.y + '"]';
        }).join(', ')
      ).attr( 'selected', 'selected' );

      return this;
    }

  , onXSelectChange: function( e ){
    console.log('onXSelectChange',e.target.value);
      this.highlightConnections( e.target.value );
    }
  });
});