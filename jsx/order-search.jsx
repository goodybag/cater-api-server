/** @jsx React.DOM */

/*
  Component Hierarchy
  - OrderSearch
    - SearchBar
    - SearchResults
      - SearchRow
*/
define(function(require, exports, module) {
  var $ = require('jquery');
  var Handlebars = require('handlebars');
  var React = require('react');
  var moment = require('moment');

  var OrderSearch = React.createClass({
    getInitialState: function() {
      return {
        orders: []
      , searchText: ''
      };
    },

    search: function(searchText) {
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

    clearSearch: function() {
      this.setState({ orders: [] });
    },

    render: function() {
      return (
        <div className="orderSearch">
          <SearchBar
            searchText={this.state.searchText}
            search={this.search}
            clearSearch={this.clearSearch}
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
      this.props.search(this.refs.searchTextInput.getDOMNode().value);
    },

    handleFocus: function() {
      this.props.search(this.refs.searchTextInput.getDOMNode().value);
    },

    handleBlur: function() {
      this.props.clearSearch();
    },

    render: function() {
      return (
        <input
          type="text"
          placeholder="Enter search"
          value={this.props.searchText}
          ref="searchTextInput"
          onChange={this.handleChange}
          onFocus={this.handleFocus}
          onBlur={this.handleBlur}
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
      var total = Handlebars.helpers.dollars( this.props.order.total );
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

  return module.exports = OrderSearch;
});