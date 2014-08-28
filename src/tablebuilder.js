module.exports = (function () {
    var util, statics, TableBuilder, $o, $s;
    /**
     * utility functions wrapped in an object for namespacing
     */
    util = {
        // returns false for array, null objects, returns true for {}, new X(), window type objects
        is_object: function (a) {
            return (Object.prototype.toString.call(a) === '[object Array]' || a === null) ? false : typeof a === 'object';
        },
        is_string: function (a) {
            return Object.prototype.toString.call(a) === '[object String]';
        },
        is_number: function (a) {
            return Object.prototype.toString.call(a) === '[object Number]';
        },
        exit: function (msg) {
            console.error(msg);
            throw "[ERROR]";
        }
    };

    statics = {
        buildTag: function (attributes, tag, content) {
            return statics.buildOpenTag(attributes, tag) + content + statics.buildCloseTag(tag);
        },

        buildOpenTag: function (attributes, tag) {
            return $s('<{1} {2}>').format(
                tag,
                $o(attributes).map(function (val, key) {
                    return $s("{1}='{2}'").format(key, statics.htmlEncode(val));
                }).join(' ')
            );
        },

        buildCloseTag: function (tag) {
            return $s('</{1}>').format(tag);
        },

        /**
         * finds the tbody data and extracts it to an array if we were passed an object,
         * and then iterates the the row data for links
         *
         * @param data mixed
         * @return array of arrays
         */
        isDataCorrect: function (data) {
            return data instanceof Array && (data.length === 0 || util.is_object(data[0]));
        },

        buildData: function (celldata) {
            // we only accept strings, or numbers as arguments
            if (!util.is_string(celldata) && !util.is_number(celldata)) {
                util.exit('each item in a row should be either a string, number');
            }
            return celldata;
        },

        htmlEncode: function (value) {
            return (value || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        },

        buildBody: function (rowsCollection, cellsOrder) {
            return $s(rowsCollection
                .map(function (row) {
                    return $s(cellsOrder
                        .map(function (cellName) {
                            return $s(statics.buildData(row[cellName])).wrapTagOnce('td');
                        })
                        .join(''))
                        .wrapTagOnce('tr');
                })
                .join("\n"))
                .wrapTagOnce('tbody');
        },

        /**
         * takes an array of and produces <thead><tr><th> ... </th></tr></thead> with one th
         * for each item of the array
         *
         * @param headers array
         * @param cellsOrder
         */
        buildHeaders: function (headers, cellsOrder) {
            return $s($o(headers).map(
                function (headerContent, headerKey) {
                    cellsOrder.push(headerKey);
                    return $s(headerContent).wrapTagOnce('th');
                }
            ).join(''))
                .wrapTag('tr')
                .wrapTag('thead')
                .v;
        }
    };

    $o = (function () {
        /**
         * $o(object) wrapper
         * @example $o({a:1,b:2}).each(function(el,prop,obj){console.log(el,prop);}); // --> a 1\n b 2
         * @constructor
         */
        var objectProxy = function (o) {
            this.obj = o;
            this.each = function (fn) {
                var index;
                for (index in this.obj) if (this.obj.hasOwnProperty(index)) {
                    fn(this.obj[index], index, this.obj);
                }
                return this;
            }.bind(this);
            this.map = function (fn) {
                var array = [];
                this.each(function (val, key) {
                    array.push(fn(val, key, this.obj));
                }.bind(this));
                return array;
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
        };
        return function (o) {
            return new objectProxy(o);
        };
    }());

    $s = (function () {
        var stringProxy = function (s) {
            var self = this;
            this.v = s;
            /**
             * @param pattern       string|regExp|object
             * @param replacement   string
             * @example $s ('123').replace( {'1': -1, '2':-2, '3':-3} )
             */
            this.replace = function (pattern, /*=*/replacement) {
                var strNew = self.v;
                if (pattern instanceof Object) {
                    $o(pattern).each(function (replacement, pattern) {
                        strNew = strNew.replace(pattern, replacement);
                    });
                }
                return strNew;
            };
            this.match = String.prototype.match.bind(this.v);
            /**
             * wraps a given string inside a given tag
             * put inside the wrapper
             * the tag to wrap the data in, ie, td, tr, etc ...
             *
             * @param tag string
             * @param attributes
             *
             * @return string
             */
            this.wrapTagOnce = function (tag, /*Object=*/attributes) {
                return $s('<{1}>{2}</{1}>').format(tag, this.v);
            }.bind(this);
            this.wrapTag = function () {
                this.v = this.wrapTagOnce.apply(this, arguments);
                return this;
            }.bind(this);
            this.format = function () {
                var args = [].slice.call(arguments);
                args.unshift(null);
                return this.v.replace(/\{(\d+)\}/g, function (match, number) {
                    return args[number] === undefined ? '' : args[number];
                });
            }.bind(this);
        };
        return function (s) {
            return new stringProxy(s);
        };
    }());

    /**
     * @param attributes object
     * example data of options object:
     *
     *  {
     *      'class' : 'table table-striped',
     *      'data-payload' : '#qw-312'
     *  }
     *
     * strutured this way so we can more easily add other options in the future without
     * breaking existing implementations
     */
    TableBuilder = function (attributes) {
        this.attributes = attributes;
        this.headers = null;
        this.tableHtml = null;
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
        if (this.tableHtml) {
            return this.tableHtml;
        }

        this.tableHtml = statics.buildTag(this.attributes, 'table', guts);
        return this.tableHtml;
    };

    TableBuilder.prototype.build = function (headers, data) {
        if (!statics.isDataCorrect(data)) {
            util.exit('invalid format - obj.data expected to be empty, or an array of arrays.');
        }
        this.thead = statics.buildHeaders(headers, this.cellsOrder);
        this.tbody = statics.buildBody(data, this.cellsOrder);
        return this;
    };

    return TableBuilder;
// tablebuilder.js - erik@pixeloution.com
}());
