/**
 * Handles `query` object for week, month and year.
 *
 * Used to page to the previous and next periods as well
 * as describe the current period e.g. 'Week 12 of 2015'
 *
 * Note: This will operate in monthly periods if week is not
 * provided.
 */
var querystring = require('querystring');
var utils = require('../../../utils');
var stampit = require('stampit');
var moment = require('moment-timezone');

module.exports = stampit().enclose(function constructor(){
  this.query = this.query || {};

  var now = moment();
  var month = this.query.month || now.month();
  var year = this.query.year || now.year();
  var week = this.query.week || now.week();

  if ( this.query.week ) {
    this._moment = moment().day('Monday').year(year).week(week); // todo figure correct week parsing
  } else {
    this._moment = moment(year + ' ' + month, 'YYYY MM');
  }
}).methods({
  getCaption: function(){
    if ( this.query.week ) {
      return ['Week', this._moment.week(), 'of', this._moment.year()].join(' ');
    } else {
      return ['Month of', this._moment.format('MMM Do'), '-', this._moment.endOf('month').format('MMM Do YYYY')].join(' ');
    }
  }

, getPrevious: function(){
    var query = utils.clone(this.query);
    var clone =  this._moment.clone();

    if ( this.query.week ) {
      query.week = clone.subtract(1, 'week').week();
    } else {
      // moment zero indexes month
      query.month = clone.subtract(1, 'month').month()+1;
    }

    // update year in case of changes
    query.year = clone.year();
    return querystring.stringify(query);
  }

, getNext: function() {
    var query = utils.clone(this.query);
    var clone = this._moment.clone();

    if ( this.query.week ) {
      query.week = clone.add(1, 'week').week();
    } else {
      // moment zero indexes month
      query.month = clone.add(1, 'month').month()+1;
    }

    // update year in case of changes
    query.year = clone.year();
    return querystring.stringify(query);
  }

, getPeriod: function() {
    return {
      caption: this.getCaption()
    , previous: this.getPrevious()
    , next: this.getNext()
    };
  }
});
