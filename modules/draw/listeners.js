const dictionary = require('./words');

function onDraw(socket, room, line, clearBuffer) {
    console.log('draw');
    // Abort if this message came from someone else
    if(!room.users[room.currentPlayer].id === socket.id) return room;

    // Abort if we're not drawing
    if(room.round.type !== "DRAW") return room;

    socket.broadcast.to(room.name).emit('DRAW-draw', line, clearBuffer);
    
    // Push the current line to the canvas
    room.round.canvas.push(line);
       
    return room;
}

function onCatchUp(socket, room) {
    // Abort if this message came from someone else
    if (!room.users[room.currentPlayer].id === socket.id) return room;

    // Abort if we're not drawing
    if (room.round.type !== "DRAW") return room;

    socket.broadcast.to(room.name).emit('DRAW-catchUp');

    return room;
}

function onClearCanvas(socket, room) {
    // Abort if this message came from someone else
    if (!room.users[room.currentPlayer].id === socket.id) return room;

    // Abort if we're not drawing
    if (room.users.round.type !== "DRAW") return room;

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
        word: dictionary.words[Math.floor(Math.random() * dictionary.words.length)],
        canvas: []
    };

    console.log("Ready Round", room);
    
    socket.emit('startDrawing', room.round.word);
    io.to(room.name).emit('DRAW-someoneIsDrawing', {
        name: room.currentPlayer,
        letters: scrambleWord(room.round.word)
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

function validateRoom(room) {
    if(!room.users[room.currentPlayer]) room.currentPlayer = room.playerQueue[0];
    if (!room.round) room.round = { type: "PAUSE" };
    return room;
}
/** Utility Functions */

function nextPlayer(playerQueue, currentPlayer) {
    const index = playerQueue.indexOf(currentPlayer);
    const nextIndex = (index + 1) % playerQueue.length;
    return playerQueue[nextIndex];
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
module.exports = {
    onDraw: onDraw,
    onCatchUp: onCatchUp,
    onClearCanvas: onClearCanvas,
    onReady: onReady,
    onSkip: onSkip
}