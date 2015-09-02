
/*
* Dynamic list of Contact components
* Props:
*   @contacts (optional) - array of contacts, this will most likely
*                          be input from a backbone model
*/

define(function(require, exports, module) {
  var React = require('react');
  var Contact = require('./contact');
  var isValid = require('../mixins/is-valid');

  module.exports = React.createClass({

    propTypes: {
      contacts: React.PropTypes.array
    },

    mixins: [isValid],

    getInitialState: function () {
      return { contacts: this.props.contacts || [{}] };
    },

    val: function () {
      return this.state.contacts;
    },

    addContact: function (e) {
      e.preventDefault();

      this.setState({
        contacts: this.state.contacts.concat({})
      });
    },

    render: function () {
      var contactList = this.state.contacts.map(function (contact, i) {
        return <Contact ref={"contact-"+i} key={i} contact={contact} />;
      }.bind(this));

      return (
        <div>
          <h2>Contacts</h2>
          {contactList}
          <button onClick={this.addContact}>+ add contact</button>
        </div>
      );
    }
  });
});
