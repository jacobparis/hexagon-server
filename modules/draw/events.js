const coreModule = require('../../listeners');

module.exports = {
    "message": onMessage,
    "_DRAW-draw": onDraw,
    //"_DRAW-catchUp": onCatchUp
};

function onMessage(roomObject, msg) {
    const user = getUserFromID(roomObject, msg.user);
    const cleanText = sanitizeString(msg.text);
    
    // Block all guesses by the current player
    if (user.name === roomObject.currentPlayer) return createReducer(roomObject);
    
    // Block all incorrect guesses
    if (!compareWords(cleanText, roomObject.round.word)) return createReducer(roomObject);
    
    console.log(`${user.name}@${roomObject.name} correctly guesses ${cleanText}`);

    return coreModule.endTurn(roomObject);
}

function onDraw(roomObject, line, clearBuffer) {
    const state = createReducer(roomObject);
    const room = state.room;
    const events = state.events;

    state.events.push({to: "blast-others", name: "DRAW-draw", data: [line, clearBuffer]});

    return state;
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

function getUserFromID(roomObject, id) {
    for (const user in roomObject.users) {
        if (roomObject.users[user].id === id) return roomObject.users[user];
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
