/**
 * Dependencies:
 *   - Leaflet.js
 *
 * Model:
 *   - Restaurant
 *
 * El:
 *   - '.restaurant-map'
 */

var RestaurantMapView = Backbone.View.extend({
  initialize: function() {
    var map = this.map = L.map(this.el).setView([30.37, -97.676], 13);

  },

  render: function() {

    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
      attribution: false,
      // attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://cloudmade.com">CloudMade</a>',
      maxZoom: 18,
      // subdomains: '1234'
    }).addTo(this.map);

    
    return this;
  },

  refresh: function() {
    this.map.invalidateSize();
  }
});