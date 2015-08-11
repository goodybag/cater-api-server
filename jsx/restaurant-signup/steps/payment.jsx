define(function (require, exports, module) {
  var React = require('react');

  var Input = require('../components/input');
  var requestMixin = require('../mixins/requests');

  module.exports = React.createClass({
    mixins: [requestMixin],

    getFields: function () {
      return [
        'billing_street'
      , 'billing_street2'
      , 'billing_city'
      , 'billing_state'
      , 'billing_zip'
      , 'billing_name'
      , 'billing_account_type'
      , 'billing_account_name'
      , 'billing_account_number'
      ];
    },

    render: function () {
      return (
        <div>
          <div>
            <h2>Billing Address</h2>
            <Input label="Street" ref="billing_street" />
            <Input label="Street 2" ref="billing_street2" />
            <Input label="City" ref="billing_city" />
            <Input label="State" ref="billing_state" />
            <Input label="Zip" ref="billing_zip" />
          </div>

          <div>
            <h2>Direct Deposit Info</h2>
            <Input label="Bank Name" ref="billing_name" />
            <Input label="Bank Accout Type" ref="billing_account_type" />
            <Input label="Name on Account" ref="billing_account_name" />
            <Input label="Bank Account Number" ref="billing_account_number" />
          </div>
        </div>
      );
    }
  });
});