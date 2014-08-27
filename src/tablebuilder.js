module.exports = function () {
    String.prototype._format = function () {
        var args = [].slice.call(arguments);
        args.unshift(null);
        return this.replace(/\{(\d+)\}/g, function (match, number) {
            return args[number] === undefined ? '' : args[number];
        });
    };
    /**
     * wraps a given string inside a given tag
     *
     * @param tag string
     * the tag to wrap the data in, ie, td, tr, etc ...
     *
     * put inside the wrapper
     *
     * @return string
     */
    String.prototype._wrap = function (tag) {
        return '<' + tag + '>' + this + '</' + tag + '>';
    };

    /**
     * utility functions wrapped in an object for namespacing
     */
    var util = {
        // returns false for array, null objects, returns true for {}, new X(), window type objects
        is_object: function (a) {
            return (Object.prototype.toString.call(a) === '[object Array]' || a === null) ? false : typeof(a) == 'object';
        },
        is_string: function (a) {
            return Object.prototype.toString.call(a) == '[object String]';
        },
        is_number: function (a) {
            return Object.prototype.toString.call(a) == '[object Number]';
        },
        exit: function (msg) {
            console.error(msg);
            throw "[ERROR]";
        }
    };

    /**
     * forEach analogy for Objects
     * @param fn
     * @example each({1:1,2:2},function(v,i,a){console.log(v,i,a,'!!!');})
     */
    var oEach, each = Function.prototype.call.bind(oEach = function (context_fn, fn) {
        var context;
        if (arguments.length === 1) {
            fn = context_fn;
        } else if (arguments.length === 2) {
            context = context_fn;
        } else {
            throw 'Too much arguments;';
        }
        // 'this' is given object
        for (var index in this) {
            if (this.hasOwnProperty(index)) {
                var value = this[index],
                    array = this;
                fn.call(context || this, value, index, array);
            }
        }
        return this;
    });

    /**
     * $o(object) wrapper
     * @example $o({a:1,b:2}).each(function(el,prop,obj){console.log(el,prop);}); // --> a 1\n b 2
     * @param o object - wrapped object
     * @constructor
     */
    var ObjectProxy = function (o) {
        this.obj = o;
        //
        // Wrapper methods
        this.each = function (fn) {
            (oEach.bind(this.obj))(fn);
            return this;
        }.bind(this);
        this.copy = function () {
            return Object.create(this.obj);
        }.bind(this);
        this.copyDeep = function clone() {
            var obj = this.obj;
            if (obj === null || typeof(obj) !== 'object') {
                return obj;
            }
            var temp = obj.constructor(); // changed
            this.each(function (el, key) {
                temp[key] = $o(obj[key]).copyDeep();
            });
            return temp;
        }.bind(this);
        // put another methods here ...
    }, ObjectProxyConstruct = function (o) {
        return new ObjectProxy(o);
    }, $o = ObjectProxyConstruct;

    /**
     * DEPENDENCIES:
     * String.prototype._wrap
     * Util object
     *
     * @param opts object
     * example data of options object:
     *
     *  {
     *    attributes : {
     *      'class' : 'table table-striped',
     *      'cellpadding' : 8
     *    }
     *  }
     *
     * strutured this way so we can more easily add other options in the future without
     * breaking existing implementations
     */
    var TableBuilder = function (opts) {
        this.attributes = opts;
        this.headers = null;
        this.table = null;
        this.cellsOrder = [];
    };

    /**
     * outputs the built table
     *
     * @return string
     */
    TableBuilder.prototype.write = function () {
        var guts = this.thead + this.tbody;

        // table is already built and the user is requesting it again
        if (this.table) {
            return this.table;
        }


//        if (this.attributes.hasOwnProperty('attributes')) {
//            this.attributes.attributes.tag = 'table';
//            this.attributes.attributes.content = guts;

        this.table = this._build_tag(this.attributes, 'table', guts);
//        }
//        else {
//            this.table = guts._wrap('table');
//        }

        return this.table;
    };

    TableBuilder.prototype.build = function (data) {
        // build headers, if they exist
        this.thead = data.hasOwnProperty('headers') ? this._build_headers(data.headers) : null;

        // build body
        this.tbody = this._build_body(this._prepare_data(data));

        return this;
    };

    TableBuilder.prototype._build_body = function (rowsCollection) {
        var rowsLines = [], rowLine = '';
        rowsCollection.forEach(function (row) {
            this.cellsOrder.forEach(function (cellName) {
                rowLine += this._build_data(row[cellName]).toString()._wrap('td');
            }.bind(this));
            rowsLines.push(rowLine._wrap('tr'));
        }.bind(this));
        return rowsLines.join("\n")._wrap('tbody');
    };

    TableBuilder.prototype._build_data = function (celldata) {
        // we only accept strings, or numbers as arguments
        if (!util.is_string(celldata) && !util.is_number(celldata)) {
            util.exit('each item in a row should be either a string, number');
        }
        return celldata;
    };

    TableBuilder.prototype._build_tag = function (attributes, tag, content) {
        // todo add filter callback call point
        return this._build_open_tag(attributes, tag) + content + this._build_close_tag(tag);
    };

    TableBuilder.prototype._build_open_tag = function (attributes, tag) {
        var attributesLine = '';

        $o(attributes).each(function (val, key) {
            attributesLine += (" {1}='{2}'"._format(key, this._htmlEncode(val)));
        }.bind(this));

        return '<{1}{2}>'._format(tag, attributesLine);
    };

    TableBuilder.prototype._build_close_tag = function (tag) {
        return "</{1}>"._format(tag);
    };


    /**
     * finds the tbody data and extracts it to an array if we were passed an object,
     * and then iterates the the row data for links
     *
     * @param obj mixed
     * @return array of arrays
     */
    TableBuilder.prototype._prepare_data = function (obj) {
        if (!util.is_object(obj) || !obj.hasOwnProperty('data')) {
            util.exit('invalid data format - object should have a "data" property');
        }

        if (!(obj.data instanceof Array) ||
            (obj.data.length > 0 && !util.is_object(obj.data[0]))) {
            util.exit('invalid format - obj.data expected to be empty, or an array of arrays.');
        }

        return obj.data;
    };

    /**
     * takes an array of and produces <thead><tr><th> ... </th></tr></thead> with one th
     * for each item of the array
     *
     * @param headers array
     */
    TableBuilder.prototype._build_headers = function (headers) {
        var spool = '';
        $o(headers).each(function (headerContent, headerKey) {
            spool += headerContent._wrap('th');
            this.cellsOrder.push(headerKey);
        }.bind(this));
        return spool._wrap('tr')._wrap('thead');
    };

    TableBuilder.prototype._htmlEncode = function (value) {
        if (value) {
//            return jQuery('<div />').text(value).html().replace(/"/g, '&quot;').replace(/'/g, '&#39;');
            return value.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        } else {
            return '';
        }
    };

    return TableBuilder;

// tablebuilder.js - erik@pixeloution.com
}();
