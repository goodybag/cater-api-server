define(function(require, exports, module) {
  var React = require('react');
  var Steps = require('../../../dist/restaurant-signup/steps/index.js');

describe('Steps', function () {

  describe('ref keys should be included in .getFields()', function () {
      Steps.forEach(function (step) {
        var Step = React.createElement(step.component, null);
        var component = React.render(Step, document.createElement('div'));
        var fields = component.getFields();

        Object.keys(component.refs).forEach(function (ref) {
          var caseName = 'ref :1 should be in :2 fields'
            .replace(':1', ref)
            .replace(':2', step.name);

          it(caseName, function () {
            expect(fields.indexOf(ref) > -1).toBe(true);
          });

        });
      });

    });
  })

});