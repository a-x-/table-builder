tableBuilder
============

Create HTML tables from a specific Javascript object structure.

**Since original project**:

1. improved json scheme,
2. added some new features,
3. generally refactored code.

## Example Data

In the data array, each object represents one row.
Cells order in result table set by json headers order. Headers key are equal cells key for coherence reasons.
Planned: cells data may be modify with callback-prisms (instead of json tag descriptors as in original project).


```json
{
  "headers" : { "name" : "User name", "age": "User age", "link": "Homepage" },
  "data"   : [
    { "name":"Larry Wall", "age":57, "link": "<a href='http://www.wall.org/~larry/'>www.wall.org/~larry/</a>" },
    { "name":"Bill Gates", "age":56, "link": "<a href='http://www.microsoft.com'>www.microsoft.com</a>" },
    { "name":"Daffy Duck", "age":75, "link": "" }
  ]
}
```
## Getting Started
It works on the Node.js v0.10.24, but i hope that [browserify](//github.com/substack/node-browserify) make in working under any browser.

```javascript
var json = "..."; // see above data section
var TableFabric = require('tablebuilder');
console.log(
    (new TableFabric({'class': 'some-table'}))
        .setHeaders(headers) // see above json headers section
        .setData(data) // see above json data section
        .render()
);
```

Rendered as:
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
      <td class="link-td">N/A</td>
    </tr>
  </tbody>
</table>
```

#### Prisms
Field prisms are callbacks-preprocessors for specified fields.

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
The follow code:

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

... add `tfoot` in the table with average age:
```html
<tfoot><tr><td></td><td></td><td>62</td></tr></tfoot>
```

#### Grouping

Grouping util (`setGroup`).

```js
// ...
table
    .setGroup('product_category', function (value, recordsCount, totals) {
        // ...
    })
    // ...
    .render();
```

Remove the field (`product_category`) from the table 
and add separators with the field's values (group names). and referenced items.

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

— [Yeah, ut can, but...](https://github.com/javve/list.js/issues/272)

— Ok, my library is more specialised and advanced for tables


## Dependencies
* Lo-Dash.

Look [package.json](/package.json) for actual list.

## TODO

## Licence
All licensed under MIT
