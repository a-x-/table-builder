tableBuilder
============

Create HTML tables from a specific Javascript object structure.

**Work in progress**

Since original project changed json scheme.

## Example Data

In the data array, each array represents one row, while and object within the row array represents data to
be wrapped in an HTML tag. In the example below, it wraps the text 'Homepage' in an anchor tag and sets
the href attribute.

Attributes are arbitrary and are not validated, only the `tag` and `content` keys have special meaning.

```json
{ 
  headers : { 'name':'User name', 'age': 'User age', 'homepage': 'Homepage' },
  data    : [
    { name:'Larry Wall', age:57, 'http://www.wall.org/~larry/' },
    { name:'Bill Gates', age:56, 'http://www.microsoft.com' },
    { name:'Daffy Duck', age:75, null }
  ]
}
```
    
##TODO
* Add field filters (callbacks-preprocessors for specified fields).
