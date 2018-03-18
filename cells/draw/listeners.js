function onDraw(socket, room, line, clearBuffer) {
    // Abort if this message came from someone else
    if(!room.users[room.currentPlayer].id === socket.id) return room;

    socket.broadcast.to(room.name).emit('DRAW-draw', line, clearBuffer);
    
    // Push the current line to the canvas
    room.round.canvas.push(line);
       
    return room;
}

function onCatchUp(socket, room) {
    // Abort if this message came from someone else
    if (!room.users[room.currentPlayer].id === socket.id) return room;

    socket.broadcast.to(room.name).emit('DRAW-catchUp');

    return room;
}

function onClearCanvas(socket, room) {
    // Abort if this message came from someone else
    if (!room.users[room.currentPlayer].id === socket.id) return room;

    room.round.canvas = [];

    // TODO emit to users that we should clear the canvas?
    // io.to(room.name).emit('clearCanvas');

    return room;
}

function onReady(io, socket, room) {

    // TODO Possibly change player here?

    io.to(room.name).emit('DRAW-clearCanvas');

    room.round = {
        type: "DRAW",
        word: "extracted",
        canvas: []
    };

    socket.emit('startDrawing', room.round.word);
    io.to(room.name).emit('DRAW-someoneIsDrawing', {
        name: room.currentPlayer
    });

    return room;
    // TODO start 2 minute timeout
}

function onSkip(io, socket, room) {
    if (!room.users[room.currentPlayer].id === socket.id) return room;

    io.to(room.name).emit('DRAW-wordNotGuessed', {
        text: room.round.word
    });

    // Choose next player
    room.currentPlayer = nextPlayer(room.playerQueue, room.currentPlayer);
    room.round = { type: "PAUSE" };

    io.to(room.name).emit('roundReady');

    return room;
}

/** Utility Functions */

function nextPlayer(playerQueue, currentPlayer) {
    const index = playerQueue.indexOf(currentPlayer);
    const nextIndex = (index + 1) % playerQueue.length;
    return playerQueue[nextIndex];
}

module.exports = {
    onDraw: onDraw,
    onCatchUp: onCatchUp,
    onClearCanvas: onClearCanvas,
    onReady: onReady,
    onSkip: onSkip
}