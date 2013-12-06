/**
 * Model:
 *   - Restaurant
 *
 * El:
 *   - '.restaurant-map'
 */

var RestaurantMapView = Backbone.View.extend({
  initialize: function() {
    var this_ = this;
    this.address = _.values(this.model.pick(
      'street'
    , 'street2'
    , 'city'
    , 'state'
    , 'zip'))
    .join(' ');

  },

  createMap: function() {
    var this_ = this;

    // Get lat lng coordinates
    var geocoder = new google.maps.Geocoder();
    var geoReq = {
      address: this.address
    };
    geocoder.geocode(geoReq, function (results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
        var latlng = results[0].geometry.location;

        // Create the map
        var mapOptions = {
          center: latlng,
          zoom: 15
        };

        this_.map = new google.maps.Map(this_.el, mapOptions);

        var marker = new google.maps.Marker({
          position: latlng,
          map: this_.map,
          title: this_.model.get('name')
        });
      } else {
        alert('Geocode was not successful for the following reason: ' + status);
      }
    });

  },

  render: function() {

    // render once
    if (!this.map) this.createMap.call(this);
    return this;

  },
});