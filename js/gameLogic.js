// Utility functions for game logic

/**
 * Calculates the score for a given set of cards based on combination rules.
 * @param {Array<Object>} cards - The cards played in the turn.
 * @param {Array<Object>} combinations - The combination rules from game data.
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
 * @param {Object} gameRules - The game rules (parsed from XML or a JS object representing the structure).
 * @param {number} turnNumber - The current turn number (1-5).
 * @returns {Object} An object indicating validity and any errors.
 */
function validateTurn(cards, gameRules, turnNumber) {
    const result = { isValid: true, errors: [] };

    // Rule: minCardsPerTurn and maxCardsPerTurn
    const minCards = gameRules.deck.minCardsPerTurn;
    const maxCards = gameRules.deck.maxCardsPerTurn;
    if (cards.length < minCards || cards.length > maxCards) {
        result.isValid = false;
        result.errors.push(`Número de cartas inválido para o turno ${turnNumber}. Esperado entre ${minCards} e ${maxCards}, mas recebeu ${cards.length}.`);
    }

    // Rule: Deck total size (This is a bit ambiguous, but we can check if cards played are from the deck)
    // For now, assuming validation happens elsewhere or deck is not enforced to be exactly 33 unique cards played over the match.
    // A more complex validation would track the deck state.

    return result;
}

// --- Functions from script.js (ESM) ---

/**
 * Loads game data from a JSON file.
 * @param {string} url - The URL of the JSON data file.
 * @returns {Promise<Object>} The loaded game data.
 */
async function loadGameData(url) {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      throw new Error(`Falha ao buscar ${url}: ${res.status} ${res.statusText}`);
    }
    const json = await res.json();

    // Validação mínima esperada do schema
    validateData(json);

    // Expor globalmente para próximas etapas (apenas para debug/MVP)
    window.GAME_DATA = Object.freeze(json);

    console.info('[GAME_DATA]', window.GAME_DATA);

    return json;
  } catch (err) {
    console.error('Erro ao carregar dados:', err);
    throw err;
  }
}

/**
 * Validates the structure and content of the loaded game data.
 * @param {Object} data - The game data object.
 * @throws {Error} If the data is invalid.
 */
function validateData(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('JSON inválido: objeto raiz ausente.');
  }

  if (!Array.isArray(data.cards) || data.cards.length === 0) {
    throw new Error('JSON inválido: "cards" deve ser array não vazio.');
  }

  for (const c of data.cards) {
    if (!c.id || !c.name) {
      throw new Error(`Carta inválida: id/name ausente (${JSON.stringify(c)})`);
    }
    if (!c.country || !c.club) {
      throw new Error(`Carta inválida: country/club ausente (${c.country / c.club})`);
    }
    if (typeof c.base_value !== "number") {
      throw new Error(`Carta inválida: basevalue deve ser número (${c.base_value})`);
    }
  }

  // combinations
  if (!Array.isArray(data.combinations) || data.combinations.length === 0) {
    throw new Error('JSON inválido: "combinations" deve ser array não vazio.');
  }
}

// Make functions available globally for script.js to use them directly
// This is necessary because script.js is not a module in the current HTML setup
window.calculateScore = calculateScore;
window.validateTurn = validateTurn;
window.loadGameData = loadGameData;
window.validateData = validateData;

// For Node.js environment testing, if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { calculateScore, validateTurn, loadGameData, validateData };
}