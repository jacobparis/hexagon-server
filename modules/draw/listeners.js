const dictionary = require('./words');

const gameID = "DRAW";

function onDraw(socket, room, line, clearBuffer) {
    // Abort if this message came from someone else
    if(!room.users[room.currentPlayer].id === socket.id) return room;

    // Abort if we're not drawing
    if(room.round.type !== gameID) return room;

    socket.broadcast.to(room.name).emit('DRAW-draw', line, clearBuffer);
    
    // Push the current line to the canvas
    room.round.canvas.push(line);
       
    return room;
}

function onCatchUp(socket, room) {
    // Abort if this message came from someone else
    if (!room.users[room.currentPlayer].id === socket.id) return room;

    // Abort if we're not drawing
    if (room.round.type !== gameID) return room;

    socket.broadcast.to(room.name).emit('DRAW-catchUp');

    return room;
}
/*
function onClearCanvas(socket, room) {
    // Abort if this message came from someone else
    if (!room.users[room.currentPlayer].id === socket.id) return room;

    // Abort if we're not drawing
    if (room.users.round.type !== gameID) return room;

    room.round.canvas = [];

    // TODO emit to users that we should clear the canvas?
    // io.to(room.name).emit('clearCanvas');

    console.log("CLEARED");
    return room;
}
*/

/**
 * Takes no arguments and returns an object containing the information to run this card
 * At minimum requires a type: "TYPE" field so the system knows which module this is
 */
function serveCard() {
    const card = {
        type: gameID,
        word: dictionary.words[Math.floor(Math.random() * dictionary.words.length)],
        color: "cyan",
        canvas: []
    };

    return card;
}

/**
 * Filters a card to only information that will be sent to the current player
 * @param {*} card 
 */
function prepareForAlpha(card) {
    return {
        type: gameID,
        word: card.word,
        color: card.color
    };
}

/**
 * Filters a card to only information that will be sent to other players
 * @param {*} card
 */
function prepareForBeta(card) {
    return {
        type: gameID,
        letters: scrambleWord(card.word),
        color: card.color
    }
}

/**
 * Filters a card to only information that will be sent to spectators
 * @param {*} card
 */
function prepareForGamma(card) {
    return {
        type: gameID,
    }
}

function onReady(io, socket, room) {
    // TODO Possibly change player here?

    //io.to(room.name).emit('DRAW-clearCanvas');

    room.round = serveCard();

    console.log("Ready Round", room);
    
    socket.emit('start-drawing', room.round.word);
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
    //onClearCanvas: onClearCanvas,
    serveCard: serveCard,
    prepareForAlpha: prepareForAlpha,
    prepareForBeta: prepareForBeta,
    prepareForGamma: prepareForGamma,
    onSkip: onSkip
}