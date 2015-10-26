(function (namespace) {
    var PREFIX = 'BEGIN:VCARD',
        POSTFIX = 'END:VCARD';

    /**
     * Return json representation of vCard
     * @param {string} string raw vCard
     * @returns {*}
     */
    function parse(string) {
        var result = {},
            lines = string.split(/\r\n|\r|\n/),
            count = lines.length,
            pieces,
            key,
            value,
            meta,
            namespace;

        for (var i = 0; i < count; i++) {
            if (lines[i] == '') {
                continue;
            }
            if (lines[i].toUpperCase() == PREFIX || lines[i].toUpperCase() == POSTFIX) {
                continue;
            }
            pieces = lines[i].split(':');
            key = pieces.shift();
            value = pieces.join(':');
            namespace = false;
            meta = {};

            /**
             * Check that next line continues current
             * @param {number} i
             * @returns {boolean}
             */
            var isValueContinued = function (i) {
                return i + 1 < count && (lines[i + 1][0] == ' ' || lines[i + 1][0] == '\t');
            };
            // handle multiline properties (i.e. photo).
            // next line should start with space or tab character
            if (isValueContinued(i)) {
                while (isValueContinued(i)) {
                    value += lines[i + 1].trim();
                    i++;
                }
            }

            // meta fields in property
            if (key.match(/;/)) {
                key = key
                    .replace(/\\;/g, 'ΩΩΩ')
                    .replace(/\\,/, ',');
                var metaArr = key.split(';').map(function (item) {
                    return item.replace(/ΩΩΩ/g, ';');
                });
                key = metaArr.shift();
                metaArr.forEach(function (item) {
                    var arr = item.split('=');
                    arr[0] = arr[0].toLowerCase();
                    if (meta[arr[0]]) {
                        meta[arr[0]].push(arr[1]);
                    } else {
                        meta[arr[0]] = [arr[1]];
                    }
                });
            }

            // values with \n
            value = value
                .replace(/\\n/g, '\n')
                .replace(/\\,/g, ',');

            // semicolon-separated values
            if (value.match(/;/)) {
                value = value.replace(/\\;/g, 'ΩΩΩ'); // easiest way, replace it with really rare character sequence
                if (value.match(/;/)) {
                    value = value.split(';');

                    value = value.map(function (item) {
                        return item.replace(/ΩΩΩ/g, ';');
                    });
                } else {
                    value = value.replace(/ΩΩΩ/g, ';');
                }
            }

            // Grouped properties
            if (key.match(/\./)) {
                var arr = key.split('.');
                key = arr[1];
                namespace = arr[0];
            }

            var newValue = {
                value: value
            };
            if (Object.keys(meta).length) {
                newValue.meta = meta;
            }
            if (namespace) {
                newValue.namespace = namespace;
            }

            if (key.indexOf('X-') !== 0) {
                key = key.toLowerCase();
            }

            if (typeof result[key] === 'undefined') {
                result[key] = [newValue];
            } else {
                result[key].push(newValue);
            }

        }

        return result;
    }

    var guid = (function() {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }
        return function() {
            return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
                s4() + '-' + s4() + s4() + s4();
        };
    })();

    /**
     * Generate vCard representation af object
     * @param {*} data
     * @param {boolean=} addRequired determine if generator should add required properties (version and uid)
     * @returns {string}
     */
    function generate(data, addRequired) {
        var lines = [PREFIX],
            line = '';

        if (addRequired && !data.version) {
            data.version = [{value: '3.0'}];
        }
        if (addRequired && !data.uid) {
            data.uid = [{value: guid()}];
        }

        var escapeCharacters = function (v) {
            return v
                .replace(/\n/g, '\\n')
                .replace(/;/g, '\\;')
                .replace(/,/g, '\\,')
        };

        Object.keys(data).forEach(function (key) {
            if (!data[key] || typeof data[key].forEach !== 'function') {
                return;
            }
            data[key].forEach(function (value) {
                // ignore empty values
                if (typeof value.value === 'undefined' || value.value == '') {
                    return;
                }
                // ignore empty array values
                if (value.value instanceof Array) {
                    var empty = true;
                    for (var i = 0; i < value.value.length; i++) {
                        if (typeof value.value[i] !== 'undefined' && value.value[i] != '') {
                            empty = false;
                            break;
                        }
                    }
                    if (empty) {
                        return;
                    }
                }
                line = '';

                // add namespace if exists
                if (value.namespace) {
                    line += value.namespace + '.';
                }
                line += key.indexOf('X-') === 0 ? key : key.toUpperCase();

                // add meta properties
                if (typeof value.meta === 'object') {
                    Object.keys(value.meta).forEach(function (metaKey) {
                        // values of meta tags must be an array
                        if (typeof value.meta[metaKey].forEach !== 'function') {
                            return;
                        }
                        value.meta[metaKey].forEach(function (metaValue) {
                            line += ';' + escapeCharacters(metaKey.toUpperCase()) + '=' + escapeCharacters(metaValue);
                        });
                    });
                }

                line += ':';



                if (typeof value.value === 'string') {
                    line += escapeCharacters(value.value);
                } else {
                    // complex values
                    value.value = value.value.map(function (item) {
                        return escapeCharacters(item);
                    });
                    line += value.value.join(';');
                }

                // line-length limit. Content lines
                // SHOULD be folded to a maximum width of 75 octets, excluding the line break.
                if (line.length > 75) {
                    var firstChunk = line.substr(0, 75),
                        least = line.substr(75);
                    var splitted = least.match(/.{1,74}/g);
                    lines.push(firstChunk);
                    splitted.forEach(function (chunk) {
                        lines.push(' ' + chunk);
                    });
                } else {
                    lines.push(line);
                }
            });
        });

        lines.push(POSTFIX);
        return lines.join('\r\n');
    }

    namespace.vCard = {
        parse: parse,
        generate: generate
    };
})(typeof window !== 'undefined' ? window : module.exports);
