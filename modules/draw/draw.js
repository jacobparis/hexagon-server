const dictionary = require('./words');
const gameID = "DRAW";

module.exports = {
    ID: gameID,
    serveCard: serveCard,
    prepareForAlpha: prepareForAlpha,
    prepareForBeta: prepareForBeta,
    prepareForGamma: prepareForGamma,
    events: require('./events')
}

/**
 * Takes no arguments and returns an object containing the information to run this card
 * At minimum requires a type: "TYPE" field so the system knows which module this is
 */
function serveCard() {
    const card = {
        type: gameID,
        word: dictionary.words[Math.floor(Math.random() * dictionary.words.length)],
        color: "cyan",
        timer: 60
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
        heading: card.word,
        color: card.color,
        timer: card.timer,
        maximize: true,
        skip: true,
        mode: "alpha",
    };
}

/**
 * Filters a card to only information that will be sent to other players
 * @param {*} card
 */
function prepareForBeta(card) {
    return {
        type: gameID,
        data: scrambleWord(card.word),
        color: card.color,
        maximize: false,
        skip: false,
        mode: "beta"
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

/** Utility Functions */

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

