
function onMessage(io, room, msg) {
    console.log("Begin Message", msg.user);
    const cleanText = sanitizeString(msg.text);
    // Scrap long messages
    if (cleanText.length > 140) return room;

    // TODO Reimplement dartboard

    let user;
    for (let thisUser in room.users) {
        if (room.users[thisUser].id === msg.user) {
            user = room.users[thisUser];
        }
    }

    if (!user) {
        return room;
        // The user that sent this message is not in this room
    }

    console.log(user.name + ": " + cleanText);
    // Send the message to everyone else
    io.to(room.name).emit('message', {
        text: cleanText,
        color: user.color,
        name: user.name,
    });

    if (room.round.type === "DRAW") {
        if (user.name === room.currentPlayer) {
            // Message came from the current player
            return room;
        }

        // Message came from someone else
        // Check to see if it's a guess

        if (!compareWords(cleanText, room.round.word)) return room;

        // Guess was correct!
        // Let everyone know

        io.to(room.name).emit('DRAW-wordGuessed', {
            text: room.round.word,
            color: user.color,
            name: user.name
        });

        // TODO Add score or record to user

        room.currentPlayer = nextPlayer(room.playerQueue, room.currentPlayer);
        room.round = { type: "PAUSE" };

        io.to(room.name).emit('end-turn');

        let queueWithColors = [];
        for (let name of room.playerQueue) {
            queueWithColors.push({
                name: name,
                color: room.users[name].color
            });
        }

        io.to(room.name).emit('queue-updated', queueWithColors);

        io.to(room.name).emit('change-player', room.currentPlayer);

        return room;
    }
}

function onDisconnect(io, room, user) {
    console.log(user.name + " has left room " + room.name);

    io.to(room.name).emit('userLeft', {
        name: user.name,
        color: user.color
    });

    Reflect.deleteProperty(room.users, user.name);

    // We are in this room
    // Is it our turn?
    if (room.currentPlayer === user.name) {
        // Choose next player

        if(room.playerQueue.length === 1) {
            // This is the only player
            room.currentPlayer = null;
        } else {
            // There are other players
            room.currentPlayer = nextPlayer(room.playerQueue, room.currentPlayer);
        }
        room.round = { type: "PAUSE" };

        io.to(room.name).emit('end-turn');

        io.to(room.name).emit('change-player', room.currentPlayer);
    }

    const positionInQueue = room.playerQueue.indexOf(user.name);
    if (positionInQueue >= 0) {
        // Remove from queue
        room.playerQueue.splice(positionInQueue, 1);
    }

    let queueWithColors = [];
    for (let name of room.playerQueue) {
        queueWithColors.push({
            name: name,
            color: room.users[name].color
        });
    }

    io.to(room.name).emit('queue-updated', queueWithColors);

    return room;
}

function endTurn(io, socket, room, user) {
    if (!room.users[room.currentPlayer]) return room;
    if (!room.users[room.currentPlayer].id === socket.id) return room;
    
    room.round = { type: "PAUSE" };

    io.to(room.name).emit('end-turn');
    
    if (room.playerQueue.indexOf(room.currentPlayer) < 0) {
        room.currentPlayer = room.playerQueue[room.playerQueue.length - 1];
    }

    room.currentPlayer = nextPlayer(room.playerQueue, room.currentPlayer);
    
    let queueWithColors = [];
    for (let name of room.playerQueue) {
        queueWithColors.push({
            name: name,
            color: room.users[name].color
        });
    }

    io.to(room.name).emit('queue-updated', queueWithColors);

    io.to(room.name).emit('change-player', room.currentPlayer);

    return room;
}

/** Utility Functions */

function nextPlayer(playerQueue, currentPlayer) {
    const index = playerQueue.indexOf(currentPlayer);
    const nextIndex = (index + 1) % playerQueue.length;
    return playerQueue[nextIndex];
}

function sanitizeString(string, maxLength) {
    return string.replace(/[^a-z ]/gim, "").trim().substr(maxLength);
}


function compareWords(variable, control) {
    variable = variable.toLowerCase();
    //Remove spaces from query (allows 'base ball' to match baseball)
    variable = variable.replace(/\s|-/g, '');
    control = control.replace(/\s|-/g, '');
    //Reduce to length of control
    variable = variable.substr(0, control.length);
    return variable === control;
}

module.exports = {
    onMessage: onMessage,
    onDisconnect: onDisconnect,
    endTurn: endTurn
};