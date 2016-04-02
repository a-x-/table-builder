table-builder
============

Create HTML tables from a specific Javascript object structure.

## Example Data

Each object represents one row in the data array.
```json
[
  { "name":"Larry Wall", "age":57, "link": "<a href='http://www.wall.org/~larry/'>www.wall.org/~larry/</a>" },
  { "name":"Bill Gates", "age":56, "link": "<a href='http://www.microsoft.com'>www.microsoft.com</a>" },
  { "name":"Daffy Duck", "age":75, "link": "" }
]
```
## Getting Started
It works on the Node.js v0.10+, and under browsers via [browserify](//github.com/substack/node-browserify).

Result table cells' order provided by headers order.
Headers filter (remove) not listed fields.

```javascript
var data = {/* see data section above */};
var headers = { "name" : "User name", "age": "User age", "link": "Homepage" };
var TableFabric = require('tablebuilder');
console.log(
  (new TableFabric({'class': 'some-table'}))
    .setHeaders(headers) // see above json headers section
    .setData(data) // see above json data section
    .render()
);
```

Rendered to:
```html
<table class='some-table'>
  <thead> <tr> <th>User name</th> <th>User age</th> <th>Homepage</th> </tr> </thead>
  <tbody>
    <tr>
      <td class="name-td">Larry Wall</td>
      <td class="age-td">57</td>
      <td class="link-td"><a href="http://www.wall.org/~larry/">www.wall.org/~larry/</a></td>
    </tr>
    <tr>
      <td class="name-td">Bill Gates</td>
      <td class="age-td">56</td>
      <td class="link-td"><a href="http://www.microsoft.com">www.microsoft.com</a></td>
    </tr>
    <tr>
      <td class="name-td">Daffy Duck</td>
      <td class="age-td">75</td>
      <td class="link-td"></td>
    </tr>
  </tbody>
</table>
```

#### Prisms
Prism are callbacks-preprocessors for specified fields.

```javascript
var data = [ // Look the previous case differences: link format changed and name splitted into firstname and surname
  { "firstname":"Larry", "surname":"Wall", "age":57, "link": "www.wall.org/~larry/" },
  { "firstname":"Bill", "surname":"Gates", "age":56, "link": "www.microsoft.com" },
  { "firstname":"Daffy", "surname":"Duck", "age":75, "link": "" }
];

(new TableFabric({'class': 'some-table'}))
  .setPrism('link', function (cellData) {
    return cellData && '<a href="http://'+cellData+'">'+cellData+'</a>' || 'N/A';
  })
  .setPrism('name', function (cellData, row) {
    return row.surname + ' ' + row.firstname;
  })
  .setHeaders({ "name": "User name", "age": "User age", "link": "Homepage" })
  .setData(data)
  .render()
```

Render output is equal the previous case.

Also, prism callback may return `{presentation: '...', raw: '...'}` object
for splitting html wrapped cell values and raw values.
For example, raw values uses in [totals](#totals).

#### Totals
See following code:

```js
table.setTotal('age', function (columnCellsCollection, rowsCollection) {
  // Calc average age
  return Math.round(
    columnCellsCollection
      .reduce(function (prev, val) { return +prev + val; })
      / columnCellsCollection.length
  );
});
```

It adds `tfoot` in the table with average age:
```html
<tfoot><tr><td></td><td></td><td>62</td></tr></tfoot>
```

#### Grouping

Grouping fields util (`setGroup`).

```js
// ...
table
  .setGroup('product_category', function (value, recordsCount, totals) {
    // ...
  })
  // ...
  .render();
```

Group removes the field (`product_category`) from the table 
and adds row-separators with the field's values (group names). and referenced items.

Body of the setGroup callback may contains processor of group name. 
Additionaly processor may use the group's `recordsCount` and `totals` collection for group
if `setTotal` for whole table have installed.

If callback is not defined then tableBuilder uses group name without processing, as is.

## Empty data collection

```js
// Show table replacer block if data set is empty
// ...
table
  // ...
  .render()
  || 'Data collection is empty!';
```

## Browsers support

Yeah!

```sh
browserify my-app-using-tableBuilder.js -o bundle.js
```

See more about [browserify](http://browserify.org).

## Similar projects

So, `list.js`.

— Can it make tables?

— [Yeah, it can, but...](https://github.com/javve/list.js/issues/272)

— Ok, my library is more specialised and advanced for tables

## TODO
- unit tests
