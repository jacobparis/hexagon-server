
function onMessage(io, room, msg) {
    const cleanText = sanitizeString(msg);
    // Scrap long messages
    if (cleanText.length > 140) return room;

    // TODO Reimplement dartboard

    let user;
    for (let thisUser of room.users) {
        if (thisUser.id === msg.id) {
            user = thisUser;
        }
    }

    if (!user) {
        // The user that sent this message is not in this room
    }

    // Send the message to everyone else
    io.to(room.name).emit('message', {
        text: cleanText,
        colour: user.colour,
        name: user.name,
    });

    if (room.round.type === "DRAW") {
        if (user.name === room.currentPlayer) {
            // Message came from the current player
            return;
        }

        // Message came from someone else
        // Check to see if it's a guess

        if (!compareWords(cleanText, room.round.word)) return;

        // Guess was correct!
        // Let everyone know

        io.to(room.name).emit('DRAW-wordGuessed', {
            text: room.round.word,
            colour: user.colour,
            name: user.name
        });

        // TODO Add score or record to user

        room.round = {
            type: "PAUSE"
        }
        
        io.to(room.name).emit('roundReady');
        
        return room;
    }
}

function onNameChange(io, room, user, name) {
    const cleanName = sanitizeString(name, 12);

    // Let everyone know you changed your name
    io.to(room.name).emit('nameChange', { 
        newName: cleanName, 
        oldName: user.name, 
        colour: user.colour 
    });

    // Abort if we aren't in the room
    if (!Reflect.has(room.users, user.name)) return room;

    // Store the user in a temporary variable
    room.users[name] = room.users[user.name];
    room.users[name].name = name;

    Reflect.deleteProperty(room.users, user.name);
    const queueIndex = room.playerQueue.indexOf(user.name);
    if (queueIndex) {
        room.playerQueue[queueIndex] = name;
    } else {
        // We are in the room but not queued
        // This should never happen
        room.playerQueue.push(name);
    }

    io.to(room.name).emit('users', room.users);

    return room;
}

function onDisconnect(io, room, user) {
    io.to(room.name).emit('userLeft', {
        name: user.name,
        colour: user.colour
    });

    // Abort if we're not in the room
    if (!Reflect.has(room.users, user.name)) return room;

    // We are in this room
    // Is it our turn?
    if (room.currentPlayer === user.name) {
        // Choose next player
        room.currentPlayer = nextPlayer(room.playerQueue, room.currentPlayer);
        room.round = { type: "PAUSE" };
    }

    Reflect.deleteProperty(room.users, user.name);

    io.to(room.name).emit('users', room.users);

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

module.exports = {
    onMessage: onMessage,
    onDisconnect: onDisconnect,
    onNameChange: onNameChange
};