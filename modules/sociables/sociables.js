const data = require('./data');
const gameID = "SOCIABLES";

module.exports = {
    ID: gameID,
    serveCard: serveCard,
    prepareForAlpha: prepareForAlpha,
    prepareForBeta: prepareForBeta,
    prepareForGamma: prepareForGamma,
}

/**
 * Takes no arguments and returns an object containing the information to run this card
 * At minimum requires a type: "TYPE" field so the system knows which module this is
 */
function serveCard(room) {
    const cardData = sample(data.cards);

    const card = {
        type: gameID,
        color: "red",
        data: {
            title: cardData.title,
            body: parse(cardData.body, cardData.random, { currentPlayer: room.currentPlayer, players: room.playerQueue }),
            footer: cardData.type.toUpperCase()
        },
        public: cardData.public
    };


    return card;
}

/**
 * Filters a card to only information that will be sent to the current player
 * @param {*} card 
 * 
 * OPTIONS
 *  type: MANDATORY, the game module ID
 *  --> "SOCIABLES", "DRAW"
 * 
 *  data: Relevant data for loading the card
 *  --> { title: "TITLE", body: "This is body text" }
 * 
 *  color: The background colour of this round, defaults to black
 *  --> "red", "yellow", "green", "cyan", "blue", "magenta", "white", "black"
 * 
 *  timer: the time in seconds that this round should last
 *  --> false, 30, 60, 120
 * 
 *  maximize: whether or not to make the card go full screen when played
 *  --> false, true
 * 
 *  skip: whether to set the bottom status bar to skip the turn
 *  --> false, true
 * 
 *  clickSkip: whether to set clicking the card to skip the turn
 *  --> false, true
 */
function prepareForAlpha(room) {
    const card = room.round;
    return {
        type: gameID,
        data: card.data,
        color: card.color,
        timer: false,
        maximize: false,
        clickSkip: true,
        skip: true,
        mode: "alpha",
    };
}

/**
 * Filters a card to only information that will be sent to other players
 * @param {*} card
 */
function prepareForBeta(room) {
    const card = room.round;

    const data = card.public ? {
        title: card.data.title,
        body: card.data.body,
        footer: `${room.currentPlayer}'S TURN`
    } : {
        title: "",
        body: `It is ${room.currentPlayer}'s turn`,
        footer: ""
    };
    
    return {
        type: gameID,
        data: data,
        color: card.color,
        timer: false,
        maximize: false,
        skip: false,
        mode: "beta"
    }
}

/**
 * Filters a card to only information that will be sent to spectators
 * @param {*} card
 */
function prepareForGamma(room) {
    const card = room.round;

    return {
        type: gameID,
    }
}


function parse(input, random, options) {
    const players = options.players.slice(0);
    players.splice(options.players.indexOf(options.currentPlayer), 1);

    // If card has a random component, insert that before continuing
    if(random) {
        input = input.replace("[RANDOM]", sample(random));
    }
    input = input.replace(/\[ME\]/g, options.currentPlayer);

    const parseMap = {};
    while(input.indexOf("[PLAYER") >= 0) {
        const query = input.match(/\[(PLAYER[A-Z0-9]*)\]/)[0];
        if(!Reflect.has(parseMap, query)) {
            parseMap[query] = players.splice(Math.floor(Math.random() * players.length), 1);
            if(!parseMap[query]) parseMap[query] = sample(options.players);
        } 
        console.log(query);
        input = input.replace(query, parseMap[query]);
    }

    return input;
}

/** Utility Functions */

function sample(array) {
    return array[Math.floor(Math.random() * array.length)];
}

