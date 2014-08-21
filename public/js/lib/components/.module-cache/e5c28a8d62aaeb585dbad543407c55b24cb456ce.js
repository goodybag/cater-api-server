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

  var OrderSearch = React.createClass({displayName: 'OrderSearch',
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
        React.DOM.div({className: "orderSearch"}, 
          SearchBar({
            searchText: this.state.searchText, 
            onUserInput: this.handleUserInput}
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
      this.props.onUserInput(this.refs.searchTextInput.getDOMNode().value);
    },

    render: function() {
      return (
        React.DOM.input({
          type: "text", 
          placeholder: "enter search", 
          value: this.props.searchText, 
          ref: "searchTextInput", 
          onChange: this.handleChange}
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
      var total = Hbs.helpers.dollars( this.props.order.total );
      var classString = 'search-row list-group-item';
      // <div><a href={orderUrl}>Order #{this.props.order.id}</a> - ${total} @ {datetime}</div>
          // <div>{this.props.order.restaurant.name} delivering to {this.props.order.user.name} ({this.props.order.user.organization})</div>
      return (
        React.DOM.div({className: classString}, 
          React.DOM.div(null, React.DOM.a({href: orderUrl}, "Order #", this.props.order.id))
          
        )
      );
    }
  });

  return OrderSearch;
});