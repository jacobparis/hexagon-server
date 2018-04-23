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
    handler = router.route(req);
    handler.process([req, res]);
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
    //"DRAWFUL": require('./modules/drawful/drawful')
}


let Games = {};

io.sockets.on('connection', socket => {
    const roomName = socket.handshake.query.room;
    socket.join(roomName);
    
    const room = Games[roomName];
    
    const user = {
        id: socket.id,
        name: socket.handshake.query.user,
        color: socket.handshake.query.color
    };
    
    Object.assign(room, addUserToRoom(room, user));

    const socketRoutes = {
        "room": (name, ...args) => io.in(room.name).emit(name, ...args),
        "others": (name, ...args) => socket.to(room.name).emit(name, ...args),
        "blast-others": (name, ...args) => socket.volatile.to(room.name).emit(name, ...args),
        "me": (name, ...args) => socket.emit(name, ...args)
    };

    // Define listeners
    socket.on('request-card', () => {
        const cardModule = cardModules[sample(room.modules)];
        Object.assign(room.round, cardModule.serveCard(room.sleeve));

        socketRoutes.me('card', cardModule.prepareForAlpha(room.round));
        socketRoutes.others('card', cardModule.prepareForBeta(room.round));
    });

    socket.on('disconnect', () => {
        console.log(`${user.name}@${room.name} has left the game`);
        if (isSocketFromCurrentPlayer(room, socket)) {
            // Delete this room if the last player left
            if(room.playerQueue.length === 1) {
                Reflect.deleteProperty(Games, socket.handshake.query.room);
                return;
            }
            
            // End the turn if it's skippable
            if(room.round.skip) {
                Object.assign(room, reduce(listeners.endTurn(room), socketRoutes));
            }
        }
        
        room.playerQueue = removeFromArray(room.playerQueue, user.name);
        
        socketRoutes.room('userLeft', user.name);
        socketRoutes.room('queue-updated', room.playerQueue);
        
        Reflect.deleteProperty(room.users, user.name);
    });


    const allModules = Object.assign({"CORE": listeners}, cardModules);

    // Poll modules for listeners
    for (const name in allModules) {
        const cardModule = allModules[name];

        if (!cardModule.events) continue;

        for (const e in cardModule.events) {
            const isPrivate = e.split('')[0] === "_";
            const eventName = e.slice(isPrivate);

            socket.on(eventName, (...args) => {
                if (!isCurrentModule(room, name)) return;
                if (isPrivate && !isSocketFromCurrentPlayer(room, socket)) return;

                const reducer = cardModule.events[e](room, ...args);
                Object.assign(room, reduce(reducer, socketRoutes));
                // It's possible we are passing room by value here
                // It doesn't seem to be updating properly
            });
        }
    }
    
    socketRoutes.me('change-player', room.currentPlayer);
    socketRoutes.room('userJoined', { name: user.name, color: user.color });
    socketRoutes.room('queue-updated', room.playerQueue);

    console.log(`${user.name}@${room.name} has joined the game`);
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

function reduce(reducer, handler) {
    if (reducer.events && reducer.events.length) {
        for (const e of reducer.events) {
            if (!Reflect.has(handler, e.to)) continue;

            handler[e.to](e.name, e.data);
        }
    }

    if (reducer.room) {
        return clone(reducer.room);
    }

    return undefined;
}

function addUserToRoom(roomObject, user) {
    const room = Object.assign({}, roomObject);
    if (Reflect.has(room.users, user.name)) {
        room.users[user.name].id = user.id;
    } else {
        room.users[user.name] = user;
    }
    
    if (room.playerQueue.indexOf(user.name) < 0) {
        room.playerQueue.push(user.name);
    }

    if (!room.currentPlayer) {
        room.currentPlayer = room.playerQueue[0];
    }

    return room;
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

function removeFromArray(array, element) {
    const i = array.indexOf(element);
    if (i >= 0) return [...array].splice(i, 1);
    return array;
}

function clone(object) {
    if (Array.isArray(object)) return object.slice(0);

    return Object.assign({}, object);
}