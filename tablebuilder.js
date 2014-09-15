module.exports = (function () {
    var
        _ = require('lodash'),
        $ = _.chain;

    _.mixin({
        /**
         * @Examples
         * [[[1]]] -> 1
         * [[[[]]]] -> undefined
         * [[[],[],[[[1]]]]] -> 1
         * [[[],[],[]]] -> undefined
         */
        flattenExtra: function (collection) {
            var flatten = _.flatten(collection);
            return _.isArray(flatten) && flatten.length <= 1 ? flatten[0] : flatten;
        },
        /**
         * Return Element under lodashWrapper for further chaining
         * Also process collections more truly at all:
         * (1,'~{el}~') -> '~1~'
         */
        wrapChain: function (element, callback) {
            return _.wrap(
                _.isFunction(callback) ? callback : function (el) {
                    return _.template(callback, {el: el}, {interpolate: /{([\S]+?)}/g});
                },
                function (callback, text) {
                    return callback(text);
                }
            )(element)
                .valueOf();
        }
    });

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

        isCellValCorrect: function (celldata) {
            // we only accept strings, or numbers as arguments
            return (util.is_string(celldata) && !util.is_number(celldata));
        },

        prismData: function (rowsCollection, headers, prisms) {
            return rowsCollection
                .map(function (row) {
                    return $(headers)
                        .mapValues(function (headerTitle, columnName) {
                            var cellValue = (prisms[columnName] || _.identity)(row[columnName], row);
//                            if(!statics.isCellValCorrect(cellValue.presentation)){
//                                util.exit('each item in a row should be either a string, number')
//                            }
                            return _.isPlainObject(cellValue) ? cellValue : {presentation: cellValue, raw: row[columnName]};
                        })
                        .valueOf();
                })
                .valueOf();
        },

        htmlEncode: function (value) {
            return (value || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        },

        buildBody: function (rowsCollection) {
            return $(rowsCollection)
                .map(function (row) {
                    return $(row).mapValues(function (cellValue, columnName) {
                        return _.wrapChain(cellValue.presentation, function (cellValue) {
                            return statics.buildTag('td', {'class': columnName.replace('_', '-') + '-td'}, cellValue);
                        });
                    })
                        .toArray()
                        .join('')
                        .valueOf();
                })
                .map(function (tr) {
                    return _.wrapChain(tr, statics.buildTag.bind(this, 'tr', {}));
                })
                .join('\n')
                .wrapChain(statics.buildTag.bind(this, 'tbody', {}))
                .valueOf();
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
                    return statics.buildTag('th', {'class': headerKey.replace('_', '-') + '-th'}, headerContent);
                }
            ).join(''))
                .wrapTag('tr')
                .wrapTag('thead')
                .v; // get the string instead of my $s string wrapper
        },

        /**
         *
         */
        buildFooter: function (headers, rowsCollection, totals) {
            return $(headers)
                .keys() // cells names order array
//                .filter(function (columnName) { return !!totals[columnName]; })
                .map(function (columnName) {
                    var columnCellsCollection = _(rowsCollection).pluck(columnName).pluck('raw').valueOf();
                    return (totals[columnName] || function () {
                        return '';
                    })(columnCellsCollection, rowsCollection);
                })
                .map(function (td) {
                    return _.wrapChain(td, statics.buildTag.bind(this, 'td', {}));
                })
                .join('')
                .wrapChain(statics.buildTag.bind(this, 'tr', {}))
                .wrapChain(statics.buildTag.bind(this, 'tfoot', {}))
                .valueOf();
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
        this.data = [];
        this.tableHtml = null;
        this.prisms = {}; // callback pre-processor collection
        this.totals = {}; // callback footer total record processors collections
    };

    TableBuilder.prototype.setPrism = function (name) {
        if (typeof arguments[1] === 'string') {
            var pattern = arguments[1];
            fn = function (val) {
                return _.wrapChain(val, pattern);
            };
        }
        else {
            fn = arguments[1];
        }
        this.prisms[name] = fn;
        return this;
    };

    TableBuilder.prototype.setTotal = function (name, fn) {
        this.totals[name] = fn;
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
        if (!data || !data.length) {
            this.data = [];
            this.tbody = '';
            return this;
        }
        if (!statics.isDataCorrect(data)) {
            util.exit('invalid format - data expected to be empty, or an array of arrays.');
        }
        if (!this.headers) {
            util.exit('invalid format - headers expected to be not empty.');
        }
        this.data = statics.prismData(data, this.headers, this.prisms);
        this.tbody = statics.buildBody(this.data);
        return this;
    };

    /**
     * Output the built table
     *
     * @return string
     */
    TableBuilder.prototype.render = function () {
        if (!this.data.length) {
            return '';
        }
        this.tfoot = statics.buildFooter(this.headers, this.data, this.totals);
        var guts = this.thead + this.tbody + this.tfoot;

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
