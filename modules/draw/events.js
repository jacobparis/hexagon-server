const coreModule = require('../../listeners');

module.exports = {
    //"message": onMessage,
    "_DRAW-draw": onDraw,
    //"_DRAW-catchUp": onCatchUp
};

function onMessage(roomObject, msg) {
    console.log('draw message');
    const reducer = {
        room: {
            ...roomObject
        },
        events: []
    };

    // TODO Reimplement dartboard

    const user = reducer.room.users.find(u => {
        return u.id === msg.user;
    });

    const cleanText = sanitizeString(msg.text);

    // Block all guesses by the current player
    if (user.name === reducer.room.currentPlayer) return reducer;

    // Block all incorrect guesses
    if (!compareWords(cleanText, reducer.room.round.word)) return reducer;

    const endReducer = coreModule.endTurn(reducer.room);
    reducer.room = endReducer.room;
    reducer.events.concat(endReducer.events);

    return reducer;
}

function onDraw(roomObject, line, clearBuffer) {
    const reducer = {
        room: {...roomObject},
        events: [
            { to: "blast-others", name: "DRAW-draw", data: [line, clearBuffer] }
        ]
    }

    return reducer;
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
