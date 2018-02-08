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

    var form = document.forms.form;
    $('form').addEventListener('submit', function(e) {
        e.preventDefault();

        var method = form['method'].value;
        var url = form['url'].value;
        var withCredentials = form['withCredentials'].checked;

        var body = null;
        var contentType = '';

        if (hasBody.checked) {
            contentType = form['content-type'].value;
            body = form['body'].value;
        }

        log(`[*] ${method} ${url}`, xhr);

        var xhr = new XMLHttpRequest();
        xhr.addEventListener('readystatechange', function(e) {
            if(xhr.readyState == 1) {
                log(`[+] opened`, xhr);
            } else if(xhr.readyState == 2) {
                log(`[+] headers received: ${xhr.status} ${xhr.statusText}`, xhr);
            } else if(xhr.readyState == 3) {
                log(`[+] loading: ${xhr.status} ${xhr.statusText}`, xhr);
            } else { // 4
                log(`[+] done: ${xhr.status} ${xhr.statusText}`, xhr);

                var response = xhr.responseText;

                try {
                    response = JSON.parse(response);
                } catch {
                    // ignore
                }

                log(JSON.stringify(response, null, 4));
            }
        });

        xhr.addEventListener('error', function(e) {
            log(`[!] error: ${e}`, e);
        });

        xhr.addEventListener('abort', function(e) {
            log(e);
        });

        xhr.open(method, url, true);
        xhr.withCredentials = withCredentials;
        if(contentType) {
            xhr.setRequestHeader('Content-Type', contentType);
        }
        xhr.send(body);
    });

    $('export').addEventListener('click', function(e) {
        e.preventDefault();

        if(!form.reportValidity()) {
            return;
        }

        alert('unimplemented, sry');
    });
});
