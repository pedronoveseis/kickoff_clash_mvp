// Node.js compatible version of game logic functions for testing

/**
 * Calculates the score for a given set of cards based on combination rules.
 * @param {Array<Object>} cards - The cards played in the turn.
 * @param {Array<Object>} combinations - The combination rules.
 * @returns {Object} An object containing the score, the applied combination, and the base sum.
 */
function calculateScore(cards, combinations) {
    if (!cards || cards.length === 0) {
        return { score: 0, combination: 'none', baseSum: 0 };
    }

    const baseSum = cards.reduce((sum, card) => sum + (card.base_value || 0), 0);

    // Find applicable combinations
    let bestCombination = { type: 'none', multiplier: 1 };
    let highestMultiplier = 1;

    // Check for country combination
    const countryCounts = {};
    cards.forEach(card => {
        countryCounts[card.country] = (countryCounts[card.country] || 0) + 1;
    });
    for (const country in countryCounts) {
        if (countryCounts[country] >= 2) { // Assuming min 2 for any combo from rules
            const countryCombo = combinations.find(c => c.type === 'country');
            if (countryCombo && countryCombo.multiplier > highestMultiplier) {
                highestMultiplier = countryCombo.multiplier;
                bestCombination = countryCombo;
            }
        }
    }

    // Check for club combination (only if a better one hasn't been found)
    // According to rules, country (x3) has higher priority than club (x2)
    if (highestMultiplier < 3) { // Only check club if country combo (x3) wasn't found
        const clubCounts = {};
        cards.forEach(card => {
            clubCounts[card.club] = (clubCounts[card.club] || 0) + 1;
        });
        for (const club in clubCounts) {
            if (clubCounts[club] >= 2) { // Assuming min 2 for any combo from rules
                const clubCombo = combinations.find(c => c.type === 'club');
                if (clubCombo && clubCombo.multiplier > highestMultiplier) {
                    highestMultiplier = clubCombo.multiplier;
                    bestCombination = clubCombo;
                }
            }
        }
    }

    const score = baseSum * bestCombination.multiplier;
    return { score, combination: bestCombination.type, baseSum };
}

/**
 * Validates if a set of cards conforms to the game's deck and turn rules.
 * @param {Array<Object>} cards - The cards to validate.
 * @param {Object} gameRules - The game rules.
 * @param {number} turnNumber - The current turn number.
 * @returns {Object} An object indicating if the turn is valid and any errors.
 */
function validateTurn(cards, gameRules, turnNumber) {
    const errors = [];

    if (!cards || cards.length === 0) {
        errors.push("Nenhuma carta selecionada.");
        return { isValid: false, errors };
    }

    // Check card count rules
    if (cards.length < gameRules.deck.minCardsPerTurn) {
        errors.push(`Mínimo de ${gameRules.deck.minCardsPerTurn} cartas por turno.`);
    }
    if (cards.length > gameRules.deck.maxCardsPerTurn) {
        errors.push(`Máximo de ${gameRules.deck.maxCardsPerTurn} cartas por turno.`);
    }

    // All validations passed if no errors
    return { isValid: errors.length === 0, errors };
}

// Export functions for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { calculateScore, validateTurn };
}