/** Register Routes 
 *  ---------------
 *  This is a standard deck of routes
 *  Modify this file to include custom rules
 */
const router = require('./system/router')
const routes = require('./routes.js');

router.registerRoutes(routes);

/** Define Server */
const http = require('http');
const server = http.createServer((req, res) => {
    // Set CORS headers
    const handler = router.route(req); +    // Set CORS headers
    handler.process([req, res]);
    
    var allowedOrigins = [
        'http://firecup.jacobpariseau.com', 
        'http://firedraw.ca'
    ];

    var origin = req.headers.origin;
    console.log("TESTING ORIGIN", origin);
    
    if (allowedOrigins.indexOf(origin) > -1) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
});
server.listen(8000);

/** Register Websockets */
const listeners = require('./listeners');

const io = require('socket.io')(server, {
    path: '/io',
    serveClient: false
});

const cardModules = {
    "DRAW": require('./modules/draw/draw'),
    "DRAWFUL": require('./modules/drawful/drawful'),
    "SOCIABLES": require('./modules/sociables/sociables'),
}


let Games = {};

io.sockets.on('connection', socket => {
    const roomName = socket.handshake.query.room;
    socket.join(roomName);
    
    // If room doesn't exist, create
    // Eventually this will require authentication
    if (!Reflect.has(Games, roomName)) {
        const modules = (() => {
            switch(socket.handshake.query.game) {
                case "firecup": {
                    return {
                        "SOCIABLES": cardModules.SOCIABLES
                    };
                }
                case "firedraw": {
                    return {
                        "DRAW": cardModules.DRAW,
                        "DRAWFUL": cardModules.DRAWFUL
                    }
                }
                default: return {};
            }
        })();

        Games[roomName] = newGame(roomName, modules);
        console.log(`${roomName} has been created. Hello!`);
    }
    
    const room = Games[roomName];
    const user = {
        id: socket.id,
        name: socket.handshake.query.user,
        color: socket.handshake.query.color
    };
    
    
    const socketRoutes = {
        "room": (name, ...args) => io.in(room.name).emit(name, ...args),
        "others": (name, ...args) => socket.to(room.name).emit(name, ...args),
        "blast-others": (name, ...args) => socket.volatile.to(room.name).emit(name, ...args),
        "me": (name, ...args) => socket.emit(name, ...args)
    };
    
    // Define listeners
    socket.on('request-card', () => {
        const cardModule = cardModules[sample(room.modules)];
        Object.assign(room.round, cardModule.serveCard(room));
        
        socketRoutes.me('card', cardModule.prepareForAlpha(room));
        socketRoutes.others('card', cardModule.prepareForBeta(room));
    });
    
    socket.on('disconnect', () => {
        const reducer = onDisconnect(room);

        if(!Reflect.has(Games, socket.handshake.query.room)) return;
        
        mergeState(room, onDisconnect(room), socketRoutes);
        Reflect.deleteProperty(room.users, user.name);
    });
    
    
    const allModules = Object.assign({"CORE": listeners}, cardModules);
    loadModules(allModules);
    
    mergeState(room, listeners.joinRoom(room, user), socketRoutes);

    /**
     * Fire when a user disconnects
     * If all the players leave, kill the game
     * @param {*} roomObject 
     */
    function onDisconnect(roomObject) {
        const user = getUserFromID(roomObject, socket.id);

        console.log(`${roomObject.name} QUEUE: ${roomObject.playerQueue}`);
        console.log(`${user.name}@${roomObject.name} has left the game`);

        let initReducer = createReducer;
        if (isSocketFromCurrentPlayer(roomObject, socket)) {
            if (roomObject.playerQueue.length === 1) {
                console.log(`${roomObject.name} has been abandoned. Goodbye!`);
                Reflect.deleteProperty(Games, socket.handshake.query.room);
                return;
            }

            initReducer = listeners.endTurn;
        }

        const state = initReducer(roomObject);
        const room = clone(state.room);

        room.playerQueue = removeFromArray(room.playerQueue, user.name);
        console.log(`${room.name} QUEUE: ${room.playerQueue}`);
        console.log(`${room.name} CONTROL: ${roomObject.playerQueue}`);

        const queueWithColors = room.playerQueue.map(name => {
            let color = "black";
            if (Reflect.has(room.users, name)) color = room.users[name].color;

            return {
                name: name,
                color: color
            };
        });

        const events = clone(state.events);
        events.push({ to: "room", name: "userLeft", data: user.name });
        events.push({ to: "room", name: 'queue-updated', data: queueWithColors });

        return { 
            room: room,
            events: events 
        };
    }



    function loadModules(modules) {
        // Poll modules for listeners
        for (const name in modules) {
            const cardModule = modules[name];

            if (!cardModule.events) continue;

            for (const e in cardModule.events) {
                const isPrivate = e.split('')[0] === "_";
                const eventName = e.slice(isPrivate);

                socket.on(eventName, (...args) => {
                    if (!isCurrentModule(room, name)) return;
                    if (isPrivate && !isSocketFromCurrentPlayer(room, socket)) return;

                    const reducer = cardModule.events[e](room, ...args);
                    mergeState(room, reducer, socketRoutes);
                    // It's possible we are passing room by value here
                    // It doesn't seem to be updating properly
                });
            }
        }
    }


});

function isCurrentModule(room, name) {
    if(name === "CORE") return true;

    return room.round.type === name;
}

function isSocketFromCurrentPlayer(room, socket) {
    if (!Reflect.has(room.users, room.currentPlayer)) {
        console.log("This socket is orphaned and should be removed");
        return false;
    }
    
    return room.users[room.currentPlayer].id === socket.id;
}

function getUserFromID(roomObject, id) {
    for (const user in roomObject.users) {
        if (roomObject.users[user].id === id) return roomObject.users[user];
    }
}

function mergeState(state, reducer, handler) {
    if (reducer.events && reducer.events.length) {
        for (const e of reducer.events) {
            if (!Reflect.has(handler, e.to)) continue;

            handler[e.to](e.name, e.data);
        }
    }

    if (reducer.room) {
        Object.assign(state, clone(reducer.room));
    }
}


function createReducer(object) {
    if (Reflect.has(object, "room") && Reflect.has(object, "events")) {
        return clone(object);
    }

    return {
        room: clone(object),
        events: []
    };
}

function clone(object) {
    if (Array.isArray(object)) return object.slice(0);

    return Object.assign({}, object);
}

function newGame(name, cardModules) {
    return {
        name: name,
        users: { },
        round: { type: "PAUSE" },
        playerQueue: [],
        sleeve: [],
        modules: Object.keys(cardModules)
    };
}

/** Utility Functions */
function sample(array) {
    if (!array) return;
    if (array.length === 1) return array[0];

    return array[Math.floor(Math.random() * array.length)]
}

function removeFromArray(arrayObject, element) {
    const array = clone(arrayObject);
    const i = array.indexOf(element);
    if (i >= 0) array.splice(i, 1);
    return array;
}
