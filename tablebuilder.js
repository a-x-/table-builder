module.exports = (function () {
    var
        _ = require('lodash'),
        $ = _.chain;
    var util, statics, TableBuilder;
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
            throw msg;
        }
    };

    statics = {
        buildTag: function (tag, attributes, content) {
            return statics.buildOpenTag(attributes, tag) + content + statics.buildCloseTag(tag);
        },

        buildOpenTag: function (attributes, tag) {
            return $s('<{1} {2}>').format(
                tag,
                $(attributes).map(function (val, key) {
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

        buildBody: function (rowsCollection, headers, filters) {
            return $s(rowsCollection
                .map(function (row) {
                    return $s(
                        $(headers)
                            .keys() // cells names order array
                            .map(function (cellName) {
                                return statics.buildTag('td', {'class': cellName + '-td'}, statics.buildData(
                                    (filters[cellName] || function (val) {
                                        return val;
                                    })(row[cellName], row) // row[cellName]'s undefined value is normal case!
                                ));
                            })
                            .join('')
                    )
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
         */
        buildHeaders: function (headers) {
            return $s($(headers).map(
                function (headerContent, headerKey) {
                    return $s(headerContent).wrapTagOnce('th');
                }
            ).join(''))
                .wrapTag('tr')
                .wrapTag('thead')
                .v; // get the string instead of my $s string wrapper
        }
    };

    //
    // String wrapper
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
                    $(pattern).forEach(function (replacement, pattern) {
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
     * structured this way so we can more easily add other options in the future without
     * breaking existing implementations
     */
    TableBuilder = function (attributes) {
        this.attributes = attributes;
        this.headers = null;
        this.data = null;
        this.tableHtml = null;
        this.filters = {}; // callback filters collection
    };

    TableBuilder.prototype.setFilter = function (name, fn) {
        this.filters[name] = fn;
        return this;
    };

    /**
     * @param headers
     * @return {TableBuilder}
     */
    TableBuilder.prototype.setHeaders = function (headers) {
        this.headers = headers;
        this.thead = statics.buildHeaders(headers);
        return this;
    };

    /**
     * @param data
     * @return {TableBuilder}
     */
    TableBuilder.prototype.setData = function (data) {
        if (!statics.isDataCorrect(data)) {
            util.exit('invalid format - data expected to be empty, or an array of arrays.');
        }
        if (!this.headers) {
            util.exit('invalid format - headers expected to be not empty.');
        }
        this.tbody = statics.buildBody(data, this.headers, this.filters);
        return this;
    };

    /**
     * Output the built table
     *
     * @return string
     */
    TableBuilder.prototype.render = function () {
        var guts = this.thead + this.tbody;

        // table is already built and the user is requesting it again
        if (this.tableHtml) {
            return this.tableHtml;
        }

        this.tableHtml = statics.buildTag('table', this.attributes, guts);
        return this.tableHtml;
    };
    return TableBuilder;
// tablebuilder.js - erik@pixeloution.com
}());
