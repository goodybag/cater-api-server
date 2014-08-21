/** @jsx React.DOM */

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
, 'moment'
, 'Handlebars'
], function(
  $
, React
, moment
, Hbs
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
          placeholder="Enter search"
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

      var classString = 'search-results list-group';
      return (
        <div className={classString}>
          {rows}
        </div>
      );
    }
  });

  var SearchRow = React.createClass({
    render: function() {
      var orderUrl = '/orders/' + this.props.order.id;
      var datetime = moment( this.props.order.datetime ).calendar();
      var total = Hbs.helpers.dollars( this.props.order.total );
      var classString = 'search-row list-group-item';
      var orgString = this.props.order.user.organization ?
                        '(' + this.props.order.user.organization +')' : '';
      return (
        <div className={classString}>
          <a href={orderUrl}>
            <div><strong>#{this.props.order.id}</strong> {datetime} for ${total}</div>
            <div>{this.props.order.restaurant.name} to {this.props.order.user.name} {orgString}</div>
          </a>
        </div>
      );
    }
  });

  return OrderSearch;
});