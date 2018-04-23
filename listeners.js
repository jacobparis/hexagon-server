module.exports = {
    events: {
        "message": onMessage,
        "_end-turn": endTurn
    },
    endTurn: endTurn,
    joinRoom: addUserToRoom
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


function addUserToRoom(roomObject, user) {
    const state = createReducer(roomObject);
    const room = clone(state.room);

    if (Reflect.has(room.users, user.name)) {
        console.log(`${user.name}@${room.name} resumes the game`);
        room.users[user.name].id = user.id;
    } else {
        console.log(`${user.name}@${room.name} has joined the game`);

        room.users[user.name] = user;
    }

    if (room.playerQueue.indexOf(user.name) < 0) {
        console.log(`${user.name}@${room.name} jumps on the back of the queue`);
        
        room.playerQueue.push(user.name);
    }
    console.log(`${room.name} QUEUE: ${room.playerQueue}`);
    console.log(`${room.name} CONTROL: ${roomObject.playerQueue}`);

    if (!room.currentPlayer) {
        console.log(`${user.name}@${room.name} is current player by default`);

        room.currentPlayer = room.playerQueue[0];
    }

    const events = clone(state.events);
    events.push({ to: "me", name: 'change-player', data: room.currentPlayer });
    events.push({ to: "room", name: 'userJoined', data: { name: user.name, color: user.color } });
    events.push({
        to: "room", name: 'queue-updated', data: room.playerQueue.map(name => {
            let color = "black";
            if (Reflect.has(room.users, name)) color = room.users[name].color;

            return {
                name: name,
                color: color
            };
        })
    });

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

