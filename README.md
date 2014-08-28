tableBuilder
============

Create HTML tables from a specific Javascript object structure.

**Since original project changed json scheme.**

## Example Data

In the data array, each object represents one row.
Cells order in result table set by json headers order. Headers key are equal cells key for coherence reasons.
Planned: cells data may be modify with callback-filters (instead of json tag descriptors as in original project).


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
        .build(headers, data) // see above
        .write()
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

## Filters
Field filters is callbacks-preprocessors for specified fields.

```javascript
var data = [ // Look the previous case differences: link format changed and name splitted into firstname and surname
    { "firstname":"Larry", "surname":"Wall", "age":57, "link": "www.wall.org/~larry/" },
    { "firstname":"Bill", "surname":"Gates", "age":56, "link": "www.microsoft.com" },
    { "firstname":"Daffy", "surname":"Duck", "age":75, "link": "" }
];

(new TableFabric({'class': 'some-table'}))
    .setFilter('link', function (cellData) {
        return cellData && '<a href="http://'+cellData+'">'+cellData+'</a>' || 'N/A';
    })
    .setFilter('name', function (cellData, row) {
        return row.surname + ' ' + row.firstname;
    })
    .build(
        { "name": "User name", "age": "User age", "link": "Homepage" },
        data
     )
    .write()
```

Render output is equal the previous case.

## Dependencies
* Lo-Dash.

Look [package.json](/package.json) for actual list.

## Licence
All licensed under MIT