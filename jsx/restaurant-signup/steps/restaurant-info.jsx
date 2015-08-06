define(function(require, exports, module) {
  var React = require('react');
  var Input = require('../components/input');
  var CheckBoxList = require('../components/checkbox-list');
  var ContactList = require('../components/contact-list');
  var FileUploader = require('../components/file-uploader');
  var requestMixin = require('../mixins/requests');

  var mealTypeCheckBoxes = [
    { label: 'Breakfast', name: 'breakfast', value: 'breakfast' }
  , { label: 'Lunch', name: 'lunch', value: 'lunch' }
  , { label: 'Dinner', name: 'dinner', value: 'dinner' }
  , { label: 'Appetizers', name: 'appetizers', value: 'appetizers' }
  , { label: 'Dessert', name: 'dessert', value: 'dessert' }
  ];

  var dietCheckBoxes = [
    { label: 'Vegetarian', name: 'vegetarian', value: 'vegetarian' }
  , { label: 'Vegan', name: 'vegan', value: 'vegan' }
  , { label: 'Gluten free', name: 'gluten-free', value: 'gluten-free' }
  , { label: 'Dairy free', name: 'dairy-free', value: 'dairy-free' }
  , { label: 'Halal', name: 'halal', value: 'halal' }
  , { label: 'Kosher', name: 'kosher', value: 'kosher' }
  ];

  var amenityCheckBoxes = [
    { label: 'Napkins', name: 'napkins', value: 'napkins' }
  , { label: 'Utensils', name: 'utensils', value: 'utensils' }
  , { label: 'Plates', name: 'plates', value: 'plates' }
  , { label: 'None of these', name: 'none', value: 'none' }
  ];

  module.exports = React.createClass({
    mixins: [requestMixin],

    getFields: function () {
      return [
        'yelp_url'
      , 'cuisine'
      , 'address'
      , 'phone'
      , 'email'
      , 'menu'
      , 'diet_type'
      , 'meal_type'
      , 'amenities'
      , 'contacts'
      ];
    },

    render: function () {
      return (
        <div>
          <Input label="Yelp URL" ref="yelp_url" />
          <Input label="Cuisine" ref="cuisine" />
          <Input label="Restaurant Address" ref="address" required="true" errorMessage="Please provide an address" />
          <Input label="Restaurant Phone" ref="phone" required="true" errorMessage="Please provide a phone number"/>
          <Input label="Restaurant Email" ref="email" />
          <FileUploader label="Your Menu" ref="menu" errorMessage="Please provide a menu" />
          <CheckBoxList label="Dietary Restrictions" ref="diet_type" checkBoxes={dietCheckBoxes} />
          <CheckBoxList label="Meal Types Offered" ref="meal_type" checkBoxes={mealTypeCheckBoxes} />
          <CheckBoxList label="Which can you include?" ref="amenities" checkBoxes={amenityCheckBoxes} />
          <ContactList ref="contacts" />
        </div>
      );
    }
  });
});
