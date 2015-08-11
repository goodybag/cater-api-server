define(function (require, exports, module) {
  var React = require('react');

  var Input = require('../components/input');
  var requestMixin = require('../mixins/requests');

  module.exports = React.createClass({
    mixins: [requestMixin],

    getFields: function () {
      return []; // TODO add fields
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
            <Input label="Bank Accout Type" ref="bank_account_type" />
            <Input label="Name on Account" ref="billing_account_name" />
            <Input label="Bank Account Number" ref="billing_account_number" />
          </div>
        </div>
      );
    }
  });
});