define(function(require, exports, module) {
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
      this.categories = [];
      this.setModel(this.model || new Restaurant());
      this.onChange();
      this.setTooltips();
      _.each(options.hours, function(view) {
        this.listenTo(view.model, 'change', this.onChange, this);
      }, this);

      this.setState('default');
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
        'change:voice_phone': utils.bind(this.formatPhone, this, 'voice_phone')
      });
      this.listenTo(this.model.categories, 'sort', this.sortCategories, this);
      return this;
    },

    fieldMap: {
      name: '.restaurant-form .restaurant-name',
      yelp_business_id: '.restaurant-form [name="yelp_business_id"]',
      logo_url: '.restaurant-form [name="logo_url"]',
      logo_mono_url: '.restaurant-form [name="logo_mono_url"]',
      sms_phones: '.restaurant-form .restaurant-sms-phones',
      voice_phones: '.restaurant-form .restaurant-voice-phones',
      display_phone: '.restaurant-form .restaurant-display-phone',
      emails: '.restaurant-form .restaurant-emails',
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
      description: '.restaurant-form .restaurant-description'
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

      sms_phones: function() {
        return _.invoke(this.fieldSplit(this.fieldMap.sms_phones), 'replace', /[^\d]/g, '');
      },

      voice_phones: function() {
        return _.invoke(this.fieldSplit(this.fieldMap.voice_phones), 'replace', /[^\d]/g, '');
      },

      display_phone: function() {
        return this.$el.find(this.fieldMap.display_phone).val().replace(/[^\d]/g, '') || null;
      },

      emails:  function() {
        return this.fieldSplit(this.fieldMap.emails);
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

      yelp_business_id: function(){
        var url = this.$el.find(this.fieldMap.yelp_business_id).val();
        if (!url) return null;
        if (url.indexOf('/') === -1) return null;

        url = url.split('/').pop();
        return url.split('#')[0];
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

      // onSave callback has ambiguous argument ordering, so use events
      // i.e. the first argument to callback could be error or it could
      // be the XHR object
      this.once('save:success', function(){
        this_.setState('saved');
        setTimeout( this_.setState.bind( this_, 'default' ), 2000 );
      });

      this.once('save:invalid', function(){
        this_.setState( 'error', this.model.validationError );
      });

      this.once('save:error', function(){
        this_.setState( 'error' );
      });
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
    }
  });
});
