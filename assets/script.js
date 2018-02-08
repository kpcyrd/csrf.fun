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

        log(`[*] ${method} ${url}`, xhr);

        var xhr = new XMLHttpRequest();
        xhr.addEventListener('readystatechange', function(e) {
            if(xhr.readyState == 1) {
                log(`[+] opened`, xhr);
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

        var code = uglify(csrf);

        var cfg = generateConfig();
        var payload = JSON.stringify(cfg, null, 4);

        var fileContent = '<script>\n(' + code + ')(' + payload + ', function(x) {\n    alert(x);\n});\n</script>\n';
        log(fileContent, cfg);

        $('export').setAttribute('href', 'data:text/html;charset=utf-8,' + encodeURIComponent(fileContent));
        $('export').setAttribute('download', generateFilename(cfg.url));
    });
});
