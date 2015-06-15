/**
 * Order Analytics Controller
 */
var moment = require('moment-timezone');
var analytics = require('../lib/stamps/analytics');
var utils = require('utils');
var db = require('db');

var OrderAnalytics = {

  // Attach current period caption and previous and next links
  period: function(options) {
    return function(req, res, next) {
      res.locals.period = analytics({ query: req.query }).getPeriod();
      next();
    };
  }

  // Query orders total, guests per month
, month: function(options) {
    return function(req, res, next) {
      var logger = req.logger.create('Order Analytics Monthly Stats');

      var regions = utils.chain(res.locals.filters.region)
        .filter(function(option) {
          return option.active;
        })
        .pluck('name')
        .value();
      var $query = {
        'status': 'accepted'

      , 'submitted_dates.submitted': [
          { $extract: { field: 'month', $equals: req.query.month, timezone: 'orders.timezone' } }
        , { $extract: { field: 'year', $equals: req.query.year , timezone: 'orders.timezone' } }
        ]
      };

      var $options = {
        submittedDate: { ignoreColumn: true }
      , columns: [
          { type: 'sum', expression: 'total', alias: 'volume' }
        , { type: 'sum', expression: 'guests', alias: 'guests' }
        , { type: 'count', expression: { type: 'distinct', expression: 'users.organization' }, alias: 'organizations' }
        , { type: 'count', expression: '*', alias: 'placed' }
        , { expression: 'extract(month from submitted at time zone orders.timezone) as month' }
        , { expression: 'extract(year from submitted at time zone orders.timezone) as year' }
        ]
      , groupBy: [
          { expression: 'month' }
        , { expression: 'year' }
        ]
      , joins: [ { type: 'left', target: 'restaurants', on: { id: '$orders.restaurant_id$' } }
               , { type: 'left', target: 'users', on: { id: '$orders.user_id$' } }
               ]
      };

      if ( regions.length ) {
        $query[ 'regions.name' ] = { $in: regions };
        $options.joins.push( { type: 'left', target: 'regions', on: { id: '$restaurants.region_id$' } } );
      }

      db.orders.find($query, $options, function(err, stats) {
        if ( err ) {
          logger.error('Unable to calculate monthly stats for month', err);
          return res.send(500, err);
        }
        res.locals.stats = res.locals.stats || {};
        res.locals.stats.month = stats[0];

        next();
      });
    };
  }

  // Query stats per week in a month. Note: weeks may be outside
  // of the first and last day of the month due to ISO 8601 week definition
  // http://www.staff.science.uu.nl/~gent0113/calendar/isocalendar.htm
, week: function(options) {
    return function(req, res, next) {
      var logger = req.logger.create('Order Analytics Weekly Stats');

      var monthMoment = moment(req.query.year + '-' + req.query.month, 'YYYY-M').startOf('month');
      var start = monthMoment.format('YYYY-MM-DD');
      var end = monthMoment.endOf('month');
      if ( end.day() !== 7 ) end.day(7);
      end = end.format('YYYY-MM-DD');

      var regions = utils.chain(res.locals.filters.region)
        .filter(function(option) {
          return option.active;
        })
        .pluck('name')
        .value();

      var $query = {
        status: 'accepted'
      , $notNull: { 'submitted_dates.submitted': true }
      , $custom: [
          'extract(week from submitted_dates.submitted) in (select extract(week from n) from generate_series($1::timestamp, $2, $3) n)'
        , start
        , end
        , '1 week'
        ]
      , 'submitted_dates.submitted': [
          { $extract: { field: 'year', $equals: req.query.year, timezone: 'orders.timezone' } }
        ]
      };

      var $options = {
        columns: [
          { type: 'sum', expression: 'total', alias: 'volume' }
        , { type: 'sum', expression: 'guests', alias: 'guests' }
        , { type: 'count', expression: '*', alias: 'placed' }
        , { type: 'count', expression: { type: 'distinct', expression: 'users.organization' }, alias: 'organizations' }
        , { expression: 'extract(year from submitted) as year' }
        , { expression: 'extract(week from submitted) as week' }
        ]
      , groupBy: [
          { expression: 'year' }
        , { expression: 'week' }
        ]
      , order: [
          { expression: 'year desc' }
        , { expression: 'week desc' }
        ]
      , submittedDate: { ignoreColumn: true }
      , joins: [ { type: 'left', target: 'restaurants', on: { id: '$orders.restaurant_id$' } }
               , { type: 'left', target: 'regions', on: { id: '$restaurants.region_id$' } }
               , { type: 'left', target: 'users', on: { id: '$orders.user_id$' } }
               ]
      };

      if ( regions.length ) $query['regions.name'] = { $in: regions };

      db.orders.find($query, $options, function(err, stats) {
        if ( err ) {
          logger.error('Unable to get weekly order stats', err);
          return res.send(500, err);
        }

        stats = stats.reduce(function(stats, stat){
          stats[stat.week] = stat;
          return stats;
        }, {});

        res.locals.stats = res.locals.stats || {};
        res.locals.stats.week = stats;

        next();
      });
    };
  }

, retention: function(options) {
    options = utils.defaults({}, options, {
      monthsBack: 3
    });

    return function(req, res, next) {
      var submissions = res.locals.organization_submissions;
      if (!submissions) return res.error(500);

      var keys = utils.range(0, options.monthsBack + 1);
      var vals = keys.map(function() { return 0; });

      var init = {
        totals: utils.object(keys, vals)
      , uniqOrgs: submissions.length
      , newOrgs: 0
      };

      var now = new Date();
      var currMonth = now.getMonth();
      var currYear = now.getYear();

      var tallySubmission = function(stats, submission) {
        var old = submission.months_since_last_submitted >= options.monthsBack; // clump all the old organizations together
        stats.totals[ old ? options.monthsBack : submission.months_since_last_submitted ]++;

        var date = new Date(submission.first_submitted);
        if ( date.getMonth() === currMonth && date.getYear() === currYear ) stats.newOrgs++;
        return stats;
      };

      res.locals.stats = submissions.reduce(tallySubmission, init);
      next();
    };
  }
};

module.exports = OrderAnalytics;
