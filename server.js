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
let cardModules = {
    "DRAW": require('./modules/draw/listeners')
}

const io = require('socket.io')(server, {
    path: '/io',
    serveClient: false
});


let Games = {};

io.sockets.on('connection', socket => {
    let room = {
        name: socket.handshake.query.room
    }

    socket.join(room.name);
    
    // If room doesn't exist, create
    // Eventually this will require authentication
    if(!Reflect.has(Games, room.name)) {
        Games[room.name] = newGame(room.name, cardModules);
    }
    room = Games[room.name];
    
    const user = {
        id: socket.id,
        name: socket.handshake.query.user,
        color: socket.handshake.query.color
    };
    

    if (!Reflect.has(room.users, user.name)) {
        // We are not here, join
        room.users[user.name] = user;
    } else {
        room.users[user.name].id = user.id;
    }

    if (room.playerQueue.indexOf(user.name) === -1) {
        // We are not queued, do so
        room.playerQueue.push(user.name);
    }

    if (!room.currentPlayer) {
        // It is nobody's turn
        room.currentPlayer = room.playerQueue[0];
        
    }

    // Define listeners
    socket.on('message', msg => {
        room = listeners.onMessage(io, room, msg);
    });

    socket.on('disconnect', () => {
        room = listeners.onDisconnect(io, room, user);
    });

    socket.on('end-turn', (user) => {
        room = listeners.endTurn(io, socket, room, user);
    });

    socket.on('request-card', () => {
        const cardModule = cardModules[sample(room.modules)];
        room.round = serveAndSignal(cardModule, io, socket, room);
    });

    
    // Draw listeners
    socket.on('DRAW-draw', (line, clearBuffer) => {
        room = cardModules["DRAW"].onDraw(socket, room, line, clearBuffer);
    });

    socket.on('DRAW-catchUp', () => {
        room = cardModules["DRAW"].onCatchUp(io, room);
    });

    
    // Tell the other users that we have joined
    io.to(room.name).emit('userJoined', { name: user.name, color: user.color });
    
    let queueWithColors = [];
    for (let name of room.playerQueue) {
        queueWithColors.push({
            name: name,
            color: room.users[name].color
        });
    }

    io.to(room.name).emit('queue-updated', queueWithColors);
    socket.emit('change-player', room.currentPlayer);
    
    if(room.round.type === "PAUSE") return;

    // Update me on the game info
    const betaSignal = cardModules[room.round.type].prepareForBeta(room.round);
    socket.emit('beta', betaSignal);
    
    return;
});

function newGame(name, cardModules) {
    return {
        name: name,
        users: { },
        round: { type: "PAUSE" },
        playerQueue: [],
        modules: Object.keys(cardModules)
    };
}

function serveAndSignal(cardModule, io, socket, room) {
    const card = cardModule.serveCard();

    socket.emit('alpha', cardModule.prepareForAlpha(card));
    io.to(room.name).emit('beta', cardModule.prepareForBeta(card));

    return card;
}

/** Utility Functions */
function sample(array) {
    if (!array) return;
    if (array.length === 1) return array[0];

    return array[Math.floor(Math.random() * array.length)]
}



