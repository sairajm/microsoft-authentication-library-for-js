const http = require('http');

const hostname = 'localhost';
const port = 44335;

const server = http.createServer((req, res) => {
    if (req.url === '/') {
        console.log(`Received request: ${req.method} ${req.url}`);
        res.statusCode = 200;
        res.end();
    } else if (req.url === '/signin-oidc') {
        console.log(`Received request: ${req.method} ${req.url}`);
        res.statusCode = 200;
        res.end();
    } else {
        res.statusCode = 404;
        res.end('Not Found\n');
    }
});

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}`);
});