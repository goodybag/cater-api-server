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
values to dollar formatted strings. The other `data-out="pennies(val)"` pipes 
the currency formatted string to integers when we talk to the server.

HTML

```
<input name="price" type="number" step="0.01" data-in="dollars" data-out="pennies" value="{{price}}">
```
