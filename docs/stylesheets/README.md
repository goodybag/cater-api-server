Stylesheets
---

> "Uneasy lies the head that wears a crown"

Goodybag uses LESS and Grunt to build css assets.

Currently, there are a few LESS builds that comprise of several LESS
subcomponents:

* less/core-admin.less
* less/core-cater-tool.less
* less/core-goodybag.less
* less/core-ol-greg.less


The [Kitchen Sink](https://www.goodybag.com/admin/kitchen-sink) is Goodybag's
living style guide.

TODO: Where do style sheets get compiled to

### Create component

To create a component, first prototype on the kitchen sink by adding a new
section.

* Modify the kitchen sink index
* Create a new kitchen sink partial
* Import a new LESS file in less/core-admin.less

Once it looks good, import this LESS file into less/core-goodybag.less which
builds into our public facing css.

Legacy Stylesheets
---

From the MVP, the initial stylesheets were written in plain css and overrode
and extended Bootstrap.

These files are located in `public/css/*`.
