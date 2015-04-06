define(function(require, exports, module) {
  var Handlebars = require('handlebars');
  var utils = require('utils');
  var FormView = require('./form-view');
  var Restaurant = require('../models/restaurant');
  var EditCategoryView = require('./edit-category-view');

  return module.exports = FormView.extend({
    submitSelector: '.restaurant-form .restaurant-save',

    destroyMsg: [
      "Are you sure? This will destroy all restaurant data,",
      "including items, and categories. This will also cause",
      "orders from this restaurant to no longer be displayed.",
      "Do you want to continue?"
    ].join(' '),

    events: function() {
      return {
        'keyup .restaurant-form .form-control': 'onChange',
        'change .restaurant-form .form-control, .restaurant-form input': 'onChange',
        'submit .restaurant-form': 'onSave',
        'click .new-category': 'newCategory',
        'click .add-lead-time': 'addLeadTime',
        'click .remove-lead-time': 'removeLeadTime',
        'click .restaurant-remove': 'onRestaurantRemoveClick',
        'change input[type="filepicker"]': 'onFilePickerChange',
        'click [name="yelp_business_id"]': 'onYelpBusinessIdClick',
        'click .zip-groups > .zip-group .remove': 'onZipGroupRemoveClick',
        'click .zip-groups > .zip-group:last-child': 'onNewZipGroupClick'
      };
    },

    initialize: function(options) {
      var this_ = this;

      this.categories = [];
      this.setModel(this.model || new Restaurant());
      this.model.trigger('change:gb_fee');
      this.onChange();
      this.setTooltips();
      _.each(options.hours, function(view) {
        this.listenTo(view.model, 'change', this.onChange, this);
      }, this);

      this.setState('default');

      // onSave callback has ambiguous argument ordering, so use events
      // i.e. the first argument to callback could be error or it could
      // be the XHR object
      this.on('save:success', function(){
        this_.setState('saved');
        setTimeout( this_.setState.bind( this_, 'default' ), 2000 );
      });

      this.on('save:invalid', function(){
        this_.setState( 'error', this.model.validationError );
      });

      this.on('save:error', function(){
        this_.setState( 'error' );
      });
    },

    setTooltips: function() {
      this.$el.find('.remove-lead-time').tooltip();
    },

    remove: function() {
      _.invoke(this.categories, 'remove');
      FormView.prototype.remove.apply(this, arguments);
    },

    setModel: function(model) {
      this.stopListening(this.model);
      this.model = model;
      this.listenTo(this.model, {
        sync: function() {
          this.$el.find('.restaurant-form .form-control').parent().removeClass('has-success');
        },
        'change:sms_phone': utils.bind(this.formatPhone, this, 'sms_phone'),
        'change:voice_phone': utils.bind(this.formatPhone, this, 'voice_phone'),
        'change:gb_fee': utils.bind(this.onGbFeeChange, this)
      });
      this.listenTo(this.model.categories, 'sort', this.sortCategories, this);
      return this;
    },

    fieldMap: {
      name: '.restaurant-form .restaurant-name',
      yelp_business_id: '.restaurant-form [name="yelp_business_id"]',
      logo_url: '.restaurant-form [name="logo_url"]',
      logo_mono_url: '.restaurant-form [name="logo_mono_url"]',
      display_phone: '.restaurant-form .restaurant-display-phone',
      price: '.restaurant-form .restaurant-price',
      cuisine: '.restaurant-form .restaurant-cuisine',
      minimum_order: '.restaurant-form .restaurant-minimum-order',
      delivery_fee: '.restaurant-form .restaurant-delivery-fee',
      street: '.restaurant-form .restaurant-street',
      city: '.restaurant-form .restaurant-city',
      state: '.restaurant-form .restaurant-state',
      zip: '.restaurant-form .restaurant-zip',
      delivery_zips: '.restaurant-form .restaurant-delivery-zips',
      delivery_times: '.restaurant-form .time',
      lead_times: '.restaurant-form .lead-times',
      tags: '.restaurant-form .restaurant-tags input',
      is_hidden: '.restaurant-form .restaurant-is-hidden',
      meal_types: '.restaurant-form .restaurant-meal-types input',
      meal_styles: '.restaurant-form .restaurant-meal-styles input',
      websites: '.restaurant-form .restaurant-websites',
      description: '.restaurant-form .restaurant-description',
      billing_email: '.restaurant-form [name="billing_email"]',
      billing_street: '.restaurant-form [name="billing_street"]',
      billing_street2: '.restaurant-form [name="billing_street2"]',
      billing_city: '.restaurant-form [name="billing_city"]',
      billing_state: '.restaurant-form [name="billing_state"]',
      billing_zip: '.restaurant-form [name="billing_zip"]',
      gb_fee: '.restaurant-form [name="gb_fee"]',
      is_direct_deposit: '.restaurant-form [name="is_direct_deposit"]',
      is_fee_on_total: '.restaurant-form [name="is_fee_on_total"]',
      region_id: '.restaurant-form [name="region_id"]',
      delivery_service_head_count_threshold: '.restaurant-form [name="delivery_service_head_count_threshold"]',
      delivery_service_order_total_upperbound: '.restaurant-form [name="delivery_service_order_total_upperbound"]',
      delivery_service_order_amount_threshold: '.restaurant-form [name="delivery_service_order_amount_threshold"]'
    },

    fieldSplit: function(selector, delimiter) {
      delimiter = delimiter || ',';
      var val = this.$el.find(selector).val().trim();
      return val ? _.invoke(val.split(delimiter), 'trim') : [];
    },

    // TODO: do this automatically based on the model schema
    fieldGetters: {
      price: _.partial(FormView.intGetter, 'price'),
      minimum_order: _.compose(function(cents) { return cents ? Math.round(cents * 100) : null; }, _.partial(FormView.floatGetter, 'minimum_order')),
      delivery_fee: _.compose(function(cents) { return cents != null ? Math.round(cents * 100) : null; }, _.partial(FormView.floatGetter, 'delivery_fee')),

      cuisine: function() {
        return this.fieldSplit(this.fieldMap.cuisine);
      },

      display_phone: function() {
        return this.$el.find(this.fieldMap.display_phone).val().replace(/[^\d]/g, '') || null;
      },

      websites: function() {
        return _.map(this.fieldSplit(this.fieldMap.websites), Handlebars.helpers.website);
      },

      delivery_zips: function() {
        var delivery_zips = [];
        this.$el.find('.zip-group:not(.zip-group:last-child)').each( function(){
          var $group = $(this);
          var fee = +Handlebars.helpers.pennies( $group.find('[name="fee"]').val() );
          $group.find('[name="zips"]').val()
            .replace( /\s/g, '' )
            .split(',')
            .map( function( z ){
              return parseInt( z );
            }).forEach( function( zip ){
              delivery_zips.push({
                fee: fee
              , zip: zip
              })
            });
        });

        return delivery_zips;
      },

      delivery_times: function() {
        var models = _.pluck(this.options.hours, 'model')
        return _.object(_.invoke(models, 'get', 'day'), _.invoke(models, 'toJSON'));
      },

      lead_times: function() {
        return _.compact(_.map(this.$el.find('.lead-time'), function(el) {
          var guests = parseInt($(el).find('.lead-max-guests').val());
          var hours = parseInt($(el).find('.lead-hours').val());
          var cancel = parseInt($(el).find('.lead-cancel-time').val());
          return !_.isNaN(guests) && !_.isNaN(hours) ? {
            max_guests: !_.isNaN(guests) ? guests : null,
            lead_time:!_.isNaN(hours) ? hours : null,
            cancel_time: !_.isNaN(cancel) ? cancel : null
          } : null;
        }));
      },

      tags: function() {
        return _.pluck(this.$el.find(this.fieldMap.tags+ ':checked'), 'value');
      },

      meal_types: function() {
        return _.pluck(this.$el.find(this.fieldMap.meal_types + ':checked'), 'value');
      },

      meal_styles: function() {
        return _.pluck(this.$el.find(this.fieldMap.meal_styles + ':checked'), 'value');
      },

      is_hidden: function() {
        return this.$el.find(this.fieldMap.is_hidden).is(':checked');
      },

      is_direct_deposit: function() {
        return this.$el.find(this.fieldMap.is_direct_deposit).is(':checked');
      },

      is_fee_on_total: function() {
        return this.$el.find(this.fieldMap.is_fee_on_total).is(':checked');
      },

      yelp_business_id: function(){
        var url = this.$el.find(this.fieldMap.yelp_business_id).val();
        if (!url) return null;
        if (url.indexOf('/') === -1) return null;

        url = url.split('/').pop();
        return url.split('#')[0];
      },

      gb_fee: function(){
        var $el = this.$el.find( this.fieldMap.gb_fee );
        var val = $el.val();
        val = Handlebars.helpers[ $el.data('in') ]( val );
        return val;
      },

      delivery_service_order_amount_threshold: function(){
        var $el = this.$el.find( this.fieldMap.delivery_service_order_amount_threshold );
        var val = $el.val();
        val = Handlebars.helpers[ $el.data('in') ]( val );
        return val;
      },

      delivery_service_head_count_threshold: function(){
        return +this.$el.find( this.fieldMap.delivery_service_head_count_threshold ).val();
      },

      delivery_service_order_total_upperbound: function(){
        return +this.$el.find( this.fieldMap.delivery_service_order_total_upperbound ).val();
      },

      region_id: function(){
        return +this.$el.find( this.fieldMap.region_id ).val();
      }
    },

    // Sets the state of the view to communicate to the user
    // what the view is doing (is it saving? Was there an error?)
    setState: function( state, error ){
      if ( this.state === state ) return;

      var args = Array.prototype.slice.call( arguments );
      this.state = state;
      args[0] = 'change:' + args[0];
      this.trigger.apply( this, args );

      this.$el.find('.status-text > span').addClass('hide');
      this.$el.find('.status-text > .state-' + state).removeClass('hide');

      if ( state === 'error' ){
        var msg;
        if ( error && error.message ) msg = error.message;
        else if ( typeof error === 'string' ) msg = error;
        else msg = 'Something went horribly wrong!';

        this.$el.find('.status-text > .state-error').text( msg );
      }
    },

    onSave: function(e){
      var this_ = this;
      this.setState('loading');

      FormView.prototype.onSave.call( this, e );
    },

    onChange: _.debounce( function(e) {
      this.$el.find('.form-control').parent().removeClass('has-success');
      var diff = FormView.prototype.onChange.apply(this, arguments);
      if (diff !== null && Object.keys(diff).length > 0) {
        var changed = _.values(_.pick(this.fieldMap, _.keys(diff))).join(', ');
        this.$el.find(changed).parent().filter(':not(.has-error)').addClass('has-success');
        this.setState('pending');
      } else {
        this.setState('default');
      }
    }, 200 ),

    newCategory: function() {
      var categoryView = new EditCategoryView({restaurant: this});

      this.categories.push(categoryView);
      this.model.categories.add(categoryView.model, {sort: false});

      categoryView.render().attach();

      var newCat = this.$el.find('.category-form').last();
      newCat.find('.new-item').attr('style', "display: none");
    },

    sortCategories: function(collection, options) {
      this.categories = _.sortBy(this.categories, function(cat) {
        return cat.model.get('order');
      });

      _.invoke(this.categories, 'remove');
      _.invoke(this.categories, 'attach');
    },

    // TODO: generic field formatter system.
    formatPhone: function(field, model, value, options) {
      this.$el.find(this.fieldMap[field]).val(Handlebars.helpers.phoneNumber(value))
    },

    addLeadTime: function(e) {
      this.$el.find('.lead-times-list').append(Handlebars.partials.lead_time({}));
    },

    removeLeadTime: function(e) {
      e.preventDefault();
      $(e.target).closest('.lead-time').remove();
      this.onChange(e);
    },

    onRestaurantRemoveClick: function(e){
      if ( !confirm( this.destroyMsg ) ) return;

      this.model.destroy({
        success: function(){ window.location.href = '/restaurants?edit=true'; }
      });
    },

    onFilePickerChange: function(e){
      var $input = $(e.originalEvent.target);
      $input.siblings('[data-name="' + $input.attr('name') + '"]').attr(
        'src', $input.val()
      );
    },

    onYelpBusinessIdClick: function(e){
      e.target.select();
    },

    onNewZipGroupClick: function(e){
      var $el = $(e.currentTarget);
      $el.before( $el.clone() );
      this.delegateEvents();
    },

    onZipGroupRemoveClick: function(e){
      $(e.currentTarget).parents('.zip-group').remove();
    },

    onGbFeeChange: function(){
      this.$el.find( this.fieldMap.gb_fee ).val(
        Handlebars.helpers.factorToPercent( this.model.get('gb_fee') )
      );
    }
  });
});
