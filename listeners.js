module.exports = {
    events: {
        "message": onMessage,
        "_end-turn": endTurn
    }
};

function onMessage(roomObject, msg) {
    const state = createReducer(roomObject);
    
    const room = clone(state.room);

    const user = (() => {
        for(const u in state.room.users) {
            if (state.room.users[u].id === msg.user) return state.room.users[u];
        }
    })();
    
    const cleanText = sanitizeString(msg.text);
    
    const events = clone(state.events);
    events.push({
        to: "room",
        name: "message",
        data: {
            text: cleanText,
            color: user.color,
            name: user.name,
        }
    });
    
    console.log(`${user.name}@${room.name}: ${cleanText}`);
    return {
        room: room,
        events: events
    }
}



function endTurn(roomObject) {
    console.log("END TURN");
    const state = createReducer(roomObject);
    
    const room = clone(state.room);
    room.round = { type: "PAUSE" };

    const events = clone(state.events);
    events.push({ to: "room", name: 'end-turn'});

    return changeNextPlayer({
        room: room,
        events: events
    });
}


function changeNextPlayer(roomObject) {
    const state = createReducer(roomObject);
    
    const room = clone(state.room);
    room.currentPlayer = nextIndex(state.room.playerQueue, state.room.currentPlayer);
    
    const events = clone(state.events);
    events.push({ to: "room", name: 'change-player', data: room.currentPlayer });
    
    console.log(`${room.currentPlayer}@${room.name} begins turn`);
    return {
        room: room,
        events: events
    };
}

function createReducer(object) {
    if(Reflect.has(object, "room") && Reflect.has(object, "events")) {
        return clone(object);
    }

    return {
        room: clone(object),
        events: []
    };
}

function clone(object) {
    if(Array.isArray(object)) return object.slice(0);

    return Object.assign({}, object);
}
/** Utility Functions */

function nextIndex(array, index) {
    const i = array.indexOf(index);
    const nextIndex = (i + 1) % array.length;

    return array[nextIndex];
}

function sanitizeString(string, maxLength) {
    return string.replace(/[^a-z ]/gim, "").trim().substr(maxLength);
}

