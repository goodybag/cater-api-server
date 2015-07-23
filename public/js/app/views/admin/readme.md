item-form.js
---------

> The Item-Form view is so cool it deserves its own readme!

What Item-Form is really good at:

- CRUD on a single model
- Declarative data transformations
- Animated spinner so users know to chill the fuck out
- Error highlighting

__Methods__

* .onSubmit() - Saves this model
* .redirect() - Provide this method to redirect urls upon saving new models
* .onBtnDeleteClick() - Destroys this model

__Events Emitted__ 

* item:destroyed
* item:saved
* item:error

__Example__

The best part of item-form is the ability to transform data easily between
client and the server. 

For example, we save all currency as integers, not *floats*. That would be bad.
Between the client and the server, we need to show our users **$4.50** but persist 
it as **450**.

Here's an example of how we can set this up easily with some data attributes. 
Note that the transformations leverage the `hb-helpers.js` module which 
contains our templating extensions. 

For this transformation we use `data-in="dollars"` to convert the integer 
values to dollar formatted strings. The other `data-out="pennies"` pipes 
the currency formatted string to integers when we talk to the server.

You can also pass arguments to the helpers: `data-out="percentToFactor 4"` but know that the value of the input itself will be used as the last argument.

HTML

```
<input name="price" type="number" step="0.01" data-in="dollars" data-out="pennies" value="{{price}}">
```

## audit-view.js

> Used for creating/deleting audit-style views.

When you come across a situation where you want to take some user input from a form, and create a new object with it adding it to a list and rendering, then use this view. Although it could be generalized further, its primary use-case is audits. A user puts in some reason for some event occurring, and it posts to the collection and re-renders.

__Usage__:

The following example is taken from the Order Internal Notes:

```javascript
var AuditView = require('app/view/audit-view');

var internalNotesView = new AuditView({
  // Audit view needs a collection
  collection: new OrderInternalNotes( order.get('internal_notes'), {
                order_id: order.get('id')
              })

, template:   Handlebars.order_internal_notes
});
```

The template will comprise the bulk of your work. You need to provide the following functionality:

* `form[role="create-form"]` - A form that will serve as the means to collecting data
* `[role="remove"]` - An element that will remove a specific event onClick

The template will receive an array called `items` that will contain the collections models.

See [../../../../partials/order-internal-notes.hbs](../../../../partials/order-internal-notes.hbs) for a template example.