(() => {
    const ANSWERS = Array.isArray(window.WORDLE_WORDS) ? [...window.WORDLE_WORDS] : [];
    const WORD_SET = new Set(ANSWERS);
    let wordListPromise = null;
    const STORE_KEY = 'biankaDailyWordleState';
    const $ = (id) => document.getElementById(id);
    const board = $('wordle-board');
    const keyboard = $('wordle-keyboard');
    const message = $('wordle-message');
    const dailyStatus = $('wordle-daily-status');
    const countdown = $('wordle-countdown');
    const backButton = $('wordle-back-btn');
    const devControls = $('wordle-dev-controls');
    let state = null;
    let currentGuess = '';
    let cells = [];
    let keyButtons = new Map();

    function utcDateString() {
        return new Date().toISOString().slice(0, 10);
    }

    function dateNumber(dateString) {
        const [year, month, day] = dateString.split('-').map(Number);
        return Math.floor(Date.UTC(year, month - 1, day) / 86400000);
    }

    function getDailyAnswer(dateString) {
        let hash = 2166136261;
        for (const character of dateString) {
            hash ^= character.charCodeAt(0);
            hash = Math.imul(hash, 16777619);
        }
        return ANSWERS[(hash >>> 0) % ANSWERS.length];
    }

    async function loadWordList() {
        if (!wordListPromise) {
            wordListPromise = Promise.resolve().then(async () => {
                let sourceWords = Array.isArray(window.WORDLE_WORDS) ? window.WORDLE_WORDS : null;
                if (!sourceWords) throw new Error('The bundled Wordle answer list did not load.');
                const words = [...new Set(sourceWords.map((word) => String(word).trim().toLowerCase()).filter((word) => /^[a-z]{5}$/.test(word)))];
                if (!words.length) throw new Error('The supplied Wordle answer list is empty or unreadable.');
                ANSWERS.length = 0;
                words.forEach((word) => ANSWERS.push(word));
                WORD_SET.clear();
                words.forEach((word) => WORD_SET.add(word));
                return true;
            })
                .catch(() => {
                    wordListPromise = null;
                    dailyStatus.textContent = 'Word list unavailable';
                    message.textContent = 'The bundled Wordle answer list could not be loaded. Reload the game and try again.';
                    return false;
                });
        }
        return wordListPromise;
    }

    function getCurrentAnswer() {
        return state.dev ? state.answer : getDailyAnswer(state.date);
    }

    function loadDailyState() {
        const today = utcDateString();
        if (localStorage.getItem('devMode') === 'true') {
            state = {
                date: today,
                guesses: [],
                result: 'playing',
                dev: true,
                answer: ANSWERS[Math.floor(Math.random() * ANSWERS.length)]
            };
            currentGuess = '';
            render();
            return;
        }
        try {
            const saved = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
            if (saved && saved.date === today && Array.isArray(saved.guesses)) {
                state = saved;
            } else {
                state = { date: today, guesses: [], result: 'playing' };
                persistState();
            }
        } catch (error) {
            state = { date: today, guesses: [], result: 'playing' };
        }
        currentGuess = '';
        render();
    }

    function persistState() {
        if (!state.dev) localStorage.setItem(STORE_KEY, JSON.stringify(state));
    }

    function evaluateGuess(guess, answer) {
        const result = Array(5).fill('absent');
        const remaining = {};
        for (let i = 0; i < 5; i += 1) {
            if (guess[i] === answer[i]) result[i] = 'correct';
            else remaining[answer[i]] = (remaining[answer[i]] || 0) + 1;
        }
        for (let i = 0; i < 5; i += 1) {
            if (result[i] === 'correct') continue;
            if (remaining[guess[i]] > 0) {
                result[i] = 'present';
                remaining[guess[i]] -= 1;
            }
        }
        return result;
    }

    function makeBoard() {
        board.replaceChildren();
        cells = [];
        for (let row = 0; row < 6; row += 1) {
            const rowCells = [];
            for (let column = 0; column < 5; column += 1) {
                const tile = document.createElement('div');
                tile.className = 'wordle-tile';
                tile.setAttribute('role', 'gridcell');
                tile.setAttribute('aria-label', `Row ${row + 1}, letter ${column + 1}`);
                board.appendChild(tile);
                rowCells.push(tile);
            }
            cells.push(rowCells);
        }
    }

    function makeKeyboard() {
        keyboard.replaceChildren();
        keyButtons = new Map();
        const rows = ['QWERTYUIOP', 'ASDFGHJKL', 'ENTERZXCVBNM⌫'];
        rows.forEach((row, rowIndex) => {
            const line = document.createElement('div');
            line.className = `wordle-key-row wordle-key-row-${rowIndex + 1}`;
            const keys = rowIndex === 2 ? ['ENTER', ...'ZXCVBNM', '⌫'] : [...row];
            keys.forEach((key) => {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'wordle-key';
                button.dataset.key = key;
                button.textContent = key === '⌫' ? '⌫' : key;
                if (key === 'ENTER' || key === '⌫') button.classList.add('wordle-key-wide');
                button.addEventListener('click', () => handleKey(key));
                keyButtons.set(key, button);
                line.appendChild(button);
            });
            keyboard.appendChild(line);
        });
    }

    function mergeKeyColor(letter, color) {
        const priority = { absent: 1, present: 2, correct: 3 };
        const key = keyButtons.get(letter.toUpperCase());
        if (!key) return;
        const old = key.dataset.state;
        if (!old || priority[color] > priority[old]) {
            key.dataset.state = color;
            key.classList.remove('is-absent', 'is-present', 'is-correct');
            key.classList.add(`is-${color}`);
        }
    }

    function render() {
        makeBoard();
        makeKeyboard();
        devControls.hidden = localStorage.getItem('devMode') !== 'true';
        state.guesses.forEach((entry, row) => {
            [...entry.word].forEach((letter, column) => {
                cells[row][column].textContent = letter.toUpperCase();
                cells[row][column].classList.add('revealed', `tile-${entry.result[column]}`);
                mergeKeyColor(letter, entry.result[column]);
            });
        });
        if (state.result === 'playing') {
            const row = state.guesses.length;
            [...currentGuess].forEach((letter, column) => {
                if (row < 6) {
                    cells[row][column].textContent = letter.toUpperCase();
                    cells[row][column].classList.add('filled');
                }
            });
            dailyStatus.textContent = state.dev ? 'Developer Mode · unlimited puzzles' : `Daily puzzle · ${state.date} (UTC)`;
            message.textContent = 'Type a five-letter word and press Enter.';
        } else if (state.result === 'won') {
            dailyStatus.textContent = state.dev ? 'Developer puzzle complete' : 'Completed for today ✓';
            message.textContent = state.dev ? 'Correct! Start another dev puzzle whenever you want.' : 'Excellent! The next word is available at midnight UTC.';
        } else {
            dailyStatus.textContent = state.dev ? 'Developer answer revealed' : 'Puzzle complete — come back tomorrow';
            message.textContent = state.dev
                ? `The word was ${getCurrentAnswer().toUpperCase()}. Start another dev puzzle whenever you want.`
                : `The word was ${getCurrentAnswer().toUpperCase()}. The next puzzle starts at midnight UTC.`;
        }
    }

    function updateCurrentRow() {
        const row = state.guesses.length;
        if (row >= 6) return;
        cells[row].forEach((tile, column) => {
            tile.textContent = currentGuess[column] ? currentGuess[column].toUpperCase() : '';
            tile.classList.toggle('filled', Boolean(currentGuess[column]));
        });
    }

    function submitGuess() {
        if (!state || state.result !== 'playing') return;
        if (currentGuess.length !== 5) {
            message.textContent = 'Your guess needs five letters.';
            return;
        }
        if (!WORD_SET.has(currentGuess)) {
            message.textContent = 'That word is not in this game’s word list.';
            board.classList.remove('wordle-shake');
            void board.offsetWidth;
            board.classList.add('wordle-shake');
            return;
        }
        const answer = getCurrentAnswer();
        const result = evaluateGuess(currentGuess, answer);
        state.guesses.push({ word: currentGuess, result });
        currentGuess = '';
        if (result.every((color) => color === 'correct')) state.result = 'won';
        else if (state.guesses.length >= 6) state.result = 'lost';
        persistState();
        render();
    }

    function handleKey(key) {
        if (!state || state.result !== 'playing') return;
        if (key === 'ENTER') {
            submitGuess();
        } else if (key === '⌫' || key === 'BACKSPACE') {
            currentGuess = currentGuess.slice(0, -1);
            updateCurrentRow();
        } else if (/^[a-z]$/i.test(key) && currentGuess.length < 5) {
            currentGuess += key.toLowerCase();
            updateCurrentRow();
        }
    }

    function updateCountdown() {
        const now = new Date();
        const nextUtcDay = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
        const seconds = Math.max(0, Math.floor((nextUtcDay - now.getTime()) / 1000));
        const hours = String(Math.floor(seconds / 3600)).padStart(2, '0');
        const minutes = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
        const remaining = String(seconds % 60).padStart(2, '0');
        countdown.textContent = `Next word in ${hours}:${minutes}:${remaining} UTC`;
        if (state && state.date !== utcDateString()) loadDailyState();
    }

    document.getElementById('wordle-welcome-btn').addEventListener('click', () => {
        if (typeof playPopSound === 'function') playPopSound();
        showScreen('wordle');
        loadWordList().then((loaded) => {
            if (loaded) loadDailyState();
        });
    });
    $('wordle-reveal-btn').addEventListener('click', () => {
        if (localStorage.getItem('devMode') !== 'true' || !state || !state.dev || state.result !== 'playing') return;
        state.result = 'revealed';
        render();
    });
    $('wordle-new-dev-game-btn').addEventListener('click', () => {
        if (localStorage.getItem('devMode') !== 'true') return;
        state = {
            date: utcDateString(),
            guesses: [],
            result: 'playing',
            dev: true,
            answer: ANSWERS[Math.floor(Math.random() * ANSWERS.length)]
        };
        currentGuess = '';
        render();
    });
    backButton.addEventListener('click', () => showScreen('welcome'));
    document.addEventListener('keydown', (event) => {
        if (!screens.wordle.classList.contains('active')) return;
        if (event.ctrlKey || event.altKey || event.metaKey) return;
        if (event.key === 'Enter' || event.key === 'Backspace' || /^[a-z]$/i.test(event.key)) {
            event.preventDefault();
            handleKey(event.key === 'Enter' ? 'ENTER' : event.key === 'Backspace' ? 'BACKSPACE' : event.key);
        }
    });
    makeBoard();
    makeKeyboard();
    updateCountdown();
    setInterval(updateCountdown, 1000);
})();
