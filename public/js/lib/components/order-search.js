/*
  Component Hierarchy
  - OrderSearch
    - SearchBar
    - SearchResults
      - SearchRow
*/

define([
  'jquery-loaded'
, 'react'
], function(
  $
, React
) {

  var OrderSearch = React.createClass({
    getInitialState: function() {
      return {
        orders: []
      , searchText: ''
      };
    },

    handleUserInput: function(searchText) {
      if ( !searchText ) {
        return this.setState({
          searchText: searchText
        , orders: []
        });
      }

      var query = { q: searchText };
      var this_ = this;
      $.ajax({
        url: this.props.endpoint
      , data: query
      , success: function(orders, status, xhr) {
          this_.setState({
            searchText: searchText
          , orders: orders
          });
        }
      });
    },

    render: function() {
      return (
        <div className="orderSearch">
          <h2 className="component-title">Search orders:</h2>
          <SearchBar
            searchText={this.state.searchText}
            onUserInput={this.handleUserInput}
          />
          <SearchResults
            orders={this.state.orders}
            searchText={this.state.searchText} 
          />
        </div>
      );
    }
  });

  var SearchBar = React.createClass({
    handleChange: function() {
      this.props.onUserInput(this.refs.searchTextInput.getDOMNode().value);
    },

    render: function() {
      return (
        <input
          type="text"
          placeholder="enter search"
          value={this.props.searchText}
          ref="searchTextInput"
          onChange={this.handleChange}
        />
      );
    }
  });

  var SearchResults = React.createClass({
    render: function() {
      var rows = this.props.orders.map(function( order ){
        return (
          <SearchRow order={order} key={order.id} />
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
      var orderUrl = '/orders/' + this.props.order.id;
      return (
        <div>
          <p><a href={orderUrl}>Order #{this.props.order.id}</a> - ${this.props.order.total}</p>
          <p>{this.props.order.restaurant.name} delivering to {this.props.order.user.name}</p>
          <hr/>
        </div>
      );
    }
  });

  return OrderSearch;
});