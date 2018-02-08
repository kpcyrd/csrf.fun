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

    $('form').addEventListener('submit', function(e) {
        e.preventDefault();

        var method = $('method').value;
        var url = $('url').value;
        var withCredentials = $('withCredentials').checked;

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
                log(JSON.stringify(xhr.responseText, null, 4));
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
        xhr.send(null);
    });
});
