var http = require('http');

var server = http.createServer(function on_request(req, res) {
    res.writeHead(200, {
        'content-type': 'text/plain'
    });

    res.end(
        // Edit this text!
        "Hello, world!"
    );
});

server.listen(6003, function (err) {
    if (err) throw err;

    var addr = server.address();
    console.log("Listening on http://" + addr.address + ":" + addr.port + "/");
    console.log();
    console.log("0. Launch `node --debug helloWorldServer.js`");
    console.log("1. Launch `never`");
    console.log("2. Connect to the above address in your web browser");
    console.log("3. Update helloWorldServer.js by changing the response text (\"Hello, world!\")");
    console.log("4. Reload the page in your web browser");
});

