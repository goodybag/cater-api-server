/**
 * Status Dropdown
 */

if (typeof module === 'object' && typeof define !== 'function') {
  var define = function(factory) {
    module.exports = factory(require, exports, module);
  };
}


define(function(require){
  var Handlebars = require('handlebars');

  return {
    templates: {
      main: './status-dropdown.hbs'
    }

  , factory: function( options ){
      this.logger = this.logger.create('StatusDropdown');

      this.render = function(){
        this.$el.html( this.renderString() );
      };

      this.renderString = function(){
        this.logger.info('Rendering string');

        return this.templates.main({
          options: options
        });
      };

      return Object.create( this );
    }
  };
});

component('status-dropdown', '').