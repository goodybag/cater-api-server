// Super specific view for toggling is_hidden on restaurant listing
define(function(require) {
  var utils = require('utils');
  var Restaurant = require('app/models/restaurant');

  var ArchiveView = utils.View.extend({

    events: {
      'click .btn-unarchive': 'unarchive'
    , 'submit #archive-form': 'archive'
    }

    , unarchive: function(e) {
        e.preventDefault();
        var json = $(e.target).data(this.options.dataAttr);
        var restaurant = new Restaurant( json);
        restaurant.save({ is_archived: false }, {
          success: function(model, response, options) {
            window.location.reload();
          },

          error: function(model, response, options) {
            alert('Could not unarchive this restaurant!'); // fancy
          }
        });
      }

    , archive: function (e) {
        e.preventDefault();
        var id = $(e.target).find("input[name='id']").val();

        var request = $.getJSON('/api/restaurants/' + id);
        request.done(function ( json ) {
          var restaurant = new Restaurant(json);
          restaurant.save({ is_archived: true }, {
            success: function(model, response, options) {
              window.location.reload();
            },

            error: function (model, response, options) {
              alert('Could not archive restaurant');
            }
          });
        });

        request.fail(function (error) {
          console.error(error);
          alert('failed to locate restaurant');
        });
      }

  });

  return ArchiveView;
});