# cater-api-server

hacking this together as fast as possible

```bower install```

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
