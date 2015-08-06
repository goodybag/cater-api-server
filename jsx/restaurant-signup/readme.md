# Restaurant Signup Component

```js
var restaurant = new Restaurant();
restaurant.url = '/restaurant/join'
<ResaurantSignup model={restaurant} />
```

## Architecture

The restaurant sign up component is composed of list of 'step'
components (one for each step in the signup process), each step
component should contain the following methods:

 - `getFields()` returns a list of refs that correspond to a set of input fields
 - `submitForm(callback)` this included via the `requests` mixin and is used to submit the fields returned from `getFields`. This method will be called from the step's parent component (i.e `RestaurantSignup` ) within a method called `saveAndContinue`.

```
  Restaurant Signup Component
             |
             |
      [List of steps ..]
             |
saveAndContinue <-- getFields <-- submitForm
  |
  |
  --> XHR /api/restaurants/join
```


## Testing

```
npm run test-react
```

open http://localhost:8000/test/unit