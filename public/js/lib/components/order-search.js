define([
  'react'
], function(
  React
) {
  var OrderSearch = React.createClass({
    getInitialState: function() {
      return { results: [] };
    },

    render: function() {
      return (
        <div class="orderSearch">
          <h1>Search orders:</h1>
        </div>
      );
    }
  });

  return OrderSearch;
});