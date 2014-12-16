/**
 * Restaurant Plan Basic Info Form
 */

if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define( function( require, exports, module ){
  var utils       = require('utils');
  var Hbs         = require('handlebars');
  var ItemForm    = require('app/views/admin/item-form');
  var elToggler   = require('el-toggler');

  return ItemForm.extend({
    events: utils.extend( {}, ItemForm.prototype.events || {}, {
      'click [data-role="new-tier"]': 'onNewTierClick'
    })

  , twoway: { type: true }
  , tierTmpl: Hbs.partials.restaurant_plan_edit_tier

  , typeGetters: utils.extend({
      data: function( $el ){
        if ( this.model.attributes.type === 'flat' ){
          var $target = $el.find('[data-toggler-id="flat"] [name="fee"]');
          return {
            fee: this.getDomValue( 'fee', $target )
          };
        } else if ( this.model.attributes.type === 'tiered' ){
          var tiers = [], this_ = this;

          $el.find('.tier').each( function(){
            var $this = $(this);
            tiers.push({
              fee:   this_.getDomValue( 'fee', $this.find('[name="fee"]') )
            , amount: this_.getDomValue( 'amount', $this.find('[name="amount"]') )
            });
          });

          return {
            tiers: tiers
          };
        }
      }
    }, ItemForm.prototype.typeGetters )

  , initialize: function(){
      ItemForm.prototype.initialize.apply( this, arguments );

      this.typeToggler = elToggler.init( this.$el.find('select[name="type"]'), {
        manual: true
      });

      this.model.on( 'change:type', this.onModelTypeChange.bind( this ) );

      return this;
    }

  , addNewTier: function(){
      var $el = utils.dom( this.tierTmpl() );
      $el.find('[data-role="remove"]').click( function(){
        $el.remove();
      });
      this.$el.find('.tiers').append( $el );
      return this;
    }

  , onNewTierClick: function( e ){
      this.addNewTier({ amount: 0, fee: 0 });
    }

  , onModelTypeChange: function(){
      this.typeToggler.show( this.model.get('type') );
    }
  });
});