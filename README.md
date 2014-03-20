# cater-api-server

hacking this together as fast as possible

```npm install```

## routes

* `/users`
  + `/users/:id`
* `/restaurants`
  + `/restaurants/:id`
     - `/restaurants/:id/items`
     - `/restaurants/:id/categories`
         * `/restaurants/:id/categories/:id`
              + `/restaurants/:id/categories/:id/items`
* `/items`
  + `/items/:id`
* `/orders`
  + `/orders/:id`
     - `/orders/:id/items`

## Testing

To run the functional test suite, you currently need phantomjs and casperjs installed:

```
brew install phantomjs
brew install casperjs
```

To run the entire suite:

```
casperjs test test/functional
```

Or a single file:

```
casperjs test test/functional/login.js
```

To write your own functional tests, start off with some scaffolding:

```
grunt generate.functional-test:my-test-name
```

This will generate `my-test-name.js` in `test/functional`. You may have multiple tests per file, but keep the file scoped to one task. For instance, if you're testing login, it's ok to test the login functionality of multiple pages. And it's ok to add tests for failing login cases.