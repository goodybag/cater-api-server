define( function( require ){
  var $               = require('jquery');
  var utils           = require('utils');

  var page = {
    init: function(options) {
      var ListView = require('app/views/restaurants-list-view');
      var listView = new ListView({
        el: '#main'
        , searchUrl: '/restaurants'
      });
      listView.addFilter(options.orderParamsView);
      listView.addFilter(options.sortView);
      listView.addFilter(options.filtersView);
      listView.addFilter(options.searchView);
    }
  };

  return page;
});
