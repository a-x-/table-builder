exports = function () {
    /**
     * wraps a given string inside a given tag
     *
     * @param string tag
     * the tag to wrap the data in, ie, td, tr, etc ...
     *
     * @param string data
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
    var Util = {
        // returns false for array, null objects, returns true for {}, new X(), window type objects
        _is_object: function (a) {
            return (Object.prototype.toString.call(a) === '[object Array]' || a === null) ? false : typeof(a) == 'object';
        },
        _is_string: function (a) {
            return Object.prototype.toString.call(a) == '[object String]';
        },
        _is_number: function (a) {
            return Object.prototype.toString.call(a) == '[object Number]';
        },
        _exit: function (msg) {
            window.console && console.error(msg);
            throw "[ERROR]";
        }
    };

    /**
     * DEPENDENCIES:
     * String.prototype._wrap
     * Util object
     *
     * @param object opts
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
    function tableBuilder(opts) {
        this.opts = opts;
        this.headers = null;
        this.table = null;
    }

    /**
     * outputs the built table
     *
     * @return string
     */
    tableBuilder.prototype.write = function () {
        var guts = this.thead + this.tbody;

        // table is already built and the user is requesting it again
        if (this.table) {
            return this.table;
        }


        if (this.opts.hasOwnProperty('attributes')) {
            this.opts.attributes.tag = 'table';
            this.opts.attributes.content = guts;

            this.table = this._build_tag(this.opts.attributes);
        }
        else {
            this.table = guts._wrap('table');
        }

        return this.table;
    };

    tableBuilder.prototype.build = function (data) {
        // build headers, if they exist
        this.thead = data.hasOwnProperty('headers') ? this._build_headers(data.headers) : null;

        // build body
        this.tbody = this._build_body(this._prepare_data(data));

        return this;
    };

    tableBuilder.prototype._build_body = function (rowdata) {
        var rows = [], row;

        for (var i = 0; i < rowdata.length; i++) {
            row = '';
            for (var j = 0; j < rowdata[i].length; j++) {
                row += this._build_data(rowdata[i][j]).toString()._wrap('td');
            }
            rows.push(row._wrap('tr'));
        }

        return rows.join("\n")._wrap('tbody');
    };


    tableBuilder.prototype._build_data = function (celldata) {
        // we only accept objects, strings, or numbers as arguments
        if (!Util._is_object(celldata) && !Util._is_string(celldata) && !Util._is_number(celldata)) {
            Util._exit('each item in a row should be either a string, number, or array');
        }

        // If its not an object, its just a value to be used -- return it
        if (!(celldata instanceof Object)) {
            return celldata;
        }

        // going to cheat a little here and use jQuery to build this out
        var content = celldata.content
            , tag = celldata.tag
            , data;

        return this._build_tag(celldata);
    };

    tableBuilder.prototype._build_tag = function (c) {
        return this._build_open_tag(c) + c.content + this._build_close_tag(c.tag);
    };
    tableBuilder.prototype._build_open_tag = function (c) {
        var attribs = [], tag = "<" + c.tag;

        for (var key in c) {
            if (c.hasOwnProperty(key) && key !== 'tag' && key !== 'content') {
                attribs.push(key + "='" + this._htmlEncode(c[key]) + "'");
            }
        }

        if (!attribs.length) {
            return tag + ">";
        }
        else {
            return tag + " " + attribs.join(' ') + ">";
        }
        // return "<" + c.tag + attribs.length ? ' ' + attribs.join(' ') : '' + ">";;
    };
    tableBuilder.prototype._build_close_tag = function (tag) {
        return "</" + tag + ">";
    };


    /**
     * finds the tbody data and extracts it to an array if we were passed an object,
     * and then iterates the the row data for links
     *
     * @param mixed data
     * @return array of arrays
     */
    tableBuilder.prototype._prepare_data = function (obj) {
        if (!Util._is_object(obj) || !obj.hasOwnProperty('data')) {
            Util._exit('invalid data format - object should have a "data" property');
        }

        if (!(obj.data instanceof Array) ||
            (!(obj.data[0] instanceof Array) && obj.data.length !== 0)) {
            Util._exit('invalid format - obj.data expected to be empty, or an array of arrays.');
        }

        return obj.data;
    };

    /**
     * takes an array of and produces <thead><tr><th> ... </th></tr></thead> with one th
     * for each item of the array
     *
     * @param array headers
     */
    tableBuilder.prototype._build_headers = function (headers) {
        var spool = '';
        for (var i = 0; i < headers.length; i++) {
            spool += headers[i].toString()._wrap('th');
        }
        return spool._wrap('tr')._wrap('thead');
    };

    tableBuilder.prototype._htmlEncode = function (value) {
        if (value) {
//            return jQuery('<div />').text(value).html().replace(/"/g, '&quot;').replace(/'/g, '&#39;');
            return value.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        } else {
            return '';
        }
    };

    return tableBuilder;

// tablebuilder.js - erik@pixeloution.com
}();
