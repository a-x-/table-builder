tableBuilder
============

Create HTML tables from a specific Javascript object structure.

## Example Data

In the data array, each array represents one row, while and object within the row array represents data to
be wrapped in an HTML tag. In the example below, it wraps the text 'Homepage' in an anchor tag and sets
the href attribute.

Attributes are arbitrary and are not validated, only the `tag` and `content` keys have special meaning.

    { 
      headers : [ 'name', 'age', 'homepage' ],
      data    : [
        [ 'Larry Wall', 57, { tag : 'a', content : 'Homepage', href : 'http://www.wall.org/~larry/' } ],
        [ 'Bill Gates', 56, { tag : 'a', content : 'Homepage', href : 'http://www.microsoft.com' } ],
        [ 'Daffy Duck', 75, 'No Homepage' ]
      ]
    }