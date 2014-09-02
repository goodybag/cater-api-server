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

  var OrderSearch = React.createClass({
    getInitialState: function() {
      return {
        orders: []
      , searchText: ''
      };
    },

    componentDidMount: function() {
      window.addEventListener('click', this.clearResults);
    },

    handleInputChange: function(searchText) {
      if ( !searchText  || searchText.trim() === '') return this.clearSearch();
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

    clearResults: function() {
      this.setState({ orders: [] });
    },

    render: function() {
      return (
        <div className="orderSearch">
          <SearchBar
            searchText={this.state.searchText}
            handleInputChange={this.handleInputChange}
            onEscapeKey={this.clearResults}
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
      this.props.handleInputChange(this.refs.searchTextInput.getDOMNode().value);
    },

    handleFocus: function() {
      this.props.handleInputChange(this.refs.searchTextInput.getDOMNode().value);
    },

    handleKeyPress: function(e) {
      if ( e.which === 27 && typeof this.props.onEscapeKey === 'function' ) {
        this.props.onEscapeKey();
      }
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
          onKeyDown={this.handleKeyPress}
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
    handleClick: function(e) {
      // This prevents clearing results
      e.stopPropagation();
    },

    render: function() {
      var orderUrl = '/orders/' + this.props.order.id;
      var datetime = moment( this.props.order.datetime ).calendar();
      var total = Handlebars.helpers.dollars( this.props.order.total );
      var classString = 'search-row list-group-item';
      var orgString = this.props.order.user.organization ?
                        '(' + this.props.order.user.organization +')' : '';
      return (
        <div className={classString} onClick={this.handleClick}>
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