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
  var utils = require('utils');
  var React = require('react');
  var moment = require('moment');
  var config = require('config');

  var OrderSearch = React.createClass({displayName: 'OrderSearch',
    getInitialState: function() {
      return {
        orders: []
      , searchText: ''
      };
    },

    handleInputChange: function(searchText) {
      if ( !searchText ) return this.clearSearch();
      this.setState({searchText: searchText});
      this.search();
    },

    search: utils.debounce(function() {
      var searchText = this.state.searchText
      var this_ = this;
      $.ajax({
        url: this.props.endpoint
      , data: { q: searchText }
      , success: function(orders, status, xhr) {
          this_.setState({ orders: orders });
        }
      });
    }, config.debounceWait),

    clearSearch: function() {
      this.setState({ searchText: '', orders: [] });
    },

    render: function() {
      return (
        React.DOM.div({className: "orderSearch"}, 
          SearchBar({
            searchText: this.state.searchText, 
            handleInputChange: this.handleInputChange, 
            clearSearch: this.clearSearch}
          ), 
          SearchResults({
            orders: this.state.orders, 
            searchText: this.state.searchText}
          )
        )
      );
    }
  });

  var SearchBar = React.createClass({displayName: 'SearchBar',
    handleChange: function() {
      this.props.handleInputChange(this.refs.searchTextInput.getDOMNode().value);
    },

    handleFocus: function() {
      this.props.handleInputChange(this.refs.searchTextInput.getDOMNode().value);
    },

    handleBlur: function() {
      this.props.clearSearch();
    },

    render: function() {
      return (
        React.DOM.input({
          type: "text", 
          placeholder: "Enter search", 
          value: this.props.searchText, 
          ref: "searchTextInput", 
          onChange: this.handleChange, 
          onFocus: this.handleFocus, 
          onBlur: this.handleBlur}
        )
      );
    }
  });

  var SearchResults = React.createClass({displayName: 'SearchResults',
    render: function() {
      var rows = this.props.orders.map(function( order ){
        return (
          SearchRow({order: order, key: order.id})
        );
      });

      var classString = 'search-results list-group';
      return (
        React.DOM.div({className: classString}, 
          rows
        )
      );
    }
  });

  var SearchRow = React.createClass({displayName: 'SearchRow',
    render: function() {
      var orderUrl = '/orders/' + this.props.order.id;
      var datetime = moment( this.props.order.datetime ).calendar();
      var total = Handlebars.helpers.dollars( this.props.order.total );
      var classString = 'search-row list-group-item';
      var orgString = this.props.order.user.organization ?
                        '(' + this.props.order.user.organization +')' : '';
      return (
        React.DOM.div({className: classString}, 
          React.DOM.a({href: orderUrl}, 
            React.DOM.div(null, React.DOM.strong(null, "#", this.props.order.id), " ", datetime, " for $", total), 
            React.DOM.div(null, this.props.order.restaurant.name, " to ", this.props.order.user.name, " ", orgString)
          )
        )
      );
    }
  });

  return module.exports = OrderSearch;
});