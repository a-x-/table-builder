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
    { "name":"Daffy Duck", "age":75, "link": null }
  ]
}
```
## Using

```javascript
var TableFabric = require('tablebuilder');
console.log(
    (new TableFabric({'class': 'transact-table'}))
        .build(json) // see above
        .write()
);
```

##TODO
* Add field filters (callbacks-preprocessors for specified fields).
