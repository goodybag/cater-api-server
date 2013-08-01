# cater-api-server

hacking this together as fast as possible

## routes

* `/users`
  + `/users/:id`
* `/resturants`
  + `/resturants/:id`
    - `/resturants/:id/items`
    - `/resturants/:id/categories`
    - `/resturants/:id/categories/:id`
      * `/resturants/:id/categories/:id/items`
* `/items`
  + `/items/:id`
* `/orders`
  + `/orders/:id`
    - `/orders/:id/items`
