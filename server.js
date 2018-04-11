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
const drawListeners = require('./modules/draw/listeners'); 

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
        Games[room.name] = {
            name: room.name,
            users: {},
            round: { type: "PAUSE" },
            playerQueue: [],
            modules: [ "DRAW" ]
        };
    }

    const user = {
        id: socket.id,
        name: socket.handshake.query.user,
        colour: socket.handshake.query.colour
    };
    
    room = Games[room.name];

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
        room = listeners.requestCard(io, socket, room, {
            "DRAW": () => {
                return drawListeners.onReady(io, socket, room);
            }
        });
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

    
    console.log(room);
    // Tell the other users that we have joined
    io.to(room.name).emit('userJoined', { name: user.name, color: user.colour });
    
    let queueWithColours = [];
    for (let name of room.playerQueue) {
        queueWithColours.push({
            name: name,
            colour: room.users[name].colour
        });
    }

    io.to(room.name).emit('queue-updated', queueWithColours);

    socket.emit('change-player', room.currentPlayer);
    
    if(room.round.type === "PAUSE") return;

    if(room.round.type === "DRAW") {
        // If someone is drawing let me know
        socket.emit('DRAW-someoneIsDrawing', {
            name: room.currentPlayer,
            letters: scrambleWord(room.round.word)
        });

        // Show me what they've drawn so far
        if (room.round.canvas.length) {
            socket.emit('DRAW-drawCanvas', room.round.canvas);
        }

        return;
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


function scrambleWord(word) {
    let letters = word.toLowerCase().replace(/\s/g, '').split('');
    let alphabet = "aaaaaaaabbbccccdddeeeeeeeeeeeffggghhhiiiiiiijklllllmmmnnnnnnooooooopppqrrrrrrrssssstttttttuuuuvwxyyz".split('');

    const numLetters = 14;
    while (letters.length < numLetters) {
        letters.push(alphabet.splice(Math.floor(Math.random() * alphabet.length), 1)[0]);
    }

    shuffleInPlace(letters);
    return letters;
}


function shuffleInPlace(array) {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}



