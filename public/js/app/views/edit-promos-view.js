/*
 * Promos View
 */

 define(function(require, exports, module) {
   var utils = require('utils');
   var Handlebars = require('handlebars');
   var Promos = require('app/collections/promos');
   var Promo = require('app/models/promo');
   var PromoRowView = require('app/views/promo-row-view');

   var EditPromosView = module.exports = Backbone.View.extend({
     template: Handlebars.partials.promo_table,

     events: {
       'click .btn-add-promo': 'onAddPromoClick'
     },

     onAddPromoClick: function(e){
      var promo = new Promo();
      this.promos.add(promo);
     },

     initialize: function(){
       this.$table = this.$el.find('#promos-table');
       this.promos = this.options.promos || new Promos();
       this.promoRowViews = this.promos.map(function renderRow(promo) {
         var view = new PromoRowView({ model: promo, user: this.options.user });
         this.$table.append(view.render().el);
         return view;
       }.bind(this));

       this.listenTo(this.promos, 'add', this.addOne);
     },

     addOne: function(promo) {
      var view = new PromoRowView({ model: promo, user: this.options.user });
      this.$table.append(view.render().el);
     }
   });

   return EditPromosView;
 });
