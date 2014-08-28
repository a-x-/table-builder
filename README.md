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
    { "name":"Larry Wall", "age":57, "link": "http://www.wall.org/~larry/" },
    { "name":"Bill Gates", "age":56, "link": "http://www.microsoft.com" },
    { "name":"Daffy Duck", "age":75, "link": "" }
  ]
}
```
## Getting Started

```javascript
var json = "..."; // see above data section
var TableFabric = require('tablebuilder');
console.log(
    (new TableFabric({'class': 'transact-table'}))
        .build(headers, data) // see above
        .write()
);
```

Rendered as:
```html
<table class='some-table'>
  <thead>
    <tr>
      <th>User name</th> <th>User age</th> <th>Homepage</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Larry Wall</td> <td>57</td>       <td>http://www.wall.org/~larry/</td>
    </tr>
    <tr>
      <td>Bill Gates</td> <td>56</td>       <td>http://www.microsoft.com</td>
    </tr>
    <tr>
      <td>Daffy Duck</td> <td>75</td>       <td></td>
    </tr>
  </tbody>
</table>
```

## Filters
Field filters is callbacks-preprocessors for specified fields.

```javascript
var data = [
    { "firstname":"Larry", "surname":"Wall", "age":57, "link": "www.wall.org/~larry/" },
    { "firstname":"Bill", "surname":"Gates", "age":56, "link": "www.microsoft.com" },
    { "firstname":"Daffy", "surname":"Duck", "age":75, "link": "" }
];

(new TableFabric({'class': 'transact-table'}))
    .setFilter('link', function (cellData) {
        return cellData && '<a href="http://'+cellData+'">'+cellData+'</a>' || 'N/A';
    })
    .setFilter('name', function (cellData, row) {
        return row.surname + ' ' + row.firstname;
    })
    .build(
        { "name" : "User name", "age": "User age", "link": "Homepage" },
        data
     )
    .write()
```