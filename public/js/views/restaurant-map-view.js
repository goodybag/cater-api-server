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
        this_.latlng = results[0].geometry.location;
        this_.createMap();
      } else {
        alert('Geocode was not successful for the following reason: ' + status);
      }
    });
    
    // Create the map
    var mapOptions = {
      center: this.latlng,
      zoom: 17
    };
    this.map = new google.maps.Map(this.el, mapOptions);

    var marker = new google.maps.Marker({
      position: this.latlng,
      map: this.map,
      title:"Hello World!"
    });
  },

  render: function() {
    google.maps.event.addDomListener(window, 'load', _.bind(this.createMap, this));
    return this;
  },

  /**
   * The map is initially rendered off canvas,
   * so refresh the map when clicking tab to
   * fix rendering.
   */
  refresh: function() {
    var map = this.map;
    google.maps.event.trigger(map, 'resize');
    map.setCenter(map.getCenter());
    map.setZoom( map.getZoom() );
  }
});