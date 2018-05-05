const config = require('./config');
const fs = require('fs');
function staticRoute(fileName, mime) {
    return (req, res) => {
        const path = __dirname + config.clientDir + fileName;
        const data = fs.readFileSync(path);

        res.writeHead(200, { 'Content-Type': mime });
        res.write(data);
        res.end();
    }
}

function imageRoute(fileName) {
    return (req, res) => {
        const path = __dirname + config.clientDir + '/img' + fileName;
        const data = fs.readFileSync(path);

        res.writeHead(200, { 'Content-Type': 'image/png' });
        res.write(data);
        res.end();
    }
}

function dynamicRoute(fileName, mime) {
    return (req, res) => {
        const path = __dirname + config.clientDir + fileName;
        const data = fs.readFileSync(path);

        res.writeHead(200, { 'Content-Type': mime });
        res.write(data);
        res.end();
    }
}

module.exports = {
    '/': staticRoute('/index.html', 'text/html'),
    '/room:': staticRoute('/index.html', 'text/html'),
    '/main.css': staticRoute('/main.css', 'text/css'),
    '/main.css.map': staticRoute('/main.css.map', 'application/json'),
    '/main.bundle.js': staticRoute('/main.bundle.js', 'application/javascript'),
    '/main.bundle.js.map': staticRoute('/main.bundle.js.map', 'application/json'),
    '_addImage' : path => imageRoute(path)
};