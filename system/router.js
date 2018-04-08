const handlerFactory = require('./handler');
const parser = require('url');

let handlers = {};

function registerRoutes(routes) {
    handlers = {};

    for (let url in routes) {
        const method = routes[url];
        handlers[url] = handlerFactory.createHandler(method);
    }
}
function route(req) {
    const url = parser.parse(req.url, true);
    const handler = handlers[url.pathname];

    // See if it matches a static route
    if(handler) return handler;
    
    // Check instead for a dynamic route
    for(let routeURL in handlers) {
        if(routeURL.indexOf(":") === -1) continue;
        const trimmedRoute = routeURL.replace(":", "");
        const dynamicHandler = handlers[url.pathname.substring(0, trimmedRoute.length) + ":"];

        if(dynamicHandler) return dynamicHandler;
    }

    return missing(req);
}

function missing(req) {
    console.log("Missing", req.url);
    return handlerFactory.createHandler(function (req, res) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.write("No route registered for " + req.url);
        res.end();
    }); 
}

module.exports = {
    registerRoutes: registerRoutes,
    route: route,
    missing: missing
}