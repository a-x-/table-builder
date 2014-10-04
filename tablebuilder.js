module.exports = (function () {
    var
        _ = require('lodash'),
        $ = _.chain,
        statics,
        TableBuilder;

    _.mixin({
        /**
         * Return Element under lodashWrapper for further chaining
         * Also process collections more truly at all:
         * (1,'~{}~') -> '~1~'
         */
        wrapChain: function (element, callback__pattern) {
            var callback = _.isFunction(callback__pattern) && callback__pattern;
            return _.wrap(
                callback || function (el) {
                    var pattern = callback__pattern;
                    return pattern.replace('{}', el);
                },
                function (callback, text) {
                    return callback(text);
                }
            )(element).valueOf();
        },
        tpl: function (string, params) {
            return _.template(string, params, {interpolate: /\{([\S]+?)\}/g});
        }
    });


    statics = {
        buildTag: function (tag, attributes, content) {
            return statics.buildOpenTag(attributes, tag) + content + statics.buildCloseTag(tag);
        },

        buildOpenTag: function (attributes, tag) {
            return _.tpl('<{tag} {attr}>', {
                tag: tag,
                attr: $(attributes).map(function (val, key) {
                    return _.tpl("{key}='{val}'", {key: key, val: statics.htmlEncode(val)});
                }).join(' ')
            });
        },

        buildCloseTag: function (tag) {
            return _.tpl('</{tag}>', {tag: tag});
        },

        /**
         * finds the tbody data and extracts it to an array if we were passed an object,
         * and then iterates the the row data for links
         *
         * @param data mixed
         * @return bool
         */
        isDataCorrect: function (data) {
            return data instanceof Array && (data.length === 0 || _.isPlainObject(data[0]));
        },

        isCellValCorrect: function (celldata) {
            // we only accept strings, or numbers as arguments
            return (_.isString(celldata) && !_.isNumber(celldata));
        },

        prismData: function (rowsCollection, headers, prisms) {
            return rowsCollection
                .map(function (row) {
                    return $(headers)
                        .mapValues(function (headerTitle, columnName) {
                            var cellValue = (prisms[columnName] || _.identity)(row[columnName], row);
//                            if(!statics.isCellValCorrect(cellValue.presentation)){
//                                throw ('each item in a row should be either a string, number')
//                            }
                            return _.isPlainObject(cellValue) ? cellValue : {
                                presentation: cellValue,
                                raw: row[columnName]
                            };
                        })
                        .valueOf();
                })
                .valueOf();
        },

        htmlEncode: function (value) {
            return (value || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        },

        buildBody: function (rowsGroupsCollection, groupValueFn, totalsValueFn) {
            //console.log({rgc:rowsGroupsCollection});
            return $(rowsGroupsCollection).map(function (rowsCollection, groupValue) {
                if (!rowsCollection) {
                    return '';
                }
                return ((groupValue) ? statics.buildTag(
                    'tr',
                    {},
                    statics.buildTag(
                        'td',
                        {
                            class: 'group-name-td',
                            colspan: String(Object.keys(rowsCollection[0]).length)
                        },
                        groupValueFn(groupValue, rowsCollection.length, statics.getTotals(rowsCollection[0], rowsCollection, totalsValueFn).valueOf())
                    )
                ) : '') + $(rowsCollection)
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
                    .valueOf();
            })
                .toArray()
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
            return $(headers).map(
                function (headerContent, headerKey) {
                    return statics.buildTag('th', {'class': headerKey.replace('_', '-') + '-th'}, headerContent);
                }
            )
                .join('')
                .wrapChain(statics.buildTag.bind(this, 'tr', {}))
                .wrapChain(statics.buildTag.bind(this, 'thead', {}))
                .valueOf();
        },

        /**
         *
         */
        buildFooter: function (headers, rowsCollection, totalsFn) {
            return statics.getTotals(headers, rowsCollection, totalsFn)
                .mapValues(function (tdValue) {
                    return _.wrapChain(tdValue, statics.buildTag.bind(this, 'td', {}));
                })
                .toArray()
                .join('')
                .wrapChain(statics.buildTag.bind(this, 'tr', {}))
                .wrapChain(statics.buildTag.bind(this, 'tfoot', {}))
                .valueOf();
        },

        /**
         *
         * @param headers
         * @param rowsCollection
         * @param totalsFnCollection
         */
        getTotals: function (headers, rowsCollection, totalsFnCollection) {
            return $(headers).mapValues(function (nc, columnName) {
                var columnCellsCollection = _(rowsCollection).pluck(columnName).pluck('raw').valueOf();
                return (totalsFnCollection[columnName] || function () {
                    return '';
                })(columnCellsCollection, rowsCollection);
            });
        },

        /**
         *
         * @param data
         * @param groupingField
         * @param unnamedSubstitution
         */
        groupData: function (data, groupingField, unnamedSubstitution) {
            var groupedData = {};
            //console.log(JSON.stringify(data));
            if (groupingField) {
                data.forEach(function (item) {
                    //console.log(item);
                    var group = groupedData[item[groupingField].presentation] || [];
                    group.push(item);
                    groupedData[item[groupingField].presentation] = group;
                    delete item[groupingField];
                });
            } else {
                groupedData[unnamedSubstitution || ''] = data;
            }
            //console.info(JSON.stringify(groupedData, null, 4));
            return groupedData;
        }
    };

    /**
     * @param attributes object
     * example attributes object:
     *
     *  {
     *      'class' : 'table table-striped',
     *      'data-payload' : '#qw-312'
     *  }
     *
     * structured this way so we can more easily add other options in the future without
     * breaking existing implementations
     * @param caption
     */
    TableBuilder = function (attributes, caption) {
        this.attributes = attributes;
        this.headers = null;
        this.data = [];
        this.tableHtml = null;
        this.prisms = {}; // callback pre-processor collection
        this.totals = {}; // callback footer total record processors collections
        this.group = {field: '', fn: _.identity}; // callback data group
        this.caption = caption;
    };

    TableBuilder.prototype.setPrism = function (name, fn__pattern) {
        this.prisms[name] = (function () {
            if (typeof fn__pattern === 'string') {
                var pattern = fn__pattern;
                return function (val) {
                    return _.wrapChain(val, pattern);
                };
            }
            return fn__pattern;
        }()); // get fn
        return this;
    };

    TableBuilder.prototype.setTotal = function (name, fn) {
        this.totals[name] = fn;
        return this;
    };

    /**
     *
     * @param field string
     * @param fn function
     * @return {exports}
     */
    TableBuilder.prototype.setGroup = function (field, fn) {
        this.group.field = field;
        this.group.fn = fn || _.identity;
        return this;
    };

    /**
     * @param headers
     * @return {TableBuilder}
     */
    TableBuilder.prototype.setHeaders = function (headers) {
        this.headers = headers;
        return this;
    };

    /**
     * @param data
     * @returns {TableBuilder}
     */
    TableBuilder.prototype.setData = function (data) {
        if (!data || !data.length) {
            this.data = [];
            this.tbody = '';
            return this;
        }
        if (!statics.isDataCorrect(data)) {
            throw ('invalid format - data expected to be empty, or an array of arrays.');
        }
        if (!this.headers) {
            throw ('invalid format - headers expected to be not empty.');
        }
        this.data = statics.prismData(data, this.headers, this.prisms);
        // group data
        data = statics.groupData(this.data, this.group.field, this.caption);
        if (this.group.field) {
            delete this.headers[this.group.field];
        }
        this.tbody = statics.buildBody(data, this.group.fn, this.totals);
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
        this.thead = statics.buildHeaders(this.headers);
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
