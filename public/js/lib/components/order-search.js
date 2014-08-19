define([
  'react'
], function(
  React
) {


  /*
    Component Hierarchy

    - OrderSearch
      - SearchBar
      - SearchResults
        - SearchRow
  */

  var OrderSearch = React.createClass({
    getInitialState: function() {
      return { results: [] };
    },

    render: function() {
      return (
        <div className="orderSearch">
          <h2 className="component-title">Search orders:</h2>
          <SearchBar />
          <SearchResults data={this.props.data} />
        </div>
      );
    }
  });

  var SearchBar = React.createClass({
    render: function() {
      return (
        <input type="text" placeholder="enter search"></input>
      );
    }
  });

  var SearchResults = React.createClass({
    render: function() {
      var rows = this.props.data.map(function( result ){
        return (
          <SearchRow result={result}/>
        );
      });

      return (
        <div className="searchResults">
          {rows}
        </div>
      );
    }
  });

  var SearchRow = React.createClass({
    render: function() {
      var orderUrl = '/orders/' + this.props.result.order.id;
      return (
        <div>
          <p><a href={orderUrl}>Order #{this.props.result.order.id}</a> - ${this.props.result.order.total}</p>
          <p>{this.props.result.restaurant.name} delivering to {this.props.result.user.name}</p>
          <hr/>
        </div>
      );
    }
  });

  return OrderSearch;
});