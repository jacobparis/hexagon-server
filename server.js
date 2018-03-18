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

console.log("Holy fuck");

/** Register Websockets */
const listeners = require('./listeners');
const drawListeners = require('./cells/draw/listeners'); 

const io = require('socket.io')(server, {
    path: '/io',
    serveClient: false
});

let Games = {};

io.sockets.on('connection', socket => {
    const roomName = socket.handshake.query.roomName;

    socket.join(roomName);

    // DEBUG
    // If room doesn't exist, create
    // Eventually this will require authentication
    // To allow free users to connect but specific 
    // services to create new rooms
    
    if(!Reflect.has(Games, roomName)) {
        Games[roomName] = {
            name: roomName,
            users: {},
            round: { type: "PAUSE" },
            playerQueue: []
        };
    }

    const user = {
        id: socket.id,
        name: socket.handshake.query.userName,
        colour: socket.handshake.query.userColour
    };
    
    let room = Games[roomName];

    if (!Reflect.has(room.users, user.name)) {
        // We are not here, join
        room.users[user.name] = user;
    }

    if (!room.playerQueue.indexOf(user.name)) {
        // We are not queued, do so
        room.playerQueue.push(user.name);
    }

    // Define listeners
    socket.on('message', msg => {
        room = listeners.onMessage(io, room, msg);
    });

    socket.on('nameChange', (user, name) => {
        room = listeners.onNameChange(io, room, user, name);
    });

    socket.on('disconnect', (user) => {
        room = listeners.onDisconnect(io, room, user);
    });


    // Draw listeners
    socket.on('DRAW-draw', (line, clearBuffer) => {
        room = drawListeners.onDraw(socket, room, line, clearBuffer);
    });

    socket.on('DRAW-catchUp', () => {
        room = drawListeners.onCatchUp(io, room);
    });

    socket.on('DRAW-clearCanvas', () => {
        room = drawListeners.onClearCanvas(io, room);
    });

    socket.on('DRAW-ready', () => {
        room = drawListeners.onReady(io, socket, room);
    });

    socket.on('DRAW-skip', () => {
        room = drawListeners.onSkip(io, socket, room);
    });

    
    // Tell the other users that we have joined
    io.to(roomName).emit('userJoined', { name: user.name, color: user.colour });
    io.to(roomName).emit('users', room.users);

    if(room.round.type === "PAUSE") return;

    if(room.round.type === "DRAW") {
        // If someone is drawing let me know
        socket.emit('DRAW-someoneIsDrawing', {
            name: room.currentPlayer,
        });

        // Show me what they've drawn so far
        if (room.round.canvas.length) {
            socket.emit('DRAW-drawCanvas', room.round.canvas);
        }
    }

});

/** Utility Functions */

function compareWords(variable, control) {
    variable = variable.toLowerCase();
    //Remove spaces from query (allows 'base ball' to match baseball)
    variable = variable.replace(/\s/g, '');
    //Reduce to length of control
    variable = variable.substr(0, control.length);
    return variable === control;
}



