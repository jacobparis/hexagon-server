const handlerFactory = require('./handler');
const parser = require('url');

let handlers = {};
let addImage;

function registerRoutes(routes) {
    handlers = {};

    for (const url in routes) {
        if(url.substr(0, 1) === "_") continue;

        const method = routes[url];
        handlers[url] = handlerFactory.createHandler(method);
    }

    addImage = routes._addImage;
}
function route(req) {
    const url = parser.parse(req.url, true);
    const handler = handlers[url.pathname];

    // See if it matches a static route
    if(handler) return handler;
    
    console.log(url.pathname);
    if (addImage && url.pathname.substr(0, 4) === "/img") {
        return handlerFactory.createHandler(addImage(url.pathname.substr(4)));
    }

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