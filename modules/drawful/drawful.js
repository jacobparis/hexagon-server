const dictionary = require('./words');

const gameID = "DRAWFUL";
const sleeveID = "DRAWFUL-GUESS";

module.exports = {
    ID: gameID,
    serveCard: serveCard,
    prepareForAlpha: prepareForAlpha,
    prepareForBeta: prepareForBeta,
    prepareForGamma: prepareForGamma
};

/**
 * DRAWFUL MODULE
 * This module is based on the jackbox party pack game Drawful
 * When a player draws a drawful card, everyone is assigned a phrase that
 * they must draw. When they are all finished, the drawing is sleeved into the deck
 * 
 * When one of the sleeved cards is drawn, each player must try to guess what the
 * original phrase was. Correct players win the round
 */


/**
 * Takes no arguments and returns an object containing the information to run this card
 * At minimum requires a type: "TYPE" field so the system knows which module this is
 */

function serveCard(sleeve) {
    if(sleeve.length) {
        for(const card of sleeve) {
            if(card.type !== sleeveID) continue;
            console.log("Using sleeved " + sleeveID + " card", card);

            return card;
        }
    }

    const card = {
        type: gameID,
        color: "blue",
        canvas: [],
        timer: 30
    };

    return card;
}

/**
 * Filters a card to only information that will be sent to the current player
 * @param {*} card 
 */
function prepareForAlpha(room) {
    const card = room.round;
    if (card.type === gameID) {
        const phrases = Object.keys(dictionary.words);
        return {
            type: gameID,
            heading: phrases[Math.floor(Math.random() * phrases.length)],
            color: card.color,
            timer: card.timer,
            maximize: true,
            skip: false,
            mode: "alpha",
        };
    }

    if (card.type === sleeveID) {
        return {
            type: sleeveID,
            heading: card.word,
            image: card.image,
            color: card.color,
            maximize: false,
            skip: false,
            mode: "alpha",
        };
    }
}

/**
 * Filters a card to only information that will be sent to other players
 * @param {*} card
 */
function prepareForBeta(room) {
    const card = room.round;
    if (card.type === gameID) {
        return prepareForAlpha(card);
    }

    if (card.type === sleeveID) {
        return {
            type: sleeveID,
            data: loadPhrases(card.word),
            image: card.image,
            color: card.color,
            maximize: false,
            skip: false,
            mode: "beta"
        };
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

/** Utility Functions */

function loadPhrases(dictionary, word) {
    const phrases = [word].concat(dictionary.words[word].alts);

    return phrases;
}

