/**
 * Adds the date/time picker functionality we use for Order Params
 */

define(function(require){
  var utils = require('utils');
  var config = require('config');

  return function( options ){
    options = utils.defaults( options || {}, {
      dateSelector:   '[name="date"]'
    , timeSelector:   '[name="time"]'
    , rangeSelector:  '[name="time-range"]'
    , dateOptions:    (function(){
                        return { format: 'mm/dd/yyyy', min: new Date() }
                      })()
    , timeOptions:    (function(){
                        return { format: 'h:i A', interval: 15 }
                      })()
    });

    return {
      initDateTimePicker: function(){
        var datepicker = this.datepicker = this.$el
          .find( options.dateSelector )
          .eq(0)
          .pickadate( options.dateOptions )
          .pickadate('picker');

        var timepicker = this.timepicker = this.$el
          .find( options.timeSelector )
          .eq(0)
          .pickatime( options.timeOptions )
          .pickatime('picker');

        var timepickerMomentFormat = timepicker.component.settings.format.replace( /\i/g, 'mm' )

        var scrollToTime = function( time ){
          var $el = timepicker.$root.find('.picker__holder');
          $el[0].scrollTop = $el.find('[data-pick="' + (60 * time) + '"]')[0].offsetTop;
        };

        var convertTimesToRanges = function(){
          timepicker.$root.find('.picker__list-item').each( function(){
            var $this = $(this);
            var range = utils.timeToRange( $this.text(), timepickerMomentFormat, config.deliveryTime );
            $this.text( range.join(' - ') );
          });
        };

        timepicker.on( 'set', function( ctx ){
          if ( 'select' in ctx ){
            var range = utils.timeToRange(
              timepicker.get(), timepickerMomentFormat, config.deliveryTime
            );

            this.$el.find( options.rangeSelector ).val( range.join(' - ') );
          }
        }.bind( this ));

        timepicker.on( 'open', function(){
          scrollToTime(8);
          convertTimesToRanges();
        });
      }
    }
  };
});
