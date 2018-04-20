const dictionary = require('./words');

const gameID = "DRAWFUL";
const sleeveID = "DRAWFUL-GUESS";

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
        for(let card of sleeve) {
            if(card.type !== sleeveID) continue;
            console.log("Using sleeved " + sleeveID + " card", card);

            return card;
        }
    }

    const card = {
        type: gameID,
        color: "blue",
        canvas: []
    };

    return card;
}

/**
 * Filters a card to only information that will be sent to the current player
 * @param {*} card 
 */
function prepareForAlpha(card) {
    if (card.type === gameID) {
        const phrases = Object.keys(dictionary.words);
        return {
            type: gameID,
            word: phrases[Math.floor(Math.random() * phrases.length)],
            color: card.color
        };
    }

    if (card.type === sleeveID) {
        return {
            type: sleeveID,
            word: card.word,
            image: card.image,
            color: card.color
        };
    }
}

/**
 * Filters a card to only information that will be sent to other players
 * @param {*} card
 */
function prepareForBeta(card) {
    if (card.type === gameID) {
        return prepareForAlpha(card);
    }

    if (card.type === sleeveID) {
        return {
            type: sleeveID,
            phrases: loadPhrases(card.word),
            image: card.image,
            color: card.color
        };
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

function onSkip(io, socket, room) {
    return room;
}

/** Utility Functions */

function loadPhrases(dictionary, word) {
    const phrases = [word].concat(dictionary.words[word].alts);
    
    return phrases;
}
module.exports = {
    serveCard: serveCard,
    prepareForAlpha: prepareForAlpha,
    prepareForBeta: prepareForBeta,
    prepareForGamma: prepareForGamma,
    onSkip: onSkip
}