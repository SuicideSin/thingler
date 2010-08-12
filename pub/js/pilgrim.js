//
// ~ pilgrim.js ~
//
//   stateful xhr client
//
var pilgrim = (function () {
    //
    // Client
    //
    this.Client = function Client(host, options) {
        if (host && (typeof(host) === 'object')) { options = host, host = null }

        options = options || {};

        this.headers   = options.headers   || {};
        this.extension = options.extension || '';
        this.host      = host ? 'http://' + host.replace('http://', '') : '';
    };
    this.Client.prototype.resource = function (path) {
        return this.path(path + this.extension);
    };
    this.Client.prototype.path = function (path) {
        var that = this;

        return {
            path: function (p) { return that.path([path, p].join('/')) },

            get:  function (data, callback) { this.request('get',    data, callback) },
            put:  function (data, callback) { this.request('put',    data, callback) },
            post: function (data, callback) { this.request('post',   data, callback) },
            del:  function (data, callback) { this.request('delete', data, callback) },
            head: function (data, callback) { this.request('head',   data, callback) },

            request: function (method /* [data], [callback] */) {
                var query = [], args = Array.prototype.slice.call(arguments, 1)
                                            .filter(function (a) { return a });

                var callback = args.pop() || function () {},
                    data     = args.shift();

                path = (that.host + '/' + path).replace('//', '/');

                if (method === 'get' && data) {
                    console.log(data)
                    for (var k in data) {
                        query.push(k + '=' + encodeURIComponent(data[k]));
                    }
                    path += '?' + query.join('&');
                    data = null;
                }
                return new(pilgrim.XHR)
                          (method, path, data, that.headers).send(callback);
            }
        };
    };
    //
    // XHR
    //
    this.XHR = function XHR(method, url, data, headers) {
        this.method = method.toLowerCase();
        this.url    = url;
        this.data   = data || {};

        if (window.XMLHttpRequest) {
            this.xhr = new(XMLHttpRequest);
        } else {
            this.xhr = new(ActiveXObject)("MSXML2.XMLHTTP.3.0");
        }

        this.headers = {
            'X-Requested-With': 'XMLHttpRequest',
            'Accept':           'application/json'
        };
        for (var k in headers) { this.headers[k] = headers[k] }
    };
    this.XHR.prototype.send = function (callback) {
        this.data = JSON.stringify(this.data);

        this.xhr.open(this.method, this.url, true);
        this.xhr.onreadystatechange = function () {
            if (this.readyState != 4) { return }

            var body = this.responseText ? JSON.parse(this.responseText) : {};

            if (this.status >= 200 && this.status < 300) { // Success
                callback(null, body);
            } else {                                       // Error
                callback({ status: this.status, body: body, xhr: this });
            }
        };

        // Set content headers
        if (this.method === 'post' || this.method === 'put') {
            this.headers['Content-Type'] = 'application/json';
        }

        // Set user headers
        for (k in this.headers) {
            this.xhr.setRequestHeader(k, this.headers[k]);
        }

        // Dispatch request
        this.xhr.send(this.method === 'get' ? null : this.data);

        return this;
    };
    return this;
}).call({});
