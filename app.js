// State
let totalPoints = 0;
let completedDifficulties = {
    eu: { easy: false, medium: false, hard: false, expert: false },
    hungary: { easy: false, medium: false, hard: false, expert: false },
    romania: { easy: false, medium: false, hard: false, expert: false },
    trains: { easy: false, medium: false, hard: false, expert: false },
    personal: { easy: false, medium: false, hard: false, expert: false }
};
let currentCategory = '';
let currentDifficulty = '';
let currentTriviaSeason = localStorage.getItem('triviaSeason') === '2' ? '2' : '1';
let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let answerSelected = false;
let currentScreen = 'welcome';
let previousScreen = 'welcome';

// DOM Elements
const screens = {
    welcome: document.getElementById('welcome-screen'),
    gameHub: document.getElementById('game-hub-screen'),
    wordle: document.getElementById('wordle-screen'),
    menu: document.getElementById('menu-screen'),
    settings: document.getElementById('settings-screen'),
    difficulty: document.getElementById('difficulty-screen'),
    game: document.getElementById('game-screen'),
    result: document.getElementById('result-screen'),
    qotd: document.getElementById('qotd-screen'),
    profile: document.getElementById('profile-screen'),
    workoutMenu: document.getElementById('workout-menu-screen'),
    workoutNow: document.getElementById('workout-now-screen'),
    workout: document.getElementById('workout-screen'),
    weightHistory: document.getElementById('weight-history-screen'),
    millionaireTitle: document.getElementById('millionaire-title-screen'),
    millionaireName: document.getElementById('millionaire-name-screen'),
    millionaire: document.getElementById('millionaire-screen'),
    minesweeperSize: document.getElementById('minesweeper-size-screen'),
    minesweeper: document.getElementById('minesweeper-screen'),
    sudokuSize: document.getElementById('sudoku-size-screen'),
    sudoku: document.getElementById('sudoku-screen'),
    puzzle: document.getElementById('puzzle-screen')
};
let screenTransitionTimeout = null;

const MAIL_STORAGE_KEY = 'triviaMailLetters';
const BUILT_IN_MAIL_LETTERS = [{
    id: 'site-letter-2026-08-17',
    coverImage: './assets/1.png',
    insideImage: './assets/2.png',
    date: '2026-08-17',
    builtIn: true
}];
const startBtn = document.getElementById('start-btn');
const settingsBtn = document.getElementById('settings-btn');
const backToWelcomeBtn = document.getElementById('back-to-welcome');
const mailBtn = document.getElementById('mail-btn');
const mailCountBadge = document.getElementById('mail-count-badge');
const mailOverlay = document.getElementById('mail-overlay');
const mailCloseBtn = document.getElementById('mail-close-btn');
const mailPreviewOverlay = document.getElementById('mail-preview-overlay');
const mailPreviewBackBtn = document.getElementById('mail-preview-back-btn');
const mailPreviewImage = document.getElementById('mail-preview-image');
const mailPreviewDate = document.getElementById('mail-preview-date');
const mailList = document.getElementById('mail-list');
const mailEmptyState = document.getElementById('mail-empty-state');
const mailComposeBtn = document.getElementById('mail-compose-btn');
const mailComposeOverlay = document.getElementById('mail-compose-overlay');
const mailComposeCloseBtn = document.getElementById('mail-compose-close-btn');
const mailCoverInput = document.getElementById('mail-cover-input');
const mailInsideInput = document.getElementById('mail-inside-input');
const mailDateInput = document.getElementById('mail-date-input');
const mailSubmitBtn = document.getElementById('mail-submit-btn');
let mailPreviewReturnFocus = null;
const mysteryBtn = document.getElementById('mystery-btn');
const triviaSeasonSelect = document.getElementById('trivia-season-select');
const categoryBtns = document.querySelectorAll('.category-btn:not(#mystery-btn)');
const difficultyBtns = document.querySelectorAll('.diff-btn');
const backToMenuBtn = document.getElementById('back-to-menu');
const exitGameBtn = document.getElementById('exit-game-btn');
const nextBtn = document.getElementById('next-btn');
const finishBtn = document.getElementById('finish-btn');
const resetProfileBtn = document.getElementById('reset-profile-btn');
const resetAllProgressBtn = document.getElementById('reset-all-progress-btn');
const optionsContainer = document.getElementById('options-container');

if (triviaSeasonSelect) {
    triviaSeasonSelect.value = currentTriviaSeason;
    triviaSeasonSelect.dataset.season = currentTriviaSeason;
    triviaSeasonSelect.addEventListener('change', () => {
        currentTriviaSeason = triviaSeasonSelect.value === '2' ? '2' : '1';
        triviaSeasonSelect.dataset.season = currentTriviaSeason;
        localStorage.setItem('triviaSeason', currentTriviaSeason);
    });
}

const millionaireWelcomeBtn = document.getElementById('millionaire-welcome-btn');
const backToMenuFromMillionaire = document.getElementById('back-to-menu-from-millionaire');
const backToMenuFromMillionaireName = document.getElementById('back-to-menu-from-millionaire-name');
const millionaireQuestionText = document.getElementById('millionaire-question-text');
const millionaireOptions = document.getElementById('millionaire-options');
const millionaireTimerDisplay = document.getElementById('millionaire-timer');
const millionaireQuestionCount = document.getElementById('millionaire-question-count');
const millionaireNextBtn = document.getElementById('millionaire-next-btn');
const millionairePrizeList = document.getElementById('millionaire-prize-list');
const millionairePrizeToggle = document.getElementById('millionaire-prize-toggle');
const millionaireSidebar = document.getElementById('millionaire-sidebar');
const millionaireStatusText = document.getElementById('millionaire-status-text');
const lifelineCallBtn = document.getElementById('lifeline-call');
const lifelineFiftyBtn = document.getElementById('lifeline-fifty');
const lifelineAudienceBtn = document.getElementById('lifeline-audience');
const lifelineHostBtn = document.getElementById('lifeline-host');
const millionaireNameInput = document.getElementById('millionaire-name-input');
const millionaireNameContinueBtn = document.getElementById('millionaire-name-continue-btn');
const millionaireNamePreview = document.getElementById('millionaire-name-preview');
const millionaireContestantNameDisplay = document.getElementById('millionaire-contestant-name');
const millionaireIntroAudio = document.getElementById('millionaire-intro');
const millionaireNameAudio = document.getElementById('millionaire-name-loop');
const millionaireNameSelectedAudio = document.getElementById('millionaire-name-selected');
const millionaireBg1 = document.getElementById('millionaire-bg-1');
const millionaireBg2 = document.getElementById('millionaire-bg-2');
const millionaireBg3 = document.getElementById('millionaire-bg-3');
const millionaireBg4 = document.getElementById('millionaire-bg-4');
const millionaireAnswerPending = document.getElementById('millionaire-answer-pending');
const millionaireAnswerCorrect = document.getElementById('millionaire-answer-correct');
const millionaireAnswerWrong = document.getElementById('millionaire-answer-wrong');

// Ensure intro does not loop and reliably stops when finished
if (millionaireIntroAudio) {
    try {
        millionaireIntroAudio.loop = false;
        millionaireIntroAudio.addEventListener('ended', () => {
            try { millionaireIntroAudio.pause(); millionaireIntroAudio.currentTime = 0; } catch(e) {}
        });
    } catch(e) {}
}

let currentGameMode = 'category';
let millionaireQuestions = [];
let millionaireCurrentIndex = 0;
let millionaireScore = 0;
let millionaireAnswerSelected = false;
let millionaireTimerInterval = null;
let millionaireRevealTimeout = null;
let millionaireAudienceTimeout = null;
let activeSuspenseCallback = null;
let millionaireTitleTimeout = null;
let millionaireNameStartTimeout = null;
let millionaireTimeRemaining = 180;
let millionaireContestantName = '';
let millionaireLifelines = {
    callFriend: false,
    fiftyFifty: false,
    audienceVote: false
};

const millionairePrizeLevels = [
    "$100", "$200", "$300", "$500", "$1,000", "$2,000", "$4,000", "$8,000", "$16,000", "$32,000", "$64,000", "$125,000", "$250,000", "$500,000", "$1,000,000"
];

const millionaireData = [
    { q: "What is a group of resting otter called?", options: ["A raft", "A boat", "A bask", "Heaven"], answer: 0 },
    { q: "In what edition did Radu compete in the prestigious TV show Top Model Belgium, reaching the semi-finals?", options: ["2017", "2018", "2019", "1973"], answer: 1 },
    { q: "What is the literal English translation of the Danish phrase LEG GODT, from which the company name LEGO was famously derived?", options: ["Build fast", "Think deeply", "Play well", "Create always"], answer: 2 },
    { q: "Which of these musical terms indicates that a piece of music should be performed at a slow, leisurely pace?", options: ["Mas Lentos", "Presto", "Allegro", "Adagio"], answer: 3 },
    { q: "In the hit Netflix television adaptation of Bridgerton, who voices the mysterious, scandalous gossip columnist Lady Whistledown?", options: ["Julie Andrews", "Nicola Coughlan", "Phoebe Dynevor", "Maya The Otter"], answer: 0 },
    { q: "The breathtaking green colors most commonly observed in the Northern Lights are caused by solar particles colliding with which specific element in Earth's atmosphere?", options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Helium"], answer: 0 },
    { q: "In Julia Quinn s original Bridgerton novel series, which of the eight Bridgerton siblings is the absolute first to have their romantic story told in the debut book, The Duke and I?", options: ["Anthony", "Benedict", "Daphne", "Colin"], answer: 2 },
    { q: "Boasting a massive footprint of over 360,000 square meters, Romania's iconic Palace of the Parliament in Bucharest holds which global distinction?", options: ["The largest mud-brick structure ever built", "The widest administrative building in the world", "The oldest active parliament house in history", "The heaviest administrative building in the world"], answer: 3 },
    { q: "Under the European Union's landmark General Data Protection Regulation (GDPR), what is the maximum administrative fine that can be levied against a company for a severe tier-one data privacy violation?", options: ["Up to €20 million or 4% of global turnover", "Up to €15 million or 3% of global turnover", "Up to €10 million or 2% of global turnover", "Up to €5 million or 1% of global turnover"], answer: 0 },
    { q: "Connecting Buda and Pest across the Danube River, the historic Széchenyi Chain Bridge features majestic stone guardian statues of which animal at its entrances?", options: ["Eagles", "Lions", "Bears", "Wolves"], answer: 1 },
    { q: "In the classic series Sex and the City, fashion-obsessed columnist Carrie Bradshaw is most famously known for her expensive obsession with shoes from which luxury designer?", options: ["Christian Dior", "Jimmy Choo", "Manolo Blahnik", "Yves Saint Laurent"], answer: 2 },
    { q: "Under the current diagnostic criteria outlined in the Diagnostic and Statistical Manual of Mental Disorders (DSM-5), which of the following is categorized as a core symptom under the (Restricted, repetitive patterns of behavior, interests, or activities) domain?", options: ["Persistent deficits in conversational turn-taking", "Structural language impairments or delayed speech development", "Difficulties adjusting behavior to suit various social contexts", "Hyper- or hypo-reactivity to sensory input (such as textures or sounds)"], answer: 3 },
    { q: "In options trading, an IRON CONDOR is a popular market-neutral strategy designed to profit from which of the following market conditions?", options: ["A massive, sudden price breakout in either direction", "Low volatility, where the underlying asset price stays within a tight range", "A steady, long-term bullish uptrend", "An immediate, catastrophic market crash"], answer: 1 },
    { q: "Large-scale Genome-Wide Association Studies (GWAS) and Linkage Disequilibrium (LD) score regressions have demonstrated that ADHD has a massive, highly polygenic architecture. When evaluating cross-trait genetic correlations ($r_g$), which of the following phenotypes exhibits the strongest negative genetic correlation with ADHD liability?", options: ["Parental lifespan", "Years of schooling", "Subjective well-being", "HDL cholesterol levels"], answer: 1 },
    { q: "During the height of a major sovereign debt or financial crisis, if a Eurozone member state requires emergency liquidity or a formal stability support programme, the Eurogroup coordinates the response. However, the critical, highly sensitive task of executing daily marketplace operations, managing financial disbursements, and conducting the actual bond market transactions on behalf of the European Stability Mechanism (ESM) is legally delegated to which external institution?", options: ["The European Investment Bank (EIB)", "The Bank for International Settlements (BIS)", "The German Finance Agency (Finanzagentur)", "The Directorate-General for Economic and Financial Affairs (DG ECFIN)"], answer: 2 }
];

// Sound Effects & Music
const bgMusic = document.getElementById('bg-music');
const musicToggle = document.getElementById('music-toggle');
const soundToggle = document.getElementById('sound-toggle');
const musicVolumeRow = document.getElementById('music-volume-row');
const sfxVolumeRow = document.getElementById('sfx-volume-row');
const sfxPopSound = document.getElementById('sfx-pop');
const sfxVolumeSlider = document.getElementById('sfx-volume');
const musicVolumeSlider = document.getElementById('music-volume');
let isMusicPlaying = false;
let musicEnabled = true;
let soundEnabled = true;
let sfxVolume = 0.3;
let millionaireTitleTransitioned = false;
let millionaireFlowActive = false;

function setVolumeRowVisible(row, visible) {
    if (visible) {
        row.style.maxHeight = '50px';
        row.style.opacity = '1';
        row.style.pointerEvents = '';
    } else {
        row.style.maxHeight = '0';
        row.style.opacity = '0';
        row.style.pointerEvents = 'none';
    }
}

function isDeveloperMode() {
    return localStorage.getItem('devMode') === 'true';
}

function getMailLetters() {
    try {
        const raw = localStorage.getItem(MAIL_STORAGE_KEY);
        if (!raw) return [...BUILT_IN_MAIL_LETTERS];
        const parsed = JSON.parse(raw);
        const savedLetters = Array.isArray(parsed) ? parsed : [];
        return [
            ...BUILT_IN_MAIL_LETTERS,
            ...savedLetters.filter((letter) => letter.id !== BUILT_IN_MAIL_LETTERS[0].id)
        ];
    } catch (error) {
        return [...BUILT_IN_MAIL_LETTERS];
    }
}

function persistMailLetters(nextLetters) {
    localStorage.setItem(MAIL_STORAGE_KEY, JSON.stringify(nextLetters));
    window.dispatchEvent(new CustomEvent('mail-state-updated', { detail: nextLetters }));
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new StorageEvent('storage', {
            key: MAIL_STORAGE_KEY,
            newValue: JSON.stringify(nextLetters)
        }));
    }
}

function renderMailBadge() {
    const letters = getMailLetters();
    if (mailCountBadge) {
        mailCountBadge.textContent = String(letters.length);
        mailCountBadge.style.display = letters.length > 0 ? 'grid' : 'none';
    }
    if (mailComposeBtn) {
        mailComposeBtn.classList.toggle('visible', isDeveloperMode());
    }
}

function renderMailList() {
    const letters = getMailLetters();
    if (!mailList || !mailEmptyState) return;

    if (letters.length === 0) {
        mailList.innerHTML = '';
        mailEmptyState.classList.remove('hidden');
        return;
    }

    mailEmptyState.classList.add('hidden');
    mailList.innerHTML = letters.map((letter, index) => `
        <div class="mail-letter-card" data-index="${index}">
            <button class="mail-letter-open-tab" type="button" aria-label="Open letter in a big view" data-open-index="${index}">🔎</button>
            ${letter.builtIn ? '' : `<button class="mail-letter-delete" type="button" aria-label="Delete letter" data-delete-index="${index}">✕</button>`}
            <button class="mail-letter-button" type="button" aria-label="Open letter from ${formatMailDate(letter.date)}">
                <div class="mail-letter-inner">
                    <div class="mail-letter-face mail-letter-front">
                        <img src="${letter.coverImage || ''}" alt="Letter cover" />
                    </div>
                    <div class="mail-letter-face mail-letter-back">
                        <img src="${letter.insideImage || ''}" alt="Letter contents" />
                        <div class="mail-letter-inside-overlay"></div>
                        <div class="mail-letter-date">
                            <span>Issue date</span>
                            <strong>${formatMailDate(letter.date)}</strong>
                        </div>
                    </div>
                </div>
            </button>
        </div>
    `).join('');

    mailList.querySelectorAll('.mail-letter-open-tab').forEach((button) => {
        button.addEventListener('click', (event) => {
            event.stopPropagation();
            const index = Number(button.dataset.openIndex);
            const letter = getMailLetters()[index];
            if (!letter || !letter.insideImage) return;
            openMailPreview(letter, button);
        });
    });

    mailList.querySelectorAll('.mail-letter-delete').forEach((button) => {
        button.addEventListener('click', (event) => {
            event.stopPropagation();
            const index = Number(button.dataset.deleteIndex);
            const nextLetters = getMailLetters().filter((_, i) => i !== index);
            persistMailLetters(nextLetters);
            renderMailBadge();
            renderMailList();
        });
    });

    mailList.querySelectorAll('.mail-letter-button').forEach((button) => {
        button.addEventListener('click', () => {
            const card = button.closest('.mail-letter-card');
            if (!card) return;
            card.classList.toggle('is-flipped');
        });
    });
}

function formatMailDate(dateString) {
    if (!dateString) return 'No date';
    const date = /^\d{4}-\d{2}-\d{2}$/.test(dateString)
        ? new Date(`${dateString}T12:00:00`)
        : new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    }).format(date);
}

function openMailOverlay() {
    renderMailBadge();
    renderMailList();
    if (mailOverlay) {
        mailOverlay.classList.remove('hidden');
        mailOverlay.setAttribute('aria-hidden', 'false');
    }
}

function closeMailOverlay() {
    if (mailOverlay) {
        mailOverlay.classList.add('hidden');
        mailOverlay.setAttribute('aria-hidden', 'true');
    }
}

function openMailPreview(letter, returnFocus) {
    if (!mailPreviewOverlay || !mailPreviewImage) return;
    mailPreviewReturnFocus = returnFocus;
    mailPreviewImage.src = letter.insideImage;
    if (mailPreviewDate) {
        mailPreviewDate.textContent = `Issue date: ${formatMailDate(letter.date)}`;
    }
    mailPreviewOverlay.classList.remove('hidden');
    mailPreviewOverlay.setAttribute('aria-hidden', 'false');
    if (mailPreviewBackBtn) mailPreviewBackBtn.focus();
}

function closeMailPreview() {
    if (!mailPreviewOverlay) return;
    mailPreviewOverlay.classList.add('hidden');
    mailPreviewOverlay.setAttribute('aria-hidden', 'true');
    if (mailPreviewImage) mailPreviewImage.removeAttribute('src');
    if (mailPreviewReturnFocus && document.contains(mailPreviewReturnFocus)) {
        mailPreviewReturnFocus.focus();
    }
    mailPreviewReturnFocus = null;
}

function openMailComposeOverlay() {
    if (mailComposeOverlay) {
        mailComposeOverlay.classList.remove('hidden');
        mailComposeOverlay.setAttribute('aria-hidden', 'false');
    }
}

function closeMailComposeOverlay() {
    if (mailComposeOverlay) {
        mailComposeOverlay.classList.add('hidden');
        mailComposeOverlay.setAttribute('aria-hidden', 'true');
    }
    if (mailCoverInput) mailCoverInput.value = '';
    if (mailInsideInput) mailInsideInput.value = '';
    if (mailDateInput) mailDateInput.value = '';
}

async function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target.result);
        reader.onerror = () => reject(new Error('Unable to read selected file.'));
        reader.readAsDataURL(file);
    });
}

async function handleMailSubmit() {
    if (!mailCoverInput || !mailInsideInput || !mailDateInput) return;

    const coverFile = mailCoverInput.files && mailCoverInput.files[0];
    const insideFile = mailInsideInput.files && mailInsideInput.files[0];
    const issueDate = mailDateInput.value;

    if (!coverFile || !insideFile || !issueDate) {
        alert('Please upload both images and add the issue date.');
        return;
    }

    if (!isDeveloperMode()) {
        alert('Only developer mode can add a letter.');
        return;
    }

    const letters = getMailLetters();
    if (letters.length >= 1) {
        alert('Developer mode can only add one letter at a time.');
        return;
    }

    try {
        const coverImage = await readFileAsDataUrl(coverFile);
        const insideImage = await readFileAsDataUrl(insideFile);
        const nextLetters = [
            ...letters,
            {
                id: Date.now().toString(36),
                coverImage,
                insideImage,
                date: issueDate
            }
        ];

        persistMailLetters(nextLetters);
        renderMailBadge();
        renderMailList();
        closeMailComposeOverlay();
    } catch (error) {
        alert('There was a problem adding the letter.');
    }
}

// Utility: Shuffle Array
function shuffle(array) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}

// Screen Transitions
function showScreen(screenName) {
    if (screenName === 'workoutMenu') updateWorkoutMenuDayStatus();
    else if (workoutMenuStatusTimer) {
        clearTimeout(workoutMenuStatusTimer);
        workoutMenuStatusTimer = null;
    }
    if (screenTransitionTimeout) {
        clearTimeout(screenTransitionTimeout);
        screenTransitionTimeout = null;
    }

    Object.values(screens).forEach(screen => {
        if (screen.classList.contains('active')) {
            screen.classList.remove('active');
            screen.classList.add('slide-out');
            setTimeout(() => {
                screen.classList.remove('slide-out');
            }, 400); // Wait for transition
        }
    });

    screenTransitionTimeout = setTimeout(() => {
        screenTransitionTimeout = null;

        // Toggle app width for larger game screens
        const appEl = document.getElementById('app');
        if (appEl) {
            const wideScreens = ['minesweeper', 'minesweeperSize', 'sudoku', 'sudokuSize', 'puzzle', 'weightHistory'];
            if (wideScreens.includes(screenName)) appEl.classList.add('wide');
            else appEl.classList.remove('wide');
        }

        screens[screenName].classList.add('active');
        currentScreen = screenName;
    }, 100); // Slight delay for smooth overlap
}

// Welcome & Settings & Profile
startBtn.addEventListener('click', () => {
    playPopSound();
    showScreen('gameHub');
});

document.getElementById('game-hub-back-btn').addEventListener('click', () => showScreen('welcome'));
document.getElementById('hub-category-btn').addEventListener('click', () => {
    playPopSound();
    showScreen('menu');
});
document.getElementById('hub-millionaire-btn').addEventListener('click', () => document.getElementById('millionaire-welcome-btn').click());
document.getElementById('hub-minesweeper-btn').addEventListener('click', () => document.getElementById('minesweeper-welcome-btn').click());
document.getElementById('hub-sudoku-btn').addEventListener('click', () => document.getElementById('sudoku-welcome-btn').click());
document.getElementById('hub-puzzle-btn').addEventListener('click', () => document.getElementById('puzzle-welcome-btn').click());
document.getElementById('hub-wordle-btn').addEventListener('click', () => document.getElementById('wordle-welcome-btn').click());
settingsBtn.addEventListener('click', () => {
    playPopSound();
    showScreen('settings');
});
backToWelcomeBtn.addEventListener('click', () => {
    playPopSound();
    showScreen('welcome');
});

// Minesweeper from Welcome Screen
const minesweeperWelcomeBtn = document.getElementById('minesweeper-welcome-btn');
if (minesweeperWelcomeBtn) {
    minesweeperWelcomeBtn.addEventListener('click', () => {
        playPopSound();
        showScreen('minesweeperSize');
    });
}

const profileBtn = document.getElementById('profile-btn');
const profileBtnMenu = document.getElementById('profile-btn-menu');
const backToWelcomeFromProfile = document.getElementById('back-to-welcome-from-profile');
const backToWelcomeFromMenu = document.getElementById('back-to-welcome-from-menu');

profileBtn.addEventListener('click', () => {
    playPopSound();
    previousScreen = currentScreen;
    document.getElementById('profile-points').textContent = totalPoints;
    renderAchievements();
    showScreen('profile');
});
profileBtnMenu.addEventListener('click', () => {
    playPopSound();
    previousScreen = currentScreen;
    document.getElementById('profile-points').textContent = totalPoints;
    renderAchievements();
    showScreen('profile');
});
backToWelcomeFromProfile.addEventListener('click', () => {
    playPopSound();
    showScreen(previousScreen || 'welcome');
});
backToWelcomeFromMenu.addEventListener('click', () => {
    playPopSound();
    showScreen('gameHub');
});

// Menu -> Difficulty
categoryBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        playPopSound();
        currentCategory = btn.getAttribute('data-category');
        const categoryName = btn.textContent.trim().replace(/^[^\w]+/, ''); // Remove emoji for title
        document.getElementById('selected-category-title').textContent = categoryName;

        // Personal Questions: skip difficulty, go straight to game
        if (currentCategory === 'personal') {
            currentDifficulty = null;
            startGame();
            return;
        }

        // Apply checkmarks to completed difficulties
        difficultyBtns.forEach(dBtn => {
            const diff = dBtn.getAttribute('data-diff');
            // Remove existing checkmark if any
            const existingCheck = dBtn.querySelector('.completed-check');
            if (existingCheck) existingCheck.remove();

            if (completedDifficulties[currentCategory][diff]) {
                const check = document.createElement('div');
                check.classList.add('completed-check');
                check.innerHTML = '✓';
                dBtn.appendChild(check);
            }
        });

        showScreen('difficulty');
    });
});

// Difficulty -> Game
difficultyBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        playPopSound();
        currentDifficulty = btn.getAttribute('data-diff');
        startGame();
    });
});

// Millionaire Mode
millionaireWelcomeBtn.addEventListener('click', () => {
    playPopSound();
    currentGameMode = 'millionaire';
    startMillionaireFlow();
});

backToMenuFromMillionaire.addEventListener('click', () => {
    playPopSound();
    stopMillionaireTimer();
    clearMillionaireCountdowns();
    // stop any Millionaire-specific audio
    stopAllMillionaireAudio();
    const appEl = document.getElementById('app');
    if (appEl) appEl.classList.remove('millionaire-active');
    showScreen('welcome');
    millionaireFlowActive = false;
    if (musicEnabled) playMusic();
});

const backToMenuFromMinesweeper = document.getElementById('back-to-menu-from-minesweeper');
backToMenuFromMinesweeper.addEventListener('click', () => {
    playPopSound();
    resetMinesweeper();
    // Return to the very first welcome screen (not categories)
    showScreen('welcome');
});

const backToMenuFromMinesweeperGame = document.getElementById('back-to-menu-from-minesweeper-game');
backToMenuFromMinesweeperGame.addEventListener('click', () => {
    playPopSound();
    resetMinesweeper();
    // Go back to the minesweeper size selector (previous page)
    showScreen('minesweeperSize');
});

const minesweeperNewGameBtn = document.getElementById('minesweeper-new-game-btn');
const minesweeperBackBtn = document.getElementById('minesweeper-back-btn');
const minesweeperDifficultySlides = Array.from(document.querySelectorAll('#minesweeper-difficulty-slides > [data-diff]'));
const minesweeperDifficultyPrevBtn = document.getElementById('minesweeper-difficulty-prev');
const minesweeperDifficultyNextBtn = document.getElementById('minesweeper-difficulty-next');
let minesweeperDifficultyIndex = 0;

function showMinesweeperDifficulty(index) {
    minesweeperDifficultyIndex = Math.max(0, Math.min(index, minesweeperDifficultySlides.length - 1));
    minesweeperDifficultySlides.forEach((slide, slideIndex) => {
        const isCurrent = slideIndex === minesweeperDifficultyIndex;
        slide.hidden = !isCurrent;
        slide.setAttribute('aria-hidden', String(!isCurrent));
    });
    minesweeperDifficultyPrevBtn.disabled = minesweeperDifficultyIndex === 0;
    minesweeperDifficultyNextBtn.disabled = minesweeperDifficultyIndex === minesweeperDifficultySlides.length - 1;
}

showMinesweeperDifficulty(0);
minesweeperDifficultyPrevBtn.addEventListener('click', () => showMinesweeperDifficulty(minesweeperDifficultyIndex - 1));
minesweeperDifficultyNextBtn.addEventListener('click', () => showMinesweeperDifficulty(minesweeperDifficultyIndex + 1));

function startMinesweeperDifficulty(difficulty, customSettings = null) {
    playPopSound();
    resetMinesweeper();
    if (initMinesweeper(difficulty, customSettings)) showScreen('minesweeper');
}

minesweeperNewGameBtn.addEventListener('click', () => {
    playPopSound();
    const difficulty = minesweeperState.difficulty || 'easy';
    const customSettings = difficulty === 'custom' ? { ...minesweeperState.customSettings } : null;
    resetMinesweeper();
    initMinesweeper(difficulty, customSettings);
});

minesweeperBackBtn.addEventListener('click', () => {
    playPopSound();
    resetMinesweeper();
    renderMinesweeperDifficultyBestTimes();
    // Go back to the minesweeper size selector (previous page)
    showScreen('minesweeperSize');
});

// Add event listeners for Minesweeper preset difficulty selection
document.querySelectorAll('#minesweeper-difficulty-slides button[data-diff]:not([data-diff="custom"])').forEach(btn => {
    btn.addEventListener('click', () => {
        startMinesweeperDifficulty(btn.getAttribute('data-diff'));
    });
});

document.querySelectorAll('.minesweeper-info-btn').forEach(infoButton => {
    infoButton.addEventListener('click', event => {
        event.stopPropagation();
        const popover = infoButton.nextElementSibling;
        const willOpen = popover.hidden;
        document.querySelectorAll('.minesweeper-info-popover').forEach(item => { item.hidden = true; });
        document.querySelectorAll('.minesweeper-info-btn').forEach(button => button.setAttribute('aria-expanded', 'false'));
        popover.hidden = !willOpen;
        infoButton.setAttribute('aria-expanded', String(willOpen));
    });
});

function renderMinesweeperDifficultyBestTimes() {
    let bestTimes = {};
    try {
        bestTimes = JSON.parse(localStorage.getItem('minesweeperPersonalBests') || '{}') || {};
    } catch {
        bestTimes = {};
    }
    document.querySelectorAll('.minesweeper-card-best-time').forEach(label => {
        let bestTime = Number(bestTimes[label.dataset.difficulty]);
        if (!Number.isFinite(bestTime)) {
            try {
                const legacyEntries = JSON.parse(localStorage.getItem('minesweeperLeaderboard') || '[]');
                bestTime = legacyEntries
                    .filter(entry => entry.difficulty === label.dataset.difficulty && Number.isFinite(Number(entry.time)))
                    .reduce((best, entry) => Math.min(best, Number(entry.time)), Infinity);
            } catch {
                bestTime = Infinity;
            }
        }
        label.textContent = Number.isFinite(bestTime) ? `Personal best: ${formatTime(bestTime)}` : 'Personal best: N/A';
    });
}

function updateMinesweeperHazardLabels() {
    const isOtterMode = document.getElementById('minesweeper-otter-mode-toggle').checked;
    const noun = isOtterMode ? 'Otters' : 'Mines';
    const modeLabel = document.getElementById('minesweeper-hazard-mode-label');
    const customLabel = document.getElementById('minesweeper-custom-hazard-label');
    if (modeLabel) modeLabel.textContent = isOtterMode ? 'Otters' : 'Mines';
    if (customLabel) customLabel.textContent = noun;
    document.querySelectorAll('.minesweeper-hazard-word').forEach(label => { label.textContent = `${noun}:`; });
    document.querySelectorAll('.minesweeper-density-info').forEach(label => {
        label.textContent = label.textContent.replace(/mine density|otter density/i, `${isOtterMode ? 'otter' : 'mine'} density`);
    });
    validateMinesweeperCustomSettings();
}

document.getElementById('minesweeper-otter-mode-toggle').addEventListener('change', updateMinesweeperHazardLabels);
renderMinesweeperDifficultyBestTimes();

const minesweeperCustomRows = document.getElementById('minesweeper-custom-rows');
const minesweeperCustomCols = document.getElementById('minesweeper-custom-cols');
const minesweeperCustomMines = document.getElementById('minesweeper-custom-mines');
const minesweeperCustomValidation = document.getElementById('minesweeper-custom-validation');
const minesweeperStartCustomBtn = document.getElementById('minesweeper-start-custom-btn');

function getMinesweeperCustomSettings() {
    const rows = Number(minesweeperCustomRows.value);
    const cols = Number(minesweeperCustomCols.value);
    const mines = Number(minesweeperCustomMines.value);
    const validDimensions = Number.isInteger(rows) && rows >= 5 && rows <= 30 &&
        Number.isInteger(cols) && cols >= 5 && cols <= 30;
    const cells = validDimensions ? rows * cols : 0;
    const validMines = Number.isInteger(mines) && mines >= 1 && mines < cells;
    return validDimensions && validMines ? { rows, cols, mines } : null;
}

function validateMinesweeperCustomSettings() {
    const rows = Number(minesweeperCustomRows.value);
    const cols = Number(minesweeperCustomCols.value);
    const hazardNoun = document.getElementById('minesweeper-otter-mode-toggle').checked ? 'otters' : 'mines';
    const validDimensions = Number.isInteger(rows) && rows >= 5 && rows <= 30 &&
        Number.isInteger(cols) && cols >= 5 && cols <= 30;

    if (validDimensions) minesweeperCustomMines.max = String(rows * cols - 1);
    const settings = getMinesweeperCustomSettings();
    minesweeperStartCustomBtn.disabled = !settings;
    if (!validDimensions) {
        minesweeperCustomValidation.textContent = 'Rows and columns must each be whole numbers from 5 to 30.';
    } else if (!settings) {
        minesweeperCustomValidation.textContent = `${hazardNoun} must be between 1 and ${rows * cols - 1}; leave at least one safe cell.`;
    } else {
        minesweeperCustomValidation.textContent = `${rows * cols} cells · ${settings.mines} ${hazardNoun} · at least one safe cell.`;
    }
}

[minesweeperCustomRows, minesweeperCustomCols, minesweeperCustomMines].forEach(input => {
    input.addEventListener('input', validateMinesweeperCustomSettings);
});
minesweeperStartCustomBtn.addEventListener('click', () => {
    const settings = getMinesweeperCustomSettings();
    if (!settings) {
        validateMinesweeperCustomSettings();
        return;
    }
    startMinesweeperDifficulty('custom', settings);
});
updateMinesweeperHazardLabels();

// Sudoku Mode
const sudokuScreen = document.getElementById('sudoku-screen');
const sudokuThemeToggle = document.getElementById('sudoku-theme-toggle');

function setSudokuTheme(theme) {
    const isLight = theme === 'light';
    sudokuScreen.classList.toggle('sudoku-light-theme', isLight);
    sudokuThemeToggle.textContent = isLight ? '🌙' : '☀️';
    sudokuThemeToggle.setAttribute('aria-label', `Switch to ${isLight ? 'dark' : 'light'} theme`);
    sudokuThemeToggle.title = `Switch to ${isLight ? 'dark' : 'light'} theme`;
    localStorage.setItem('sudokuTheme', isLight ? 'light' : 'dark');
}

setSudokuTheme(localStorage.getItem('sudokuTheme') === 'light' ? 'light' : 'dark');
sudokuThemeToggle.addEventListener('click', () => {
    setSudokuTheme(sudokuScreen.classList.contains('sudoku-light-theme') ? 'dark' : 'light');
});

const sudokuWelcomeBtn = document.getElementById('sudoku-welcome-btn');
if (sudokuWelcomeBtn) {
    sudokuWelcomeBtn.addEventListener('click', () => {
        playPopSound();
        showScreen('sudokuSize');
    });
}

const backToMenuFromSudoku = document.getElementById('back-to-menu-from-sudoku');
if (backToMenuFromSudoku) {
    backToMenuFromSudoku.addEventListener('click', () => {
        playPopSound();
        resetSudoku();
        // Navigate back to the welcome (first) screen
        showScreen('welcome');
    });
}

const backToMenuFromSudokuGame = document.getElementById('back-to-menu-from-sudoku-game');
if (backToMenuFromSudokuGame) {
    backToMenuFromSudokuGame.addEventListener('click', () => {
        playPopSound();
        resetSudoku();
        renderSudokuDifficultyBestTimes();
        // Go back to the sudoku difficulty selector (previous page)
        showScreen('sudokuSize');
    });
}

const sudokuNewGameBtn = document.getElementById('sudoku-new-game-btn');
const sudokuBackBtn = document.getElementById('sudoku-back-btn');

if (sudokuNewGameBtn) {
    sudokuNewGameBtn.addEventListener('click', () => {
        playPopSound();
        const difficulty = sudokuState.difficulty || 'medium';
        const customClues = difficulty === 'custom' ? sudokuState.clueCount : null;
        resetSudoku();
        initSudoku(difficulty, customClues);
    });
}

if (sudokuBackBtn) {
    sudokuBackBtn.addEventListener('click', () => {
        playPopSound();
        resetSudoku();
        renderSudokuDifficultyBestTimes();
        // Go back to the sudoku difficulty selector (previous page)
        showScreen('sudokuSize');
    });
}

const sudokuDifficultySlides = Array.from(document.querySelectorAll('#sudoku-difficulty-slides > [data-diff]'));
const sudokuDifficultyPrevBtn = document.getElementById('sudoku-difficulty-prev');
const sudokuDifficultyNextBtn = document.getElementById('sudoku-difficulty-next');
let sudokuDifficultyIndex = 0;

function showSudokuDifficulty(index) {
    sudokuDifficultyIndex = Math.max(0, Math.min(index, sudokuDifficultySlides.length - 1));
    sudokuDifficultySlides.forEach((slide, slideIndex) => {
        const isCurrent = slideIndex === sudokuDifficultyIndex;
        slide.hidden = !isCurrent;
        slide.setAttribute('aria-hidden', String(!isCurrent));
    });
    sudokuDifficultyPrevBtn.disabled = sudokuDifficultyIndex === 0;
    sudokuDifficultyNextBtn.disabled = sudokuDifficultyIndex === sudokuDifficultySlides.length - 1;
}

showSudokuDifficulty(0);
sudokuDifficultyPrevBtn.addEventListener('click', () => showSudokuDifficulty(sudokuDifficultyIndex - 1));
sudokuDifficultyNextBtn.addEventListener('click', () => showSudokuDifficulty(sudokuDifficultyIndex + 1));

function renderSudokuDifficultyBestTimes() {
    let bestTimes = {};
    try {
        bestTimes = JSON.parse(localStorage.getItem('sudokuPersonalBests') || '{}') || {};
    } catch {
        bestTimes = {};
    }
    let entries = [];
    try {
        entries = JSON.parse(localStorage.getItem('sudokuLeaderboard') || '[]');
        if (!Array.isArray(entries)) entries = [];
    } catch {
        entries = [];
    }
    document.querySelectorAll('#sudoku-difficulty-slides .minesweeper-card-best-time').forEach(label => {
        let bestTime = Number(bestTimes[label.dataset.difficulty]);
        if (!Number.isFinite(bestTime)) {
            bestTime = entries
                .filter(entry => entry.difficulty === label.dataset.difficulty && Number.isFinite(Number(entry.time)))
                .reduce((best, entry) => Math.min(best, Number(entry.time)), Infinity);
        }
        label.textContent = Number.isFinite(bestTime)
            ? `Personal best: ${formatLeaderboardTime(bestTime)}`
            : 'Personal best: N/A';
    });
}

renderSudokuDifficultyBestTimes();

document.querySelectorAll('#sudoku-difficulty-slides .minesweeper-difficulty-select').forEach(btn => {
    btn.addEventListener('click', () => {
        playPopSound();
        const difficulty = btn.getAttribute('data-diff');
        if (initSudoku(difficulty)) showScreen('sudoku');
    });
});

const sudokuCustomClues = document.getElementById('sudoku-custom-clues');
const sudokuCustomValidation = document.getElementById('sudoku-custom-validation');
const sudokuStartCustomBtn = document.getElementById('sudoku-start-custom-btn');

function validateSudokuCustomClues() {
    const clueCount = Number(sudokuCustomClues.value);
    const valid = Number.isInteger(clueCount) && clueCount >= 17 && clueCount <= 80;
    sudokuStartCustomBtn.disabled = !valid;
    sudokuCustomValidation.textContent = valid
        ? `Target: ${clueCount} clues · extra clues may remain to ensure a unique solution.`
        : 'Choose a whole number from 17 to 80 clues. A unique solution requires at least 17.';
}

sudokuCustomClues.addEventListener('input', validateSudokuCustomClues);
sudokuStartCustomBtn.addEventListener('click', () => {
    const clueCount = Number(sudokuCustomClues.value);
    if (!Number.isInteger(clueCount) || clueCount < 17 || clueCount > 80) {
        validateSudokuCustomClues();
        return;
    }
    playPopSound();
    if (initSudoku('custom', clueCount)) showScreen('sudoku');
});
validateSudokuCustomClues();

backToMenuFromMillionaireName.addEventListener('click', () => {
    playPopSound();
    stopMillionaireTimer();
    clearMillionaireCountdowns();
    stopAllMillionaireAudio();
    const appEl = document.getElementById('app');
    if (appEl) appEl.classList.remove('millionaire-active');
    showScreen('welcome');
    millionaireFlowActive = false;
    if (musicEnabled) playMusic();
});

millionaireNameInput.addEventListener('input', () => {
    const value = millionaireNameInput.value.trim();
    millionaireNameContinueBtn.disabled = value.length === 0;
    millionaireNamePreview.textContent = value ? `Contestant: ${value}` : '';
});

millionaireNameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !millionaireNameContinueBtn.disabled) {
        millionaireNameContinueBtn.click();
    }
});

millionaireNameContinueBtn.addEventListener('click', () => {
    const value = millionaireNameInput.value.trim();
    if (!value) return;
    millionaireContestantName = value;
    // Pre-unlock all millionaire audio tracks during the trusted click event
    [millionaireBg1, millionaireBg2, millionaireBg3, millionaireBg4, 
     millionaireAnswerPending, millionaireAnswerCorrect, millionaireAnswerWrong].forEach(track => {
        if (track) {
            try {
                track.volume = 0;
                const p = track.play();
                if (p !== undefined) p.catch(() => {});
                
                if (track === millionaireBg1) {
                    window.millionaireBg1UnlockedAndPlaying = true;
                } else {
                    track.pause();
                    track.currentTime = 0;
                }
            } catch(e) {}
        }
    });

    // Stop name selection loop
    if (millionaireNameAudio) { try { millionaireNameAudio.pause(); millionaireNameAudio.currentTime = 0; } catch(e) {} }
    millionaireNameContinueBtn.disabled = true;
    millionaireNameContinueBtn.textContent = 'Starting...';
    millionaireNamePreview.textContent = `Welcome, ${millionaireContestantName}!`;

    let proceeded = false;
    function proceedToGame() {
        if (proceeded) return;
        proceeded = true;
        clearMillionaireCountdowns();
        millionaireNameContinueBtn.textContent = 'Continue';
        startMillionaireGame();
    }

    // Play name_selected.mp3 once, then proceed to game
    if (millionaireNameSelectedAudio) {
        try {
            millionaireNameSelectedAudio.volume = Math.min(1.0, sfxVolume * 2);
            millionaireNameSelectedAudio.currentTime = 0;
            millionaireNameSelectedAudio.play().catch(() => {});
            millionaireNameSelectedAudio.addEventListener('ended', proceedToGame, { once: true });
        } catch(e) {}
    }
    // Fallback: proceed after 15s if audio doesn't trigger 'ended'
    millionaireNameStartTimeout = setTimeout(proceedToGame, 15000);
});

if (millionairePrizeToggle) {
    millionairePrizeToggle.addEventListener('click', () => {
        if (!millionaireSidebar) return;
        const expanded = millionaireSidebar.classList.toggle('expanded');
        millionairePrizeToggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
        millionairePrizeToggle.textContent = expanded ? '◀' : '▶';
    });
}

// Back Buttons
backToMenuBtn.addEventListener('click', () => {
    playPopSound();
    showScreen('menu');
});

const workoutWelcomeBtn = document.getElementById('workout-welcome-btn');
const workoutMenuBtn = document.getElementById('workout-program-btn');
const backToMenuFromWorkout = document.getElementById('back-to-menu-from-workout');
let workoutMenuReturnScreen = 'welcome';
let weightHistoryReturnScreen = 'workoutMenu';

function openWorkoutMenu() {
    workoutMenuReturnScreen = currentScreen;
    playPopSound();
    showScreen('workoutMenu');
}

if (workoutWelcomeBtn) {
    workoutWelcomeBtn.addEventListener('click', openWorkoutMenu);
}

if (workoutMenuBtn) {
    workoutMenuBtn.addEventListener('click', openWorkoutMenu);
}

if (backToMenuFromWorkout) {
    backToMenuFromWorkout.addEventListener('click', () => {
        playPopSound();
        showScreen('workoutMenu');
    });
}

document.getElementById('workout-menu-back-btn').addEventListener('click', () => showScreen(workoutMenuReturnScreen));
document.getElementById('workout-dashboard-btn').addEventListener('click', () => {
    playPopSound();
    renderWorkoutPlanner();
    showScreen('workout');
});
document.getElementById('workout-now-btn').addEventListener('click', () => {
    playPopSound();
    renderWorkoutNow();
    showScreen('workoutNow');
});
document.getElementById('workout-now-back-btn').addEventListener('click', () => showScreen('workoutMenu'));
document.getElementById('workout-health-btn').addEventListener('click', () => {
    playPopSound();
    openWeightHistoryScreen();
});

finishBtn.addEventListener('click', () => {
    playPopSound();
    showScreen('welcome');
});

exitGameBtn.addEventListener('click', () => {
    playPopSound();
    if (confirm("Are you sure you want to exit? Your progress won't be saved.")) {
        showScreen('menu');
    }
});

if (resetProfileBtn) {
    resetProfileBtn.addEventListener('click', () => {
        playPopSound();
        resetProfile();
    });
}

if (resetAllProgressBtn) {
    resetAllProgressBtn.addEventListener('click', () => {
        playPopSound();
        if (!confirm('Reset every stat, achievement, and workout plan across the app? This is permanent.')) return;
        const customWorkoutAchievements = localStorage.getItem('triviaWorkoutCustomAchievements');
        localStorage.clear();
        if (customWorkoutAchievements) {
            try {
                const definitions = JSON.parse(customWorkoutAchievements).map(achievement => ({ ...achievement, unlocked: false }));
                localStorage.setItem('triviaWorkoutCustomAchievements', JSON.stringify(definitions));
            } catch (error) {
                localStorage.removeItem('triviaWorkoutCustomAchievements');
            }
        }
        window.location.reload();
    });
}


// Achievements State
let achievements = {
    eu: { id: 'eu', name: "JPD to Bangladesh", desc: "Complete the EU category.", icon: '<img src="assets/eu_flag.png" style="width:100%;height:100%;object-fit:cover;border-radius:10px;display:block;">', unlocked: false },
    hungary: { id: 'hungary', name: "Bozmeg Orban!", desc: "Complete the Hungarian Politics category.", icon: '<img src="assets/orban.png" style="width:100%;height:100%;object-fit:cover;border-radius:10px;display:block;">', unlocked: false },
    romania: { id: 'romania', name: "Combinatie!", desc: "Complete the Romanian Politics category.", icon: '<img src="assets/romania_ach.png" style="width:100%;height:100%;object-fit:cover;border-radius:10px;display:block;">', unlocked: false },
    trains: { id: 'trains', name: "I'm not autistic I swear", desc: "Complete the Trains category.", icon: '<img src="assets/train_ach.png" style="width:100%;height:100%;object-fit:cover;border-radius:10px;display:block;">', unlocked: false },
    personal: { id: 'personal', name: "Amiga + promotion", desc: "Complete the Radu Questions category.", icon: '<img src="assets/cat_ring.png" style="width:100%;height:100%;object-fit:cover;border-radius:10px;display:block;">', unlocked: false },
    sudoCute: { id: 'sudoCute', name: "You so sudoCUTE", desc: "Win your first Sudoku game.", icon: '<img src="assets/sudoku_achievement.png" style="width:100%;height:100%;object-fit:cover;border-radius:10px;display:block;">', unlocked: false },
    millionaire: { id: 'millionaire', name: "Congrats! you are a Forint millionaire (still poor)", desc: "Complete the Millionaire game.", icon: '<img src="assets/millionaire_achievement.png" style="width:100%;height:100%;object-fit:cover;border-radius:10px;display:block;">', unlocked: false },
    minesweeper: { id: 'minesweeper', name: "You the bomb, but I'm the one about to explode", desc: "Win the Minesweeper game.", icon: '<img src="assets/minesweeper_achievement.png" style="width:100%;height:100%;object-fit:cover;border-radius:10px;display:block;">', unlocked: false },
    mayaOverload: { id: 'mayaOverload', name: "⚠️ Maya Overload ⚠️", desc: "Click Maya until she overloads.", icon: '<img src="assets/Maya_achievement.png" style="width:100%;height:100%;object-fit:cover;border-radius:10px;display:block;">', unlocked: false },
    hackerAttempt: { id: 'hackerAttempt', name: "I'm in!", desc: "Fail to enter the Dev password 5 times in a row.", icon: '<img src="assets/hacker_achievement.png" style="width:100%;height:100%;object-fit:cover;border-radius:10px;display:block;">', unlocked: false }
};
const WORKOUT_CUSTOM_ACHIEVEMENTS_KEY = 'triviaWorkoutCustomAchievements';
const DELETED_ACHIEVEMENTS_KEY = 'triviaDeletedAchievements';
let workoutAchievementPage = 0;
let workoutAchievementPhotoDraft = '';

function getDeletedAchievementIds() {
    try {
        const deletedIds = JSON.parse(localStorage.getItem(DELETED_ACHIEVEMENTS_KEY) || '[]');
        return new Set(Array.isArray(deletedIds) ? deletedIds : []);
    } catch (error) {
        localStorage.removeItem(DELETED_ACHIEVEMENTS_KEY);
        return new Set();
    }
}

function saveWorkoutCustomAchievements() {
    const custom = Object.values(achievements).filter(achievement => achievement.customWorkoutAchievement);
    localStorage.setItem(WORKOUT_CUSTOM_ACHIEVEMENTS_KEY, JSON.stringify(custom));
}

function saveData() {
    localStorage.setItem('triviaPoints', totalPoints);
    localStorage.setItem('triviaDifficulties', JSON.stringify(completedDifficulties));
    localStorage.setItem('triviaAchievements', JSON.stringify(achievements));
    saveWorkoutCustomAchievements();
}

function recalculatePoints() {
    let points = 0;
    Object.values(completedDifficulties).forEach(category => {
        if (category && typeof category === 'object') {
            Object.values(category).forEach(value => {
                if (value) points++;
            });
        }
    });
    if (achievements.millionaire && achievements.millionaire.unlocked) {
        points++;
    }
    totalPoints = points;
}

function updatePointsUI() {
    document.getElementById('total-points').textContent = totalPoints;
    if (typeof achievements !== 'undefined') evaluateAchievementTriggers({ points: totalPoints });
}

function resetProfile() {
    if (!confirm('Reset profile and erase all progress? This cannot be undone.')) return;
    
    totalPoints = 0;
    completedDifficulties = {
        eu: { easy: false, medium: false, hard: false, expert: false },
        hungary: { easy: false, medium: false, hard: false, expert: false },
        romania: { easy: false, medium: false, hard: false, expert: false },
        trains: { easy: false, medium: false, hard: false, expert: false },
        personal: { easy: false, medium: false, hard: false, expert: false }
    };
    Object.values(achievements).forEach(ach => ach.unlocked = false);
    
    localStorage.removeItem('triviaPoints');
    localStorage.removeItem('triviaDifficulties');
    localStorage.removeItem('triviaAchievements');
    localStorage.removeItem('qotdCompletedDate');
    localStorage.removeItem('qotdRandomIndex');
    localStorage.removeItem('qotdDate');
    
    updatePointsUI();
    renderAchievements();
    saveData();
    
    alert('Profile reset complete. All progress has been cleared.');
}

function loadData() {
    const savedPoints = localStorage.getItem('triviaPoints');
    if (savedPoints !== null) totalPoints = parseInt(savedPoints, 10);
    
    const savedDiffs = localStorage.getItem('triviaDifficulties');
    if (savedDiffs) completedDifficulties = JSON.parse(savedDiffs);
    
    const savedAch = localStorage.getItem('triviaAchievements');
    if (savedAch) {
        const parsedAch = JSON.parse(savedAch);
        Object.keys(parsedAch).forEach(key => {
            if (achievements[key]) {
                Object.assign(achievements[key], parsedAch[key]);
            }
        });
    }

    try {
        const customAchievements = JSON.parse(localStorage.getItem(WORKOUT_CUSTOM_ACHIEVEMENTS_KEY) || '[]');
        if (Array.isArray(customAchievements)) {
            customAchievements.forEach(achievement => {
                if (achievement?.id && achievement.customWorkoutAchievement) {
                    achievements[achievement.id] = achievement;
                }
            });
        }
    } catch (error) {
        localStorage.removeItem(WORKOUT_CUSTOM_ACHIEVEMENTS_KEY);
    }

    getDeletedAchievementIds().forEach(id => delete achievements[id]);

    recalculatePoints();
    updatePointsUI();

    // Load music preference
    const savedMusicPref = localStorage.getItem('triviaMusicPref');
    if (savedMusicPref !== null) {
        musicEnabled = savedMusicPref === 'true';
        musicToggle.checked = musicEnabled;
    }
    setVolumeRowVisible(musicVolumeRow, musicEnabled);

    // Load music volume
    const savedMusicVolume = localStorage.getItem('triviaMusicVolume');
    if (savedMusicVolume !== null) {
        musicVolumeSlider.value = savedMusicVolume;
        bgMusic.volume = parseFloat(savedMusicVolume);
    } else {
        musicVolumeSlider.value = 0.2;
        bgMusic.volume = 0.2;
    }

    // Load sound effects preference
    const savedSoundPref = localStorage.getItem('triviaSoundPref');
    if (savedSoundPref !== null) {
        soundEnabled = savedSoundPref === 'true';
        soundToggle.checked = soundEnabled;
    }
    setVolumeRowVisible(sfxVolumeRow, soundEnabled);

    // Load sound effects volume
    const savedSfxVolume = localStorage.getItem('triviaSfxVolume');
    if (savedSfxVolume !== null) {
        sfxVolume = parseFloat(savedSfxVolume);
        sfxVolumeSlider.value = sfxVolume;
    }
}

musicToggle.addEventListener('change', (e) => {
    musicEnabled = e.target.checked;
    localStorage.setItem('triviaMusicPref', musicEnabled);
    setVolumeRowVisible(musicVolumeRow, musicEnabled);
    if (musicEnabled) {
        if (!isMusicPlaying) playMusic();
    } else {
        bgMusic.pause();
        isMusicPlaying = false;
    }
});

musicVolumeSlider.addEventListener('input', (e) => {
    const volume = parseFloat(e.target.value);
    bgMusic.volume = volume;
    localStorage.setItem('triviaMusicVolume', volume);
});

soundToggle.addEventListener('change', (e) => {
    soundEnabled = e.target.checked;
    localStorage.setItem('triviaSoundPref', soundEnabled);
    setVolumeRowVisible(sfxVolumeRow, soundEnabled);
});

sfxVolumeSlider.addEventListener('input', (e) => {
    sfxVolume = parseFloat(e.target.value);
    localStorage.setItem('triviaSfxVolume', sfxVolume);
});

function playMusic() {
    if (musicEnabled && !isMusicPlaying && !millionaireFlowActive) {
        const volume = parseFloat(musicVolumeSlider.value) || 0.3;
        bgMusic.volume = volume;
        bgMusic.play().then(() => {
            isMusicPlaying = true;
        }).catch(err => {
            console.log("Autoplay blocked by browser. Awaiting interaction.");
        });
    }
}

function playPopSound() {
    if (soundEnabled) {
        sfxPopSound.volume = sfxVolume;
        sfxPopSound.currentTime = 0;
        sfxPopSound.play().catch(err => {
            // Silently fail if autoplay is blocked
        });
    }
}



function stopAllMillionaireAudio() {
    if (millionaireIntroAudio) { try { millionaireIntroAudio.pause(); millionaireIntroAudio.currentTime = 0; } catch(e) {} }
    if (millionaireNameAudio) { try { millionaireNameAudio.pause(); millionaireNameAudio.currentTime = 0; } catch(e) {} }
    if (millionaireNameSelectedAudio) { try { millionaireNameSelectedAudio.pause(); millionaireNameSelectedAudio.currentTime = 0; } catch(e) {} }
    if (millionaireBg1) { try { millionaireBg1.pause(); } catch(e) {} }
    if (millionaireBg2) { try { millionaireBg2.pause(); } catch(e) {} }
    if (millionaireBg3) { try { millionaireBg3.pause(); } catch(e) {} }
    if (millionaireBg4) { try { millionaireBg4.pause(); } catch(e) {} }
    if (millionaireAnswerPending) { try { millionaireAnswerPending.pause(); millionaireAnswerPending.currentTime = 0; } catch(e) {} }
    if (millionaireAnswerCorrect) { try { millionaireAnswerCorrect.pause(); millionaireAnswerCorrect.currentTime = 0; } catch(e) {} }
    if (millionaireAnswerWrong) { try { millionaireAnswerWrong.pause(); millionaireAnswerWrong.currentTime = 0; } catch(e) {} }
}

function startMillionaireBgMusic() {
    if (!musicEnabled) return;
    const vol = parseFloat(musicVolumeSlider.value) || 0.3;
    let activeTrack = null;
    if (millionaireCurrentIndex <= 4) activeTrack = millionaireBg1;
    else if (millionaireCurrentIndex <= 9) activeTrack = millionaireBg2;
    else if (millionaireCurrentIndex <= 13) activeTrack = millionaireBg3;
    else activeTrack = millionaireBg4;
    
    const tracks = [millionaireBg1, millionaireBg2, millionaireBg3, millionaireBg4];
    tracks.forEach(track => {
        if (track && track !== activeTrack && !track.paused) {
            try { track.pause(); track.currentTime = 0; } catch(e) {}
        }
    });

    if (activeTrack) {
        try {
            activeTrack.volume = vol;
            if (activeTrack === millionaireBg1 && window.millionaireBg1UnlockedAndPlaying) {
                window.millionaireBg1UnlockedAndPlaying = false;
            } else {
                if (activeTrack.paused) activeTrack.play().catch(() => {});
            }
        } catch(e) {}
    }
}

function startMillionaireFlow() {
    if (millionaireFlowActive) return;
    millionaireFlowActive = true;
    clearMillionaireCountdowns();
    stopMillionaireTimer();
    if (bgMusic && !bgMusic.paused) {
        bgMusic.pause();
        isMusicPlaying = false;
    }
    millionaireNameInput.value = '';
    millionaireNameContinueBtn.disabled = true;
    millionaireNameContinueBtn.textContent = 'Continue';
    millionaireNamePreview.textContent = '';
    // Play intro track once on the title screen
    showScreen('millionaireTitle');
    millionaireTitleTransitioned = false;

    function transitionToName() {
        if (millionaireTitleTransitioned) return;
        millionaireTitleTransitioned = true;
        // Hide skip button
        const skipIntroBtn = document.getElementById('millionaire-skip-intro-btn');
        if (skipIntroBtn) skipIntroBtn.style.display = 'none';
        // stop intro and start name selection loop
        if (millionaireIntroAudio) {
            try { millionaireIntroAudio.pause(); millionaireIntroAudio.currentTime = 0; } catch(e) {}
        }
        if (millionaireNameAudio) {
            try {
                millionaireNameAudio.currentTime = 0;
                millionaireNameAudio.loop = true;
                millionaireNameAudio.play().catch(() => {
                    // If browser blocks autoplay, try again on next user interaction
                    const retry = () => { try { millionaireNameAudio.play().catch(()=>{}); } catch(e){} }; 
                    document.addEventListener('click', retry, { once: true });
                });
            } catch(e) {}
        }
        showScreen('millionaireName');
        if (millionaireTitleTimeout) { clearTimeout(millionaireTitleTimeout); millionaireTitleTimeout = null; }
    }

    const skipIntroBtn = document.getElementById('millionaire-skip-intro-btn');
    if (skipIntroBtn) {
        const isDev = localStorage.getItem('devMode') === 'true';
        skipIntroBtn.style.display = isDev ? 'block' : 'none';
        skipIntroBtn.onclick = () => {
            transitionToName();
        };
    }

    if (millionaireIntroAudio) {
        try {
            millionaireIntroAudio.currentTime = 0;
            millionaireIntroAudio.play().catch(() => {
                // If autoplay blocked, still schedule transition after timeout
            });
            millionaireIntroAudio.addEventListener('ended', transitionToName, { once: true });
        } catch(e) {}
    }

    millionaireTitleTimeout = setTimeout(() => {
        transitionToName();
    }, 15000);
}

function clearMillionaireCountdowns() {
    if (millionaireTitleTimeout) {
        clearTimeout(millionaireTitleTimeout);
        millionaireTitleTimeout = null;
    }
    if (millionaireNameStartTimeout) {
        clearTimeout(millionaireNameStartTimeout);
        millionaireNameStartTimeout = null;
    }
}

function unlockAchievement(id) {
    if (!achievements[id] || achievements[id].unlocked) return;
    achievements[id].unlocked = true;
    showToast(achievements[id]);
    renderAchievements();
    renderWorkoutAchievements();
    saveData();
}

function showToast(ach) {
    playPopSound();
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    const isAchievement = typeof achievements !== 'undefined'
        && ach.id
        && achievements[ach.id]
        && achievements[ach.id] === ach;
    toast.innerHTML = `
        <div class="toast-icon">${ach.icon}</div>
        <div class="toast-content">
            <h4 style="margin: 0; color: var(--secondary); font-size: 1.1rem;">${isAchievement ? 'Achievement Unlocked!' : 'Notice'}</h4>
            <p style="margin: 5px 0 0 0; color: white; font-size: 0.9rem;">${ach.name}</p>
        </div>
    `;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4500);
}

function showTaskCompleteToast(description) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    playPopSound();
    const toast = document.createElement('div');
    toast.className = 'toast task-complete-toast';
    const icon = document.createElement('div');
    icon.className = 'toast-icon';
    icon.textContent = '✅';
    const content = document.createElement('div');
    content.className = 'toast-content';
    const title = document.createElement('h4');
    title.textContent = 'Task Complete';
    title.style.cssText = 'margin: 0; color: var(--secondary); font-size: 1.1rem;';
    const message = document.createElement('p');
    message.textContent = description;
    message.style.cssText = 'margin: 5px 0 0; color: white; font-size: 0.9rem;';
    content.append(title, message);
    toast.append(icon, content);
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 6500);
}

function renderAchievements() {
    const list = document.getElementById('achievements-list');
    list.innerHTML = '';
    Object.values(achievements).forEach(ach => {
        const card = document.createElement('div');
        card.className = `achievement-card ${ach.unlocked ? 'unlocked' : ''}`;
        const blurStyle = ach.unlocked ? '' : 'filter: blur(5.12px); opacity: 0.6;';
        card.innerHTML = `
            <div class="achievement-icon" style="${blurStyle}">${ach.icon}</div>
            <div>
                <h4 style="color: var(--secondary); margin: 0 0 5px 0;">${ach.unlocked ? ach.name : '???'}</h4>
                <p style="font-size: 0.9rem; color: var(--text-muted); margin: 0;">${ach.desc}</p>
            </div>
        `;
        
        if (localStorage.getItem('devMode') === 'true') {
            card.style.cursor = 'pointer';
            card.title = ach.unlocked ? 'Click to re-lock (Dev)' : 'Click to unlock (Dev)';
            card.addEventListener('click', () => {
                if (!ach.unlocked) {
                    unlockAchievement(ach.id);
                } else {
                    // Re-lock the achievement
                    ach.unlocked = false;
                    saveData();
                    renderAchievements();
                }
            });
        }
        
        list.appendChild(card);
    });
}

const workoutExerciseCatalog = [
    { id: 'bench-press', name: 'Bench Press', category: 'chest', sets: 4, reps: 8, weight: 20, duration: 45, rest: 60, description: 'Press from a flat bench with a strong full-body brace.' },
    { id: 'incline-press', name: 'Incline Press', category: 'chest', sets: 3, reps: 10, weight: 15, duration: 45, rest: 60, description: 'Target the upper chest with controlled bar speed.' },
    { id: 'push-up', name: 'Push Ups', category: 'upper body', sets: 3, reps: 12, weight: 0, duration: 35, rest: 45, description: 'Bodyweight press that hits chest, shoulders and triceps.' },
    { id: 'overhead-press', name: 'Overhead Press', category: 'upper body', sets: 4, reps: 8, weight: 10, duration: 40, rest: 60, description: 'Drive through with strict pressing form.' },
    { id: 'bicep-curl', name: 'Bicep Curl', category: 'arms', sets: 3, reps: 12, weight: 8, duration: 35, rest: 45, description: 'Curl the weight with a strong squeeze at the top.' },
    { id: 'tricep-dips', name: 'Tricep Dips', category: 'arms', sets: 3, reps: 10, weight: 0, duration: 35, rest: 45, description: 'Use bench or chair to control each rep.' },
    { id: 'squat', name: 'Back Squat', category: 'legs', sets: 4, reps: 8, weight: 35, duration: 50, rest: 75, description: 'Standard lower-body lift to build strength and power.' },
    { id: 'lunge', name: 'Walking Lunge', category: 'legs', sets: 3, reps: 10, weight: 10, duration: 40, rest: 50, description: 'Strong single-leg control with an upright posture.' },
    { id: 'hip-thrust', name: 'Hip Thrust', category: 'glutes', sets: 4, reps: 10, weight: 25, duration: 45, rest: 60, description: 'Drive through the hips and keep the ribs down.' },
    { id: 'deadlift', name: 'Romanian Deadlift', category: 'glutes', sets: 3, reps: 8, weight: 30, duration: 45, rest: 60, description: 'Hinge at the hips and control the lower back.' },
    { id: 'kettlebell-swing', name: 'Kettlebell Swing', category: 'kettlebell', sets: 4, reps: 12, weight: 12, duration: 35, rest: 45, description: 'Explosive hip drive and a full range of motion.' },
    { id: 'goblet-squat', name: 'Goblet Squat', category: 'kettlebell', sets: 3, reps: 12, weight: 12, duration: 40, rest: 45, description: 'Hold the kettlebell close and maintain depth.' },
    { id: 'plank', name: 'Plank Hold', category: 'core', sets: 3, reps: 1, weight: 0, duration: 45, rest: 30, description: 'Keep the torso braced and maintain a straight line.' },
    { id: 'jump-rope', name: 'Jump Rope', category: 'conditioning', sets: 4, reps: 20, weight: 0, duration: 40, rest: 30, description: 'Short cardio bursts to keep the heart rate up.' }
];

function getWorkoutExerciseCatalog() {
    let overrides = {};
    try {
        overrides = JSON.parse(localStorage.getItem('triviaWorkoutExerciseOverrides') || '{}');
    } catch (error) {
        localStorage.removeItem('triviaWorkoutExerciseOverrides');
    }
    return workoutExerciseCatalog.map(exercise => ({
        ...exercise,
        ...(overrides[exercise.id] || {}),
        id: exercise.id
    }));
}

const workoutAchievementTemplates = {
    firstWorkout: { id: 'firstWorkout', name: 'First Lift', desc: 'Complete your first workout day.', icon: '🏆', unlocked: false },
    workout3: { id: 'workout3', name: '3 Exercise Landmark', desc: 'Complete 3 total exercises.', icon: '💪', unlocked: false },
    workout5: { id: 'workout5', name: '5 Exercise Landmark', desc: 'Complete 5 total exercises.', icon: '🔥', unlocked: false },
    workout10: { id: 'workout10', name: '10 Exercise Landmark', desc: 'Complete 10 total exercises.', icon: '⚡', unlocked: false },
    workout15: { id: 'workout15', name: '15 Exercise Landmark', desc: 'Complete 15 total exercises.', icon: '🌟', unlocked: false },
    workout30: { id: 'workout30', name: '30 Exercise Landmark', desc: 'Complete 30 total exercises.', icon: '👑', unlocked: false }
};

const workoutState = {
    currentWeekStart: getMonday(new Date()),
    selectedDayIndex: 0,
    activeFilter: 'all',
    editingExerciseId: null,
    editingExerciseMode: 'new',
    timerInterval: null,
    activeDayDate: null,
    activeExerciseIndex: null,
    timerRemaining: 0,
    timerMode: 'idle',
    editingDayExercise: false,
    stopwatchMode: 'stopwatch',
    stopwatchRunning: false,
    stopwatchInterval: null,
    stopwatchElapsed: 0,
    stopwatchStartedAt: 0,
    stopwatchRemaining: 300,
    stopwatchTotal: 300,
    weeks: []
};
let workoutCalendarMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
let workoutCalendarEditingDate = null;
let workoutMenuStatusTimer = null;

document.addEventListener('visibilitychange', () => {
    if (!document.hidden && currentScreen === 'workoutMenu') updateWorkoutMenuDayStatus();
});

const WORKOUT_WEEKLY_TEMPLATE_KEY = 'triviaWorkoutWeeklyTemplate';

function getWorkoutWeeklyTemplates() {
    try {
        const templates = JSON.parse(localStorage.getItem(WORKOUT_WEEKLY_TEMPLATE_KEY) || '{}');
        return templates && typeof templates === 'object' ? templates : {};
    } catch (error) {
        return {};
    }
}

function cloneWorkoutExercises(exercises, dayDate) {
    return (exercises || []).map((exercise, index) => ({
        ...exercise,
        id: `${exercise.id || 'exercise'}-${dayDate}-${index}`,
        completed: false,
        currentSet: 1
    }));
}

function saveWorkoutDayTemplate(day, dayIndex) {
    if (!day) return;
    const today = isoDate(new Date());
    if (day.date < today) {
        saveWorkoutData();
        return;
    }

    const templates = getWorkoutWeeklyTemplates();
    templates[dayIndex] = createWorkoutDayTemplate(day);
    localStorage.setItem(WORKOUT_WEEKLY_TEMPLATE_KEY, JSON.stringify(templates));

    workoutState.weeks.forEach(week => {
        const futureDay = week.days.find(candidate => candidate.date > day.date && candidate.date >= today && getWorkoutDayIndex(candidate.date) === dayIndex);
        if (futureDay) applyWorkoutTemplateToDay(futureDay, templates[dayIndex]);
    });
    saveWorkoutData();
}

function createWorkoutDayTemplate(day) {
    return {
        type: day.type,
        exercises: (day.exercises || []).map(({ id, completed, currentSet, ...exercise }) => ({ ...exercise }))
    };
}

function getWorkoutDayIndex(dateValue) {
    const day = parseWorkoutDate(dateValue).getDay();
    return (day + 6) % 7;
}

function applyWorkoutTemplateToDay(day, template) {
    day.type = template.type;
    day.exercises = template.type === 'workout' ? cloneWorkoutExercises(template.exercises, day.date) : [];
    day.completed = false;
    day.manualCompleted = false;
    day.manualMissed = false;
    delete day.savedExercisesForWorkout;
}

function ensureWorkoutWeeklyTemplates() {
    const templates = getWorkoutWeeklyTemplates();
    const currentDateWeekStart = isoDate(getMonday(new Date()));
    const week = workoutState.weeks.find(item => item.weekStart === currentDateWeekStart) || getWorkoutWeekForCurrentView();
    let changed = false;
    week.days.forEach((day, index) => {
        if (templates[index]) return;
        templates[index] = {
            type: day.type,
            exercises: (day.exercises || []).map(({ id, completed, currentSet, ...exercise }) => ({ ...exercise }))
        };
        changed = true;
    });
    if (changed) localStorage.setItem(WORKOUT_WEEKLY_TEMPLATE_KEY, JSON.stringify(templates));
}

function getWorkoutCategories() {
    const saved = JSON.parse(localStorage.getItem('triviaWorkoutCategories') || 'null');
    const base = ['chest', 'upper body', 'arms', 'legs', 'glutes', 'core', 'kettlebell', 'conditioning'];
    if (!saved || !Array.isArray(saved) || !saved.length) {
        return base;
    }
    return Array.from(new Set([...base, ...saved]));
}

function formatWorkoutCategoryLabel(category) {
    const label = String(category || '');
    return label ? `${label.charAt(0).toUpperCase()}${label.slice(1)}` : label;
}

function saveWorkoutCategories(categories) {
    localStorage.setItem('triviaWorkoutCategories', JSON.stringify(categories));
}

function hydrateWorkoutCategoriesSelect() {
    const categorySelect = document.getElementById('workout-exercise-category');
    if (!categorySelect) return;
    const categories = getWorkoutCategories();
    const selected = categorySelect.value;
    categorySelect.innerHTML = '<option value="">Select a category</option>' + categories.map(cat => `<option value="${cat}">${formatWorkoutCategoryLabel(cat)}</option>`).join('');
    categorySelect.value = categories.includes(selected) ? selected : '';
}

function addWorkoutCategory() {
    const input = document.getElementById('workout-new-category-input');
    const category = (input?.value || '').trim();
    if (!category) return;
    const categories = getWorkoutCategories();
    const normalized = category.toLowerCase();
    if (!categories.includes(normalized)) {
        categories.push(normalized);
        saveWorkoutCategories(categories);
    }
    input.value = '';
    hydrateWorkoutCategoriesSelect();
    document.getElementById('workout-exercise-category').value = normalized;
    workoutState.activeFilter = 'all';
    renderWorkoutPlanner();
}

function isoDate(d) {
    const date = parseWorkoutDate(d);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function parseWorkoutDate(value) {
    if (typeof value === 'string') {
        const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    }
    return new Date(value);
}

function getMonday(date) {
    const d = parseWorkoutDate(date);
    const day = d.getDay();
    const diff = (day === 0 ? -6 : 1 - day);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + diff);
    return d;
}

function createWorkoutDay(date, type, exercises) {
    return {
        date: isoDate(date),
        dayLabel: date.toLocaleDateString(undefined, { weekday: 'short' }),
        type: type === undefined ? 'rest' : type,
        exercises: exercises || [],
        completed: false
    };
}

function createDefaultWorkoutWeek(weekStart) {
    const days = [];
    const defaults = [
        { type: 'workout', exercises: [
            { ...getWorkoutExerciseCatalog()[0], id: `${workoutExerciseCatalog[0].id}-${Date.now()}-1`, completed: false },
            { ...getWorkoutExerciseCatalog()[7], id: `${workoutExerciseCatalog[7].id}-${Date.now()}-2`, completed: false }
        ] },
        { type: 'workout', exercises: [
            { ...getWorkoutExerciseCatalog()[6], id: `${workoutExerciseCatalog[6].id}-${Date.now()}-3`, completed: false },
            { ...getWorkoutExerciseCatalog()[9], id: `${workoutExerciseCatalog[9].id}-${Date.now()}-4`, completed: false }
        ] },
        { type: 'rest', exercises: [] },
        { type: 'workout', exercises: [
            { ...getWorkoutExerciseCatalog()[2], id: `${workoutExerciseCatalog[2].id}-${Date.now()}-5`, completed: false },
            { ...getWorkoutExerciseCatalog()[3], id: `${workoutExerciseCatalog[3].id}-${Date.now()}-6`, completed: false }
        ] },
        { type: 'workout', exercises: [
            { ...getWorkoutExerciseCatalog()[8], id: `${workoutExerciseCatalog[8].id}-${Date.now()}-7`, completed: false },
            { ...getWorkoutExerciseCatalog()[12], id: `${workoutExerciseCatalog[12].id}-${Date.now()}-8`, completed: false }
        ] },
        { type: 'workout', exercises: [
            { ...getWorkoutExerciseCatalog()[10], id: `${workoutExerciseCatalog[10].id}-${Date.now()}-9`, completed: false },
            { ...getWorkoutExerciseCatalog()[11], id: `${workoutExerciseCatalog[11].id}-${Date.now()}-10`, completed: false }
        ] },
        { type: 'rest', exercises: [] }
    ];

    const templates = getWorkoutWeeklyTemplates();
    const startDate = parseWorkoutDate(weekStart);
    for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        const dateKey = isoDate(date);
        const template = templates[i];
        const config = template || defaults[i];
        const exercises = config.type === 'workout'
            ? cloneWorkoutExercises(template ? config.exercises : config.exercises, dateKey)
            : [];
        days.push(createWorkoutDay(date, config.type, exercises));
    }
    return { weekStart: isoDate(weekStart), days };
}

function ensureWorkoutState() {
    const saved = JSON.parse(localStorage.getItem('triviaWorkoutProgram') || 'null');
    const baseWeek = getMonday(new Date());

    if (saved && Array.isArray(saved.weeks) && saved.weeks.length) {
        workoutState.weeks = saved.weeks;
        workoutState.currentWeekStart = saved.currentWeekStart || isoDate(baseWeek);
    } else {
        workoutState.weeks = [createDefaultWorkoutWeek(baseWeek)];
        workoutState.currentWeekStart = isoDate(baseWeek);
        saveWorkoutData();
    }

    const currentStart = isoDate(baseWeek);
    if (!workoutState.weeks.some(week => week.weekStart === currentStart)) {
        workoutState.weeks.unshift(createDefaultWorkoutWeek(baseWeek));
    }

    workoutState.currentWeekStart = workoutState.currentWeekStart || currentStart;
    workoutState.selectedDayIndex = (new Date().getDay() + 6) % 7;
    stopWorkoutTimer();
}

function saveWorkoutData() {
    const payload = {
        currentWeekStart: workoutState.currentWeekStart,
        weeks: workoutState.weeks
    };
    localStorage.setItem('triviaWorkoutProgram', JSON.stringify(payload));
}

function getSavedWorkoutPlans() {
    try {
        const saved = JSON.parse(localStorage.getItem('triviaWorkoutSavedPlans') || '[]');
        return Array.isArray(saved) ? saved : [];
    } catch (error) {
        return [];
    }
}

function getWorkoutPlanSnapshot(name) {
    return {
        id: `plan-${Date.now()}`,
        name,
        savedAt: new Date().toISOString(),
        currentWeekStart: workoutState.currentWeekStart,
        weeks: JSON.parse(JSON.stringify(workoutState.weeks)),
        weeklyTemplates: getWorkoutWeeklyTemplates(),
        categories: getWorkoutCategories(),
        customExercises: JSON.parse(localStorage.getItem('triviaWorkoutCustomExercises') || '[]')
    };
}

function renderSavedWorkoutPlans() {
    const select = document.getElementById('workout-saved-plans-select');
    const switchButton = document.getElementById('workout-switch-plan-btn');
    if (!select || !switchButton) return;
    const plans = getSavedWorkoutPlans();
    const selected = select.value;
    select.replaceChildren(new Option('Choose a saved plan', ''));
    plans.forEach(plan => select.add(new Option(plan.name, plan.id)));
    if (plans.some(plan => plan.id === selected)) select.value = selected;
    switchButton.disabled = plans.length === 0 || !select.value;
}

function saveNamedWorkoutPlan() {
    const nameInput = document.getElementById('workout-plan-name-input');
    const name = (nameInput?.value || '').trim();
    if (!name) {
        showToast({ icon: '⚠️', name: 'Plan name required', desc: 'Enter a name before saving this workout plan.' });
        nameInput?.focus();
        return;
    }
    const plans = getSavedWorkoutPlans();
    const snapshot = getWorkoutPlanSnapshot(name);
    plans.push(snapshot);
    localStorage.setItem('triviaWorkoutSavedPlans', JSON.stringify(plans));
    if (nameInput) nameInput.value = '';
    renderSavedWorkoutPlans();
    document.getElementById('workout-saved-plans-select').value = snapshot.id;
    document.getElementById('workout-switch-plan-btn').disabled = false;
    showToast({ icon: '💾', name: 'Workout plan saved', desc: `${name} is ready to switch to later.` });
}

function switchToSavedWorkoutPlan() {
    const planId = document.getElementById('workout-saved-plans-select')?.value;
    const plan = getSavedWorkoutPlans().find(item => item.id === planId);
    if (!plan) return;
    if (!confirm(`Switch to “${plan.name}”? Your current workout plan will be replaced by the saved copy.`)) return;
    workoutState.weeks = JSON.parse(JSON.stringify(plan.weeks));
    workoutState.currentWeekStart = plan.currentWeekStart || plan.weeks[0].weekStart;
    workoutState.selectedDayIndex = (new Date().getDay() + 6) % 7;
    localStorage.setItem(WORKOUT_WEEKLY_TEMPLATE_KEY, JSON.stringify(plan.weeklyTemplates || {}));
    localStorage.setItem('triviaWorkoutCategories', JSON.stringify(plan.categories || getWorkoutCategories()));
    localStorage.setItem('triviaWorkoutCustomExercises', JSON.stringify(plan.customExercises || []));
    saveWorkoutData();
    hydrateWorkoutCategoriesSelect();
    renderWorkoutPlanner();
    showToast({ icon: '📂', name: 'Workout plan switched', desc: `Loaded ${plan.name}.` });
}

function resetActiveWorkoutProgram() {
    if (!confirm('Start a new workout program? This clears the current schedule and starts the week with seven rest days and no exercises. Saved plans, achievements, and tracked stats remain.')) return;

    snapshotWorkoutMetricBaseline();
    stopWorkoutTimer();
    workoutState.activeDayDate = null;
    workoutState.activeExerciseIndex = null;
    workoutState.timerMode = 'idle';
    workoutState.timerRemaining = 0;
    const today = isoDate(new Date());
    const currentStart = isoDate(getMonday(new Date()));
    const templates = Object.fromEntries(Array.from({ length: 7 }, (_, index) => [index, { type: 'rest', exercises: [] }]));
    localStorage.setItem(WORKOUT_WEEKLY_TEMPLATE_KEY, JSON.stringify(templates));
    localStorage.setItem('triviaWorkoutProgramStartDate', today);
    workoutState.weeks = [createDefaultWorkoutWeek(parseWorkoutDate(currentStart))];
    workoutState.currentWeekStart = currentStart;
    workoutState.selectedDayIndex = (new Date().getDay() + 6) % 7;
    saveWorkoutData();
    renderWorkoutPlanner();
    showToast({ icon: '🆕', name: 'New program ready', desc: 'All seven days this week are rest days with no exercises.' });
}

function getWorkoutWeekForCurrentView() {
    const weekStart = isoDate(parseWorkoutDate(workoutState.currentWeekStart));
    let week = workoutState.weeks.find(item => item.weekStart === weekStart);
    if (!week) {
        const date = parseWorkoutDate(workoutState.currentWeekStart);
        week = createDefaultWorkoutWeek(date);
        const today = isoDate(new Date());
        week.days.forEach(day => {
            if (day.date < today) {
                day.type = null;
                day.exercises = [];
                day.completed = false;
            }
        });
        workoutState.weeks.unshift(week);
    }
    return week;
}

function getWorkoutDayForDate(dateString) {
    const expectedWeekStart = isoDate(getMonday(parseWorkoutDate(dateString)));
    const canonicalWeek = workoutState.weeks.find(week => week.weekStart === expectedWeekStart);
    const canonicalDay = canonicalWeek?.days.find(day => day.date === dateString);
    if (canonicalDay) return canonicalDay;
    return workoutState.weeks.flatMap(week => week.days || []).find(day => day.date === dateString) || null;
}

function getTodayWorkoutDay(today = new Date()) {
    const dateKey = isoDate(today);
    const weekStart = isoDate(getMonday(today));
    let week = workoutState.weeks.find(item => item.weekStart === weekStart);
    if (!week) {
        week = createDefaultWorkoutWeek(parseWorkoutDate(weekStart));
        week.days.forEach(day => {
            if (day.date < dateKey) {
                day.type = null;
                day.exercises = [];
                day.completed = false;
            }
        });
        workoutState.weeks.unshift(week);
        saveWorkoutData();
    }
    return week.days.find(item => item.date === dateKey) || null;
}

function updateWorkoutMenuDayStatus() {
    const status = document.getElementById('workout-now-day-status');
    if (!status) return;
    const type = getTodayWorkoutDay()?.type;
    status.dataset.dayType = type || 'none';
    status.textContent = type === 'rest' ? 'Rest Day' : type === 'workout' ? 'Workout Day' : 'No plan';
    clearTimeout(workoutMenuStatusTimer);
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    workoutMenuStatusTimer = setTimeout(() => {
        if (currentScreen === 'workoutMenu') updateWorkoutMenuDayStatus();
    }, midnight - now + 50);
}

function renderWorkoutNow() {
    const today = new Date();
    const day = getTodayWorkoutDay(today);
    document.getElementById('workout-now-date').textContent = today.toLocaleDateString(undefined, {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
    });
    const container = document.getElementById('workout-now-list');
    container.replaceChildren();
    if (!day || day.type === null) {
        container.textContent = 'No workout scheduled for today.';
    } else if (day.type === 'rest') {
        const rest = document.createElement('p');
        rest.className = 'workout-now-rest';
        rest.textContent = 'REST DAY, time to rest';
        container.appendChild(rest);
    } else if (!day.exercises?.length) {
        container.textContent = 'No exercises scheduled for today.';
    } else {
        const list = document.createElement('ol');
        list.className = 'workout-now-exercises';
        day.exercises.forEach((exercise, index) => {
            const item = document.createElement('li');
            item.dataset.exerciseIndex = String(index);
            const name = document.createElement('strong');
            name.textContent = exercise.name;
            const details = document.createElement('span');
            details.textContent = [
                `${exercise.sets} sets`,
                exercise.repsTillFailure ? "'Till Failure" : `${exercise.reps} reps`,
                exercise.bodyWeight ? 'Body Weight' : `${exercise.weight || 0} kg`,
                `${exercise.rest || 60}s rest`
            ].join(' • ');
            const controls = document.createElement('div');
            controls.className = 'exercise-start-control workout-now-controls';
            const start = document.createElement('button');
            start.type = 'button';
            start.className = 'start-btn';
            start.dataset.action = 'start';
            start.addEventListener('click', () => startWorkoutExercise(day, index));
            const complete = document.createElement('button');
            complete.type = 'button';
            complete.className = 'complete-exercise-btn';
            complete.dataset.action = 'complete';
            complete.addEventListener('click', () => completeWorkoutExercise(day, index));
            const skip = document.createElement('button');
            skip.type = 'button';
            skip.className = 'skip-workout-phase-btn';
            skip.dataset.action = 'skip';
            skip.textContent = 'Skip Timer →';
            skip.addEventListener('click', skipWorkoutTimerPhase);
            controls.append(start, skip, complete);
            item.append(name, details, controls);
            list.appendChild(item);
        });
        container.appendChild(list);
        refreshWorkoutNowControls();
    }
}

function refreshWorkoutNowControls() {
    const day = getWorkoutDayForDate(isoDate(new Date()));
    if (!day || day.type !== 'workout') return;
    document.querySelectorAll('#workout-now-list [data-exercise-index]').forEach(item => {
        const index = Number(item.dataset.exerciseIndex);
        const exercise = day.exercises[index];
        if (!exercise) return;
        const active = workoutState.activeDayDate === day.date && workoutState.activeExerciseIndex === index && workoutState.timerMode !== 'idle';
        const resting = active && workoutState.timerMode === 'rest';
        const totalSets = Number(exercise.sets || 1);
        const currentSet = Math.min(Number(exercise.currentSet || 1), totalSets);
        const start = item.querySelector('[data-action="start"]');
        const complete = item.querySelector('[data-action="complete"]');
        const skip = item.querySelector('[data-action="skip"]');
        start.disabled = active || !!exercise.completed;
        start.textContent = resting ? `Rest ${formatCountdownTime(workoutState.timerRemaining)}`
            : active ? `Timer ${workoutState.timerRemaining}s`
            : exercise.completed ? 'Completed ✓'
            : totalSets > 1 ? `Start Set ${currentSet}/${totalSets}` : 'Start Exercise';
        complete.textContent = exercise.completed ? 'Completed ✓' : 'Complete';
        complete.classList.toggle('is-completed', !!exercise.completed);
        skip.hidden = !active;
        item.classList.toggle('completed', !!exercise.completed);
        item.classList.toggle('resting', resting);
    });
}

function getCurrentWorkoutDay() {
    const week = getWorkoutWeekForCurrentView();
    return week.days[workoutState.selectedDayIndex] || week.days[0];
}

function setSelectedWorkoutDayType(type) {
    const day = getCurrentWorkoutDay();
    if (!day) return;

    if (type === 'rest') {
        day.savedExercisesForWorkout = (day.exercises || []).map(exercise => ({ ...exercise }));
        day.type = 'rest';
        day.exercises = [];
        day.completed = false;
        day.manualCompleted = false;
        day.manualMissed = false;
    } else {
        day.type = 'workout';
        day.manualCompleted = false;
        day.manualMissed = false;
        const templates = getWorkoutWeeklyTemplates();
        const exercisesToRestore = day.savedExercisesForWorkout?.length
            ? day.savedExercisesForWorkout
            : templates[workoutState.selectedDayIndex]?.exercises || [];
        day.exercises = cloneWorkoutExercises(exercisesToRestore, day.date);
        delete day.savedExercisesForWorkout;
        day.completed = false;
    }

    if (workoutState.activeDayDate === day.date) {
        stopWorkoutTimer();
        workoutState.activeDayDate = null;
        workoutState.activeExerciseIndex = null;
        workoutState.timerMode = 'idle';
        workoutState.timerRemaining = 0;
    }
    saveWorkoutDayTemplate(day, workoutState.selectedDayIndex);
    renderWorkoutPlanner();
}

function setSelectedWorkoutDay(index) {
    workoutState.selectedDayIndex = index;
    renderWorkoutPlanner();
}

function addCategoryFilterButtons() {
    const custom = JSON.parse(localStorage.getItem('triviaWorkoutCustomExercises') || '[]');
    const filters = ['all', ...Array.from(new Set([...getWorkoutExerciseCatalog().map(ex => ex.category), ...custom.map(ex => ex.category), ...getWorkoutCategories()]))];
    const container = document.getElementById('workout-category-filters');
    if (!container) return;

    container.innerHTML = '';
    filters.forEach(cat => {
        const chipWrap = document.createElement('span');
        chipWrap.className = 'filter-chip-wrap';
        const btn = document.createElement('button');
        btn.className = `filter-chip ${cat === workoutState.activeFilter ? 'active' : ''}`;
        btn.textContent = cat === 'all' ? 'All' : formatWorkoutCategoryLabel(cat);
        btn.addEventListener('click', () => {
            workoutState.activeFilter = cat;
            renderWorkoutExerciseList();
            addCategoryFilterButtons();
        });
        chipWrap.appendChild(btn);

        if (cat !== 'all' && cat === workoutState.activeFilter && isRemovableWorkoutCategory(cat)) {
            const removeButton = document.createElement('button');
            removeButton.type = 'button';
            removeButton.className = 'remove-category-btn';
            removeButton.textContent = '×';
            removeButton.title = `Remove empty ${formatWorkoutCategoryLabel(cat)} category`;
            removeButton.setAttribute('aria-label', `Remove ${formatWorkoutCategoryLabel(cat)} category`);
            removeButton.addEventListener('click', () => removeEmptyWorkoutCategory(cat));
            chipWrap.appendChild(removeButton);
        }
        container.appendChild(chipWrap);
    });
}

function isRemovableWorkoutCategory(category) {
    const baseCategories = ['chest', 'upper body', 'arms', 'legs', 'glutes', 'core', 'kettlebell', 'conditioning'];
    if (baseCategories.includes(category)) return false;

    const libraryExercises = [
        ...getWorkoutExerciseCatalog(),
        ...JSON.parse(localStorage.getItem('triviaWorkoutCustomExercises') || '[]')
    ];
    if (libraryExercises.some(exercise => exercise.category === category)) return false;
    if (workoutState.weeks.some(week => (week.days || []).some(day => (day.exercises || []).some(exercise => exercise.category === category)))) return false;
    try {
        const savedPlans = JSON.parse(localStorage.getItem('triviaWorkoutSavedPlans') || '[]');
        if (savedPlans.some(plan =>
            (plan.customExercises || []).some(exercise => exercise.category === category)
            || (plan.weeks || []).some(week => (week.days || []).some(day => (day.exercises || []).some(exercise => exercise.category === category)))
            || Object.values(plan.weeklyTemplates || {}).some(template => (template.exercises || []).some(exercise => exercise.category === category))
        )) return false;
    } catch (error) {
        // Ignore malformed saved-plan data when checking whether the category is in use.
    }

    return !Object.values(getWorkoutWeeklyTemplates()).some(template =>
        (template?.exercises || []).some(exercise => exercise.category === category)
    );
}

function removeEmptyWorkoutCategory(category) {
    if (!isRemovableWorkoutCategory(category)) return;
    if (!confirm(`Remove the empty ${formatWorkoutCategoryLabel(category)} category?`)) return;

    saveWorkoutCategories(getWorkoutCategories().filter(item => item !== category));
    if (workoutState.activeFilter === category) workoutState.activeFilter = 'all';
    hydrateWorkoutCategoriesSelect();
    renderWorkoutPlanner();
}

function renderWorkoutExerciseList() {
    const list = document.getElementById('workout-exercise-list');
    if (!list) return;

    const custom = JSON.parse(localStorage.getItem('triviaWorkoutCustomExercises') || '[]');
    const matchesFilter = exercise => workoutState.activeFilter === 'all' || exercise.category === workoutState.activeFilter;
    const defaults = getWorkoutExerciseCatalog().filter(matchesFilter);
    const customExercises = custom.filter(matchesFilter);
    list.innerHTML = '';
    const appendExercise = ex => {
        const item = document.createElement('div');
        item.className = 'workout-exercise-item';
        const weightLabel = Number(ex.weight || 0) > 0 && !ex.bodyWeight ? `${ex.weight}kg` : '';
        const exerciseMeta = [
            `${ex.sets} sets`,
            ex.repsTillFailure ? "'Till Failure" : `${ex.reps} reps`,
            weightLabel,
            ex.completed ? 'Finished' : ''
        ].filter(Boolean).join(' • ');
        item.innerHTML = `
            <div>
                <strong>${ex.name}</strong>
                <div class="exercise-item-meta">${exerciseMeta}</div>
            </div>
            <div class="exercise-item-actions">
                <button data-build="add" data-id="${ex.id}">Add</button>
                <button data-build="edit" data-id="${ex.id}" class="edit-exercise-btn">Edit</button>
                ${String(ex.id).startsWith('custom-') ? `<button data-build="remove" data-id="${ex.id}" class="remove-exercise-btn">Remove</button>` : ''}
            </div>
        `;
        item.querySelector('[data-build="add"]').addEventListener('click', () => {
            addExerciseToSelectedDay(ex);
        });
        item.querySelector('[data-build="edit"]').addEventListener('click', () => {
            populateExerciseEditor(ex);
        });
        item.querySelector('[data-build="remove"]')?.addEventListener('click', () => removeCustomExercise(ex.id));
        list.appendChild(item);
    };

    defaults.forEach(appendExercise);
    if (customExercises.length) {
        const divider = document.createElement('div');
        divider.className = 'custom-exercise-divider';
        divider.innerHTML = '<span>Custom Exercises</span>';
        list.appendChild(divider);
        customExercises.forEach(appendExercise);
    }
}

function initializeWorkoutExerciseListResize() {
    const list = document.getElementById('workout-exercise-list');
    if (!list) return;

    const minHeight = 300;
    const maxHeight = 600;
    const storedHeight = Number(localStorage.getItem('triviaWorkoutExerciseListHeight'));
    const height = Number.isFinite(storedHeight) && storedHeight > 0 ? storedHeight : 380;
    list.style.height = `${Math.max(minHeight, Math.min(maxHeight, height))}px`;

    const saveHeight = () => {
        const actualHeight = Math.round(list.getBoundingClientRect().height);
        localStorage.setItem('triviaWorkoutExerciseListHeight', String(Math.max(minHeight, Math.min(maxHeight, actualHeight))));
    };

    if (window.ResizeObserver) {
        const observer = new ResizeObserver(saveHeight);
        observer.observe(list);
        list.workoutResizeObserver = observer;
    } else {
        list.addEventListener('pointerup', saveHeight);
        list.addEventListener('touchend', saveHeight);
    }
}

function removeCustomExercise(exerciseId) {
    const custom = JSON.parse(localStorage.getItem('triviaWorkoutCustomExercises') || '[]');
    localStorage.setItem('triviaWorkoutCustomExercises', JSON.stringify(custom.filter(exercise => exercise.id !== exerciseId)));
    workoutState.weeks.forEach(week => week.days.forEach(day => {
        day.exercises = (day.exercises || []).filter(exercise => exercise.id !== exerciseId);
        day.completed = isWorkoutDayCompleted(day);
    }));
    renderWorkoutPlanner();
    saveWorkoutData();
}

function updateWorkoutLibraryExerciseCopies(exerciseId, updates, previousExercise = {}) {
    const matchesExercise = exercise => !!exercise
        && (exercise.id === exerciseId || String(exercise.id || '').startsWith(`${exerciseId}-`));
    const weeklyTemplates = getWorkoutWeeklyTemplates();
    Object.values(weeklyTemplates).forEach(template => {
        if (!template || typeof template !== 'object') return;
        template.exercises = (template.exercises || []).map(exercise => (
            matchesExercise(exercise)
            || (exercise && !exercise.id && exercise.name === previousExercise.name && exercise.category === previousExercise.category)
        )
            ? { ...exercise, ...updates, id: exercise.id }
            : exercise);
    });
    localStorage.setItem(WORKOUT_WEEKLY_TEMPLATE_KEY, JSON.stringify(weeklyTemplates));

    const today = isoDate(new Date());
    let programChanged = false;
    workoutState.weeks.forEach(week => (week.days || []).forEach(day => {
        if (day.date < today) return;
        day.exercises = (day.exercises || []).map(exercise => {
            if (!matchesExercise(exercise) || exercise.completed) return exercise;
            programChanged = true;
            return { ...exercise, ...updates, id: exercise.id, completed: false, currentSet: exercise.currentSet || 1 };
        });
    }));
    if (programChanged) saveWorkoutData();
}

function populateExerciseEditor(exercise, isDayExercise = false) {
    const name = document.getElementById('workout-exercise-name');
    const category = document.getElementById('workout-exercise-category');
    const description = document.getElementById('workout-exercise-description');
    const sets = document.getElementById('workout-exercise-sets');
    const reps = document.getElementById('workout-exercise-reps');
    const weight = document.getElementById('workout-exercise-weight');
    const duration = document.getElementById('workout-exercise-duration');
    const rest = document.getElementById('workout-exercise-rest');

    if (!name || !category || !description || !sets || !reps || !weight || !duration || !rest) return;

    resetExerciseOption(document.getElementById('workout-exercise-till-failure-btn'), reps);
    resetExerciseOption(document.getElementById('workout-exercise-bodyweight-btn'), weight);
    workoutState.editingExerciseId = exercise.id;
    workoutState.editingDayExercise = isDayExercise;
    workoutState.editingExerciseMode = isDayExercise ? 'day' : 'library';
    name.value = exercise.name;
    description.value = exercise.description || '';
    category.value = exercise.category || 'chest';
    sets.value = exercise.sets || 3;
    reps.value = exercise.reps ?? 10;
    weight.value = exercise.weight ?? 0;
    duration.value = exercise.duration || 45;
    rest.value = exercise.rest || 60;
    syncExerciseDurationSlider('workout-exercise-duration', false);
    syncExerciseDurationSlider('workout-exercise-rest', false);
    const saveButton = document.getElementById('workout-save-exercise-btn');
    if (saveButton) saveButton.textContent = 'Save Exercise Changes';
    setExerciseOptionState(
        document.getElementById('workout-exercise-till-failure-btn'),
        reps,
        !!exercise.repsTillFailure
    );
    setExerciseOptionState(
        document.getElementById('workout-exercise-bodyweight-btn'),
        weight,
        !!exercise.bodyWeight
    );
    openExerciseEditor(isDayExercise ? 'Edit Today’s Exercise' : 'Edit Exercise in List', isDayExercise
        ? 'These changes apply to the selected day only.'
        : 'Update this reusable exercise without changing any scheduled day.', true);
}

function setExerciseOptionState(button, input, active) {
    if (!button || !input) return;
    if (active && !input.disabled) input.dataset.previousValue = input.value;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
    input.disabled = active;
    input.closest('.exercise-number-input-wrap')?.querySelectorAll('.exercise-number-adjust').forEach(stepper => {
        stepper.disabled = active;
    });

    if (active) {
        input.value = '';
    } else if (input.dataset.previousValue !== undefined) {
        const previousValue = input.dataset.previousValue;
        const fallback = input.id === 'workout-exercise-reps' ? '10' : String(input.min || 0);
        input.value = Number(previousValue) >= Number(input.min || 0) ? previousValue : fallback;
        delete input.dataset.previousValue;
    }
}

function resetExerciseOption(button, input) {
    if (!button || !input) return;
    button.classList.remove('active');
    button.setAttribute('aria-pressed', 'false');
    input.disabled = false;
    input.closest('.exercise-number-input-wrap')?.querySelectorAll('.exercise-number-adjust').forEach(stepper => {
        stepper.disabled = false;
    });
    delete input.dataset.previousValue;
}

function toggleExerciseOption(buttonId, inputId) {
    const button = document.getElementById(buttonId);
    const input = document.getElementById(inputId);
    if (!button || !input) return;
    setExerciseOptionState(button, input, !button.classList.contains('active'));
}

function openExerciseEditor(title = 'Create New Exercise', description = 'Create an exercise for your reusable exercise list.', isExistingEdit = false) {
    const modal = document.getElementById('workout-exercise-modal');
    const editor = document.getElementById('workout-exercise-editor');
    if (!modal || !editor) return;
    const isDayExercise = workoutState.editingDayExercise;
    document.getElementById('workout-exercise-modal-title').textContent = title.replace('Create a New Exercise', 'Create New Exercise');
    document.getElementById('workout-exercise-modal-description').textContent = description;
    editor.classList.toggle('day-exercise-edit', isDayExercise);
    editor.classList.toggle('exercise-existing-edit', isExistingEdit);
    editor.querySelector('.category-create-row')?.toggleAttribute('hidden', isExistingEdit);
    editor.querySelector('.exercise-name-field')?.toggleAttribute('hidden', isDayExercise);
    editor.querySelector('.exercise-category-field')?.toggleAttribute('hidden', isExistingEdit);
    editor.querySelector('.description-editor-field')?.toggleAttribute('hidden', isExistingEdit);
    editor.hidden = false;
    editor.classList.add('exercise-editor-in-modal');
    modal.hidden = false;
    syncWorkoutOverlayScrollLock();
}

function syncExerciseDurationSlider(inputId, reset = true) {
    const input = document.getElementById(inputId);
    const slider = document.getElementById(`${inputId}-slider`);
    const output = document.getElementById(`${inputId}-value`);
    if (!input || !slider || !output) return;

    const min = Number(slider.min);
    const max = Number(slider.max);
    const raw = Number(input.value || min);
    const stepped = Math.max(min, Math.min(max, min + Math.round((raw - min) / Number(slider.step)) * Number(slider.step)));
    slider.value = String(stepped);
    input.value = String(stepped);
    output.value = `${stepped} sec`;
    output.textContent = `${stepped} sec`;
    if (reset) input.dispatchEvent(new Event('change', { bubbles: true }));
}

function syncExerciseDurationInput(sliderId) {
    const slider = document.getElementById(sliderId);
    const input = document.getElementById(sliderId.replace('-slider', ''));
    const output = document.getElementById(sliderId.replace('-slider', '-value'));
    if (!slider || !input || !output) return;
    input.value = slider.value;
    output.value = `${slider.value} sec`;
    output.textContent = `${slider.value} sec`;
    input.dispatchEvent(new Event('change', { bubbles: true }));
}

function closeExerciseEditor() {
    const modal = document.getElementById('workout-exercise-modal');
    const editor = document.getElementById('workout-exercise-editor');
    if (modal) modal.hidden = true;
    if (editor) editor.hidden = true;
    syncWorkoutOverlayScrollLock();
    clearExerciseEditor();
    const saveButton = document.getElementById('workout-save-exercise-btn');
    if (saveButton) saveButton.textContent = 'Add Exercise To List';
}

function clearExerciseEditor() {
    const name = document.getElementById('workout-exercise-name');
    const category = document.getElementById('workout-exercise-category');
    const description = document.getElementById('workout-exercise-description');
    const sets = document.getElementById('workout-exercise-sets');
    const reps = document.getElementById('workout-exercise-reps');
    const weight = document.getElementById('workout-exercise-weight');
    const duration = document.getElementById('workout-exercise-duration');
    const rest = document.getElementById('workout-exercise-rest');

    if (name) name.value = '';
    if (category) category.value = '';
    if (description) description.value = '';
    if (sets) sets.value = '';
    if (reps) reps.value = '';
    if (weight) weight.value = '';
    resetExerciseOption(document.getElementById('workout-exercise-till-failure-btn'), reps);
    resetExerciseOption(document.getElementById('workout-exercise-bodyweight-btn'), weight);
    if (duration) duration.value = '45';
    if (rest) rest.value = '60';
    syncExerciseDurationSlider('workout-exercise-duration', false);
    syncExerciseDurationSlider('workout-exercise-rest', false);
    workoutState.editingExerciseId = null;
    workoutState.editingDayExercise = false;
    workoutState.editingExerciseMode = 'new';
}

function saveExerciseFromEditor() {
    const nameValue = document.getElementById('workout-exercise-name').value.trim();
    const categoryValue = document.getElementById('workout-exercise-category').value;
    const repsInput = document.getElementById('workout-exercise-reps');
    const weightInput = document.getElementById('workout-exercise-weight');
    const repsTillFailure = !!document.getElementById('workout-exercise-till-failure-btn')?.classList.contains('active');
    const bodyWeight = !!document.getElementById('workout-exercise-bodyweight-btn')?.classList.contains('active');
    const requiredFields = [
        document.getElementById('workout-exercise-name'),
        document.getElementById('workout-exercise-sets'),
        document.getElementById('workout-exercise-duration'),
        document.getElementById('workout-exercise-rest')
    ];
    if (!repsTillFailure) requiredFields.push(repsInput);
    if (!categoryValue || requiredFields.some(field => !field.value.trim() || !field.checkValidity())) {
        showToast({ icon: '⚠️', name: 'Exercise details required', desc: 'Name, category, sets, reps, timer, and rest are required.' });
        return;
    }

    const descriptionValue = document.getElementById('workout-exercise-description').value.trim() || 'Custom exercise added to your weekly plan.';
    const template = {
        name: nameValue,
        category: categoryValue,
        sets: Number(document.getElementById('workout-exercise-sets').value),
        reps: repsTillFailure ? 0 : Number(repsInput.value),
        repsTillFailure,
        weight: bodyWeight ? 0 : Number(weightInput.value || 0),
        bodyWeight,
        duration: Number(document.getElementById('workout-exercise-duration').value),
        rest: Number(document.getElementById('workout-exercise-rest').value),
        description: descriptionValue
    };

    if (workoutState.editingExerciseMode === 'day' || workoutState.editingDayExercise) {
        const targetDay = getCurrentWorkoutDay();
        if (!targetDay) return;
        if (targetDay.type !== 'workout') targetDay.type = 'workout';
        const existingExercise = targetDay.exercises.find(item => item.id === workoutState.editingExerciseId);
        if (!existingExercise) {
            showToast({ icon: '⚠️', name: 'Exercise no longer exists', desc: 'Select the exercise again and retry.' });
            return;
        }
        Object.assign(existingExercise, {
            ...template,
            id: existingExercise.id,
            completed: existingExercise.completed || false,
            currentSet: existingExercise.currentSet || 1
        });
        targetDay.completed = isWorkoutDayCompleted(targetDay);
        saveWorkoutData();
        closeExerciseEditor();
        renderWorkoutPlanner();
        showToast({ icon: '✅', name: 'Today’s exercise updated', desc: `${nameValue} was changed for this day only.` });
        return;
    }

    const customExercises = JSON.parse(localStorage.getItem('triviaWorkoutCustomExercises') || '[]');
    const editingLibraryExercise = workoutState.editingExerciseMode === 'library';
    let updatedDefaultExercise = false;
    if (editingLibraryExercise) {
        const customIndex = customExercises.findIndex(ex => ex.id === workoutState.editingExerciseId);
        const original = workoutExerciseCatalog.find(ex => ex.id === workoutState.editingExerciseId);
        if (customIndex >= 0) {
            const previousExercise = customExercises[customIndex];
            customExercises[customIndex] = {
                ...previousExercise,
                ...template,
                id: workoutState.editingExerciseId
            };
            localStorage.setItem('triviaWorkoutCustomExercises', JSON.stringify(customExercises));
            updateWorkoutLibraryExerciseCopies(workoutState.editingExerciseId, template, previousExercise);
        } else if (original) {
            let overrides = {};
            try {
                overrides = JSON.parse(localStorage.getItem('triviaWorkoutExerciseOverrides') || '{}');
            } catch (error) {
                // Replace malformed override data with a clean object.
            }
            overrides[original.id] = { ...original, ...template, id: original.id };
            localStorage.setItem('triviaWorkoutExerciseOverrides', JSON.stringify(overrides));
            updateWorkoutLibraryExerciseCopies(original.id, template, original);
            updatedDefaultExercise = true;
        } else {
            showToast({ icon: '⚠️', name: 'Exercise not found', desc: 'This library exercise could not be updated.' });
            return;
        }
    } else {
        customExercises.push({ ...template, id: `custom-${Date.now()}` });
        localStorage.setItem('triviaWorkoutCustomExercises', JSON.stringify(customExercises));
    }
    const savedName = nameValue;
    closeExerciseEditor();
    renderWorkoutPlanner();
    showToast({
        icon: '✅',
        name: editingLibraryExercise ? 'Exercise updated' : 'Exercise added',
        desc: `${savedName} ${editingLibraryExercise && updatedDefaultExercise ? 'was updated without creating a custom copy.' : 'is in your exercise list.'}`
    });
}

function addExerciseToSelectedDay(exercise) {
    const day = getCurrentWorkoutDay();
    if (!day) return;

    if (day.type !== 'workout') {
        day.type = 'workout';
    }

    const nextId = `${exercise.id}-${Date.now()}`;
    day.exercises.push({
        ...exercise,
        id: nextId,
        completed: false,
        currentSet: 1
    });

    day.manualCompleted = false;
    day.manualMissed = false;
    day.completed = isWorkoutDayCompleted(day);
    saveWorkoutDayTemplate(day, workoutState.selectedDayIndex);
    renderWorkoutPlanner();
    saveWorkoutData();
    showToast({ icon: '💪', name: 'Exercise added', desc: `${exercise.name} was added to ${day.dayLabel}.` });
}

function removeExerciseFromSelectedDay(exerciseId) {
    const day = getCurrentWorkoutDay();
    if (!day) return;
    day.exercises = day.exercises.filter(ex => ex.id !== exerciseId);
    day.completed = isWorkoutDayCompleted(day);
    saveWorkoutDayTemplate(day, workoutState.selectedDayIndex);
    renderWorkoutPlanner();
    saveWorkoutData();
}

function exportWorkoutProgram() {
    const payload = {
        format: 'bianka-workout-program',
        version: 1,
        exportedAt: new Date().toISOString(),
        currentWeekStart: workoutState.currentWeekStart,
        weeklyTemplates: getWorkoutWeeklyTemplates(),
        categories: getWorkoutCategories(),
        customExercises: JSON.parse(localStorage.getItem('triviaWorkoutCustomExercises') || '[]'),
        weeks: workoutState.weeks
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `workout-program-${isoDate(new Date())}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast({ icon: '📤', name: 'Program exported', desc: 'Your workout plan was downloaded as JSON.' });
}

function isValidWorkoutImport(payload) {
    return !!payload
        && payload.format === 'bianka-workout-program'
        && Array.isArray(payload.weeks)
        && payload.weeks.length > 0
        && payload.weeks.every(week => week
            && typeof week.weekStart === 'string'
            && Array.isArray(week.days)
            && week.days.length === 7
            && week.days.every(day => day
                && typeof day.date === 'string'
                && (day.type === 'rest' || day.type === 'workout')
                && Array.isArray(day.exercises)));
}

function importWorkoutProgramFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
        try {
            const payload = JSON.parse(String(reader.result || ''));
            if (!isValidWorkoutImport(payload)) throw new Error('This file is not a valid workout program export.');
            if (!confirm('Import this workout program and replace your current workout schedule?')) return;

            workoutState.weeks = payload.weeks;
            workoutState.currentWeekStart = payload.currentWeekStart || payload.weeks[0].weekStart;
            workoutState.selectedDayIndex = (new Date().getDay() + 6) % 7;
            localStorage.setItem(WORKOUT_WEEKLY_TEMPLATE_KEY, JSON.stringify(payload.weeklyTemplates || {}));
            localStorage.setItem('triviaWorkoutCategories', JSON.stringify(payload.categories || getWorkoutCategories()));
            localStorage.setItem('triviaWorkoutCustomExercises', JSON.stringify(payload.customExercises || []));
            saveWorkoutData();
            hydrateWorkoutCategoriesSelect();
            renderWorkoutPlanner();
            showToast({ icon: '📥', name: 'Program imported', desc: 'Your workout plan is ready.' });
        } catch (error) {
            alert(`Could not import workout program: ${error.message}`);
        }
    };
    reader.readAsText(file);
}

function renderWorkoutDays() {
    const week = getWorkoutWeekForCurrentView();
    const container = document.getElementById('workout-days-row');
    if (!container) return;

    const today = isoDate(new Date());
    container.innerHTML = '';
    week.days.forEach((day, index) => {
        if (day.type === 'workout') day.completed = isWorkoutDayCompleted(day);
        const missed = day.type === 'workout' && (day.date < today || day.manualMissed) && !day.completed;
        const btn = document.createElement('button');
        btn.className = `workout-day-pill ${index === workoutState.selectedDayIndex ? 'active' : ''} ${day.completed ? 'completed' : ''} ${day.type === 'workout' ? 'workout-day' : ''} ${day.type === 'rest' ? 'rest-day' : ''} ${day.type === null ? 'null-day' : ''} ${missed ? 'missed-day' : ''}`;
        btn.type = 'button';
        btn.innerHTML = `
            <span class="day-letter">${day.dayLabel}</span>
            <span class="day-number">${parseWorkoutDate(day.date).getDate()}</span>
            <span class="day-status">${day.type === 'rest' ? 'Rest' : day.type === null ? '—' : missed ? '✕' : day.exercises.filter(ex => ex.completed).length + '/' + day.exercises.length || '0/0'}</span>
        `;
        btn.addEventListener('click', () => setSelectedWorkoutDay(index));
        container.appendChild(btn);
    });
}

function renderWorkoutMetrics() {
    const stats = getWorkoutStatsSnapshot();
    document.getElementById('workout-streak-count').textContent = String(stats.streak);
    document.getElementById('workout-total-days').textContent = String(stats.workouts);
    document.getElementById('workout-total-sets').textContent = String(stats.sets);
    document.getElementById('workout-total-reps').textContent = String(stats.reps);
    document.getElementById('workout-total-kg').textContent = formatKilogramStat(stats.kg);
    evaluateAchievementTriggers(stats);
    renderWorkoutWeightButton();
}

const BODY_WEIGHT_ENTRIES_KEY = 'triviaBodyWeightEntries';

function getBodyWeightEntries() {
    try {
        const entries = JSON.parse(localStorage.getItem(BODY_WEIGHT_ENTRIES_KEY) || '[]');
        return (Array.isArray(entries) ? entries : [])
            .filter(entry => entry && /^\d{4}-\d{2}-\d{2}$/.test(entry.date)
                && Number.isFinite(Number(entry.weight)) && Number(entry.weight) > 0)
            .map(entry => ({ date: entry.date, weight: Number(entry.weight) }))
            .sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
        localStorage.removeItem(BODY_WEIGHT_ENTRIES_KEY);
        return [];
    }
}

function renderWorkoutWeightButton() {
    const button = document.getElementById('workout-weight-btn');
    if (!button) return;
    const latestEntry = getBodyWeightEntries().at(-1);
    button.textContent = latestEntry ? `${latestEntry.weight} kg` : 'Your weight';
    button.title = latestEntry ? `Last recorded ${latestEntry.date}` : 'Record your weight';
}

function openWorkoutWeightEntry() {
    const overlay = document.getElementById('workout-weight-entry-overlay');
    const input = document.getElementById('workout-weight-input');
    if (!overlay || !input) return;
    const menu = document.getElementById('workout-weight-menu');
    menu.hidden = true;
    document.getElementById('workout-weight-btn').setAttribute('aria-expanded', 'false');
    const dateInput = document.getElementById('workout-weight-date');
    const dateControl = document.getElementById('workout-weight-date-control');
    const isAdmin = isDeveloperMode();
    const today = isoDate(new Date());
    if (dateInput) {
        dateInput.value = today;
        dateInput.max = today;
    }
    if (dateControl) dateControl.hidden = !isAdmin;
    const entryForToday = getBodyWeightEntries().find(entry => entry.date === today);
    const latestEntry = getBodyWeightEntries().at(-1);
    input.value = entryForToday ? String(entryForToday.weight) : latestEntry ? String(latestEntry.weight) : '';
    const hint = document.getElementById('workout-weight-entry-hint');
    if (hint) hint.textContent = isAdmin
        ? 'Choose a date to add or update a historical entry.'
        : 'Your entry will be saved with today’s date.';
    overlay.hidden = false;
    syncWorkoutOverlayScrollLock();
    input.focus();
}

function closeWorkoutWeightEntry() {
    const overlay = document.getElementById('workout-weight-entry-overlay');
    if (overlay) overlay.hidden = true;
    syncWorkoutOverlayScrollLock();
}

function saveWorkoutWeightEntry(event) {
    event.preventDefault();
    const input = document.getElementById('workout-weight-input');
    const weight = Number(input?.value);
    if (!Number.isFinite(weight) || weight < 1 || weight > 500) {
        alert('Enter a weight between 1 and 500 kg.');
        return;
    }

    const date = isDeveloperMode()
        ? document.getElementById('workout-weight-date')?.value
        : isoDate(new Date());
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date) || date > isoDate(new Date())) {
        alert('Choose a valid date that is not in the future.');
        return;
    }
    const entries = getBodyWeightEntries();
    const todayEntry = entries.find(entry => entry.date === date);
    if (todayEntry) todayEntry.weight = weight;
    else entries.push({ date, weight });
    entries.sort((a, b) => a.date.localeCompare(b.date));
    localStorage.setItem(BODY_WEIGHT_ENTRIES_KEY, JSON.stringify(entries));
    closeWorkoutWeightEntry();
    renderWorkoutWeightButton();
    if (currentScreen === 'weightHistory') {
        renderWeightHistoryGraph();
        renderWeightHistoryStats();
        renderBmiResult();
    }
    showToast({ icon: '⚖️', name: 'Weight saved', desc: `${weight} kg recorded for today.` });
}

function renderWeightHistoryGraph() {
    const chart = document.getElementById('weight-chart-wrap');
    const emptyState = document.getElementById('weight-history-empty');
    if (!chart || !emptyState) return;

    const entries = getBodyWeightEntries();
    chart.replaceChildren();
    emptyState.hidden = entries.length > 0;
    chart.hidden = entries.length === 0;
    if (!entries.length) return;

    const svgNs = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNs, 'svg');
    svg.setAttribute('viewBox', '0 0 900 440');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Line graph of recorded bodyweight by date');
    const plot = { left: 78, right: 864, top: 32, bottom: 346 };
    const weights = entries.map(entry => entry.weight);
    const spread = Math.max(...weights) - Math.min(...weights);
    const padding = Math.max(spread * 0.18, 0.5);
    const minWeight = Math.max(0, Math.floor((Math.min(...weights) - padding) * 2) / 2);
    const maxWeight = Math.ceil((Math.max(...weights) + padding) * 2) / 2;
    const tickStep = Math.max(0.5, Math.ceil((maxWeight - minWeight) / 4 * 2) / 2);
    const yAxisMin = Math.floor(minWeight / tickStep) * tickStep;
    let yAxisMax = Math.ceil(maxWeight / tickStep) * tickStep;
    if (yAxisMax <= yAxisMin) yAxisMax = yAxisMin + tickStep;
    const range = yAxisMax - yAxisMin;
    const timestamps = entries.map(entry => new Date(`${entry.date}T00:00:00`).getTime());
    const timeRange = timestamps[timestamps.length - 1] - timestamps[0];
    const xFor = index => entries.length === 1
        ? (plot.left + plot.right) / 2
        : plot.left + ((timestamps[index] - timestamps[0]) / timeRange) * (plot.right - plot.left);
    const yFor = weight => plot.bottom - ((weight - yAxisMin) / range) * (plot.bottom - plot.top);
    const addSvgElement = (tag, attributes, text = '') => {
        const element = document.createElementNS(svgNs, tag);
        Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, String(value)));
        if (text) element.textContent = text;
        svg.appendChild(element);
        return element;
    };

    for (let weight = yAxisMin; weight <= yAxisMax + tickStep * 0.001; weight += tickStep) {
        const roundedWeight = Number(weight.toFixed(2));
        const y = yFor(roundedWeight);
        addSvgElement('line', { x1: plot.left, x2: plot.right, y1: y, y2: y, class: 'weight-chart-gridline' });
        addSvgElement('text', { x: plot.left - 12, y: y + 4, 'text-anchor': 'end', class: 'weight-chart-label' }, `${roundedWeight.toFixed(roundedWeight % 1 ? 1 : 0)} kg`);
    }

    addSvgElement('line', { x1: plot.left, x2: plot.left, y1: plot.top, y2: plot.bottom, class: 'weight-chart-axis' });
    addSvgElement('line', { x1: plot.left, x2: plot.right, y1: plot.bottom, y2: plot.bottom, class: 'weight-chart-axis' });
    const points = entries.map((entry, index) => `${xFor(index)},${yFor(entry.weight)}`).join(' ');
    addSvgElement('polyline', { points, class: 'weight-chart-line' });

    entries.forEach((entry, index) => {
        const x = xFor(index);
        const y = yFor(entry.weight);
        const circle = addSvgElement('circle', { cx: x, cy: y, r: 5, class: 'weight-chart-point' });
        const title = document.createElementNS(svgNs, 'title');
        title.textContent = `${new Date(`${entry.date}T00:00:00`).toLocaleDateString()}: ${entry.weight} kg`;
        circle.appendChild(title);
        circle.setAttribute('tabindex', '0');
        circle.setAttribute('role', 'img');
        circle.setAttribute('aria-label', `${entry.weight} kilograms on ${title.textContent.split(':')[0]}`);

        const tooltip = document.createElementNS(svgNs, 'g');
        tooltip.setAttribute('class', 'weight-chart-tooltip');
        tooltip.setAttribute('visibility', 'hidden');
        const tooltipX = Math.max(8, Math.min(900 - 144, x - 72));
        const tooltipY = y - 56 < 8 ? y + 12 : y - 56;
        tooltip.setAttribute('transform', `translate(${tooltipX} ${tooltipY})`);
        const tooltipBackground = document.createElementNS(svgNs, 'rect');
        tooltipBackground.setAttribute('width', '144');
        tooltipBackground.setAttribute('height', '46');
        tooltipBackground.setAttribute('rx', '9');
        tooltipBackground.setAttribute('class', 'weight-chart-tooltip-bg');
        const weightLabel = document.createElementNS(svgNs, 'text');
        weightLabel.setAttribute('x', '11');
        weightLabel.setAttribute('y', '19');
        weightLabel.setAttribute('class', 'weight-chart-tooltip-weight');
        weightLabel.textContent = `${entry.weight} kg`;
        const dateLabel = document.createElementNS(svgNs, 'text');
        dateLabel.setAttribute('x', '11');
        dateLabel.setAttribute('y', '36');
        dateLabel.setAttribute('class', 'weight-chart-tooltip-date');
        dateLabel.textContent = new Date(`${entry.date}T00:00:00`).toLocaleDateString(undefined, {
            month: 'short', day: 'numeric', year: 'numeric'
        });
        tooltip.append(tooltipBackground, weightLabel, dateLabel);
        svg.appendChild(tooltip);
        const showTooltip = () => tooltip.setAttribute('visibility', 'visible');
        const hideTooltip = () => tooltip.setAttribute('visibility', 'hidden');
        circle.addEventListener('mouseenter', showTooltip);
        circle.addEventListener('mouseleave', hideTooltip);
        circle.addEventListener('focus', showTooltip);
        circle.addEventListener('blur', hideTooltip);
    });

    const labelIndexes = new Set();
    const labelCount = Math.min(entries.length, 6);
    for (let index = 0; index < labelCount; index++) {
        labelIndexes.add(labelCount === 1 ? 0 : Math.round(index * (entries.length - 1) / (labelCount - 1)));
    }
    labelIndexes.forEach(index => {
        const date = new Date(`${entries[index].date}T00:00:00`);
        addSvgElement('text', {
            x: xFor(index), y: plot.bottom + 25,
            'text-anchor': index === 0 ? 'start' : index === entries.length - 1 ? 'end' : 'middle',
            class: 'weight-chart-label'
        }, date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
    });
    addSvgElement('text', { x: (plot.left + plot.right) / 2, y: 420, 'text-anchor': 'middle', class: 'weight-chart-axis-title' }, 'Date');
    const yTitle = addSvgElement('text', {
        x: 18, y: (plot.top + plot.bottom) / 2,
        'text-anchor': 'middle', class: 'weight-chart-axis-title',
        transform: `rotate(-90 18 ${(plot.top + plot.bottom) / 2})`
    }, 'Weight (kg)');
    yTitle.setAttribute('aria-hidden', 'true');
    chart.appendChild(svg);
}

function renderWeightHistoryStats() {
    const container = document.getElementById('weight-history-stats');
    if (!container) return;
    const stats = getWorkoutStatsSnapshot();
    const firstWorkoutDate = getFirstWorkoutDate();
    const rows = [
        ['First workout', firstWorkoutDate
            ? new Date(`${firstWorkoutDate}T00:00:00`).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
            : 'Not started'],
        ['Workout streak', `${stats.streak} days`],
        ['Completed workouts', stats.workouts],
        ['Completed exercises', stats.exercises],
        ['Total sets', stats.sets],
        ['Total reps', stats.reps],
        ['Total weight moved', `${formatKilogramStat(stats.kg)} kg`]
    ];
    container.replaceChildren(...rows.map(([label, value]) => {
        const row = document.createElement('div');
        row.className = 'weight-history-stat-row';
        const term = document.createElement('dt');
        term.textContent = label;
        const description = document.createElement('dd');
        description.textContent = String(value);
        row.append(term, description);
        return row;
    }));
}

function getFirstWorkoutDate() {
    const baseline = getWorkoutMetricBaseline();
    const archivedWorkoutDates = baseline.completedWorkoutKeys;
    const archivedExerciseDates = baseline.completedExerciseKeys
        .map(key => key.match(/^(\d{4}-\d{2}-\d{2}):/)?.[1])
        .filter(Boolean);
    const currentWorkoutDates = workoutState.weeks.flatMap(week => (week.days || [])
        .filter(day => day.type === 'workout' && isWorkoutDayCompleted(day))
        .map(day => day.date));
    const dates = [...archivedWorkoutDates, ...archivedExerciseDates, ...currentWorkoutDates]
        .filter(date => /^\d{4}-\d{2}-\d{2}$/.test(date))
        .sort();
    return dates[0] || null;
}

function renderBmiResult() {
    const heightInput = document.getElementById('bmi-height');
    const ageInput = document.getElementById('bmi-age');
    const result = document.getElementById('bmi-result');
    const latestWeight = getBodyWeightEntries().at(-1);
    if (!heightInput.value || !ageInput.value || !heightInput.validity.valid || !ageInput.validity.valid) {
        result.textContent = 'Log your weight and enter your height and age to calculate your BMI.';
        return;
    }
    if (!latestWeight) {
        result.textContent = 'Log your weight to calculate your BMI.';
        return;
    }
    const heightMetres = Number(heightInput.value) / 100;
    const bmi = latestWeight.weight / (heightMetres * heightMetres);
    result.textContent = `Your BMI is ${bmi.toFixed(1)} kg/m², using ${latestWeight.weight} kg recorded on ${parseWorkoutDate(latestWeight.date).toLocaleDateString()}.`;
}

function openWeightHistoryScreen() {
    weightHistoryReturnScreen = currentScreen === 'workout' ? 'workout' : 'workoutMenu';
    document.getElementById('workout-weight-menu').hidden = true;
    document.getElementById('workout-weight-btn').setAttribute('aria-expanded', 'false');
    renderWeightHistoryGraph();
    renderWeightHistoryStats();
    renderBmiResult();
    showScreen('weightHistory');
}

function formatKilogramStat(totalKg) {
    return totalKg > 10000
        ? `${(totalKg / 1000).toFixed(1).replace(/\.0$/, '')}k`
        : (Number.isInteger(totalKg) ? String(totalKg) : totalKg.toFixed(1));
}

function getWorkoutStatsSnapshot() {
    const baseline = getWorkoutMetricBaseline();
    const days = workoutState.weeks.flatMap(week => week.days || []);
    const archivedExerciseKeys = new Set(baseline.completedExerciseKeys);
    const archivedWorkoutKeys = new Set(baseline.completedWorkoutKeys);
    const completedExercises = days.flatMap(day => (day.exercises || [])
        .filter(exercise => exercise.completed && !archivedExerciseKeys.has(`${day.date}:${exercise.id}`)));
    return {
        workouts: baseline.workouts + days.filter(day => isWorkoutDayCompleted(day) && !archivedWorkoutKeys.has(day.date)).length,
        sets: baseline.sets + completedExercises.reduce((sum, exercise) => sum + Number(exercise.sets || 0), 0),
        reps: baseline.reps + completedExercises.reduce((sum, exercise) => sum + Number(exercise.reps || 0) * Number(exercise.sets || 0), 0),
        kg: baseline.kg + completedExercises.reduce((sum, exercise) => sum + getExerciseKgMoved(exercise), 0),
        streak: calculateWorkoutStreak(),
        exercises: baseline.completedExercises + completedExercises.length,
        points: totalPoints
    };
}

function evaluateAchievementTriggers(stats = getWorkoutStatsSnapshot()) {
    Object.values(achievements).forEach(achievement => {
        const trigger = achievement.trigger;
        if (!trigger || achievement.unlocked || !Object.hasOwn(stats, trigger.stat)) return;
        if (Number(stats[trigger.stat]) >= Number(trigger.target)) unlockAchievement(achievement.id);
    });
}

function getWorkoutMetricBaseline() {
    try {
        const baseline = JSON.parse(localStorage.getItem('triviaWorkoutMetricBaseline') || '{}');
        if (baseline.version !== 2) {
            return { workouts: 0, sets: 0, reps: 0, kg: 0, completedExercises: 0, completedExerciseKeys: [], completedWorkoutKeys: [] };
        }
        return {
            workouts: Number(baseline.workouts || 0),
            sets: Number(baseline.sets || 0),
            reps: Number(baseline.reps || 0),
            kg: Number(baseline.kg || 0),
            completedExercises: Number(baseline.completedExercises ?? baseline.completedExerciseKeys?.length ?? 0),
            completedExerciseKeys: Array.isArray(baseline.completedExerciseKeys) ? baseline.completedExerciseKeys : [],
            completedWorkoutKeys: Array.isArray(baseline.completedWorkoutKeys) ? baseline.completedWorkoutKeys : []
        };
    } catch (error) {
        return { workouts: 0, sets: 0, reps: 0, kg: 0, completedExercises: 0, completedExerciseKeys: [], completedWorkoutKeys: [] };
    }
}

function snapshotWorkoutMetricBaseline() {
    const previous = getWorkoutMetricBaseline();
    const days = workoutState.weeks.flatMap(week => week.days || []);
    const previousExerciseKeys = new Set(previous.completedExerciseKeys);
    const previousWorkoutKeys = new Set(previous.completedWorkoutKeys);
    const completedExerciseEntries = days.flatMap(day => (day.exercises || [])
        .filter(exercise => exercise.completed)
        .map(exercise => ({ day, exercise, key: `${day.date}:${exercise.id}` })))
        .filter(entry => !previousExerciseKeys.has(entry.key));
    const completedWorkoutDays = days.filter(day => isWorkoutDayCompleted(day) && !previousWorkoutKeys.has(day.date));
    const baseline = {
        version: 2,
        workouts: previous.workouts + completedWorkoutDays.length,
        sets: previous.sets + completedExerciseEntries.reduce((sum, entry) => sum + Number(entry.exercise.sets || 0), 0),
        reps: previous.reps + completedExerciseEntries.reduce((sum, entry) => sum + Number(entry.exercise.reps || 0) * Number(entry.exercise.sets || 0), 0),
        kg: previous.kg + completedExerciseEntries.reduce((sum, entry) => sum + getExerciseKgMoved(entry.exercise), 0),
        completedExercises: previous.completedExercises + completedExerciseEntries.length,
        completedExerciseKeys: [...previousExerciseKeys, ...completedExerciseEntries.map(entry => entry.key)],
        completedWorkoutKeys: [...previousWorkoutKeys, ...completedWorkoutDays.map(day => day.date)]
    };
    localStorage.setItem('triviaWorkoutMetricBaseline', JSON.stringify(baseline));
}

function getCompletedExerciseCount(day) {
    return (day?.exercises || []).filter(exercise => exercise.completed).length;
}

function getExerciseKgMoved(exercise) {
    if (!exercise || exercise.bodyWeight || exercise.repsTillFailure) return 0;
    return Math.max(0, Number(exercise.weight || 0))
        * Math.max(0, Number(exercise.reps || 0))
        * Math.max(0, Number(exercise.sets || 0));
}

function getWorkoutCompletionThreshold(day) {
    const count = day?.exercises?.length || 0;
    return count ? Math.ceil(count / 2) : 0;
}

function isWorkoutDayCompleted(day) {
    if (!day || day.type !== 'workout') return false;
    if (day.manualMissed) return false;
    if (day.manualCompleted) return true;
    const threshold = getWorkoutCompletionThreshold(day);
    return threshold > 0 && getCompletedExerciseCount(day) >= threshold;
}

function getWorkoutProgramStartDate() {
    const stored = localStorage.getItem('triviaWorkoutProgramStartDate');
    if (stored && /^\d{4}-\d{2}-\d{2}$/.test(stored)) return stored;

    const today = isoDate(new Date());
    const firstScheduledDate = workoutState.weeks
        .flatMap(week => week.days || [])
        .filter(day => day.type === 'workout' || day.type === 'rest')
        .map(day => day.date)
        .filter(date => date <= today)
        .sort()[0] || today;
    localStorage.setItem('triviaWorkoutProgramStartDate', firstScheduledDate);
    return firstScheduledDate;
}

function calculateWorkoutStreak() {
    const today = isoDate(new Date());
    const byDate = new Map(workoutState.weeks.flatMap(week => week.days || []).map(day => [day.date, day]));
    const templates = getWorkoutWeeklyTemplates();
    const startDate = parseWorkoutDate(getWorkoutProgramStartDate());
    let streak = 0;

    for (const date = new Date(startDate); isoDate(date) <= today; date.setDate(date.getDate() + 1)) {
        const dateKey = isoDate(date);
        const day = byDate.get(dateKey);
        const scheduledType = day ? day.type : templates[getWorkoutDayIndex(dateKey)]?.type;

        if (scheduledType === 'rest') {
            streak += 1;
        } else if (scheduledType === 'workout') {
            if (isWorkoutDayCompleted(day || { type: 'workout', exercises: [] })) {
                streak += 1;
            } else if (dateKey < today || day?.manualMissed) {
                streak = 0;
            }
        } else {
            streak = 0;
        }
    }

    return streak;
}

function renderWorkoutDayDetail() {
    const week = getWorkoutWeekForCurrentView();
    const day = week.days[workoutState.selectedDayIndex] || week.days[0];
    const wrapper = document.getElementById('workout-day-detail');
    const title = document.getElementById('workout-day-title');
    if (!wrapper || !title) return;

    const weekdayName = parseWorkoutDate(day.date).toLocaleDateString(undefined, { weekday: 'long' });
    title.textContent = `${weekdayName} Workout`;
    const restToggle = document.getElementById('workout-toggle-rest-btn');
    if (restToggle) {
        const isSettingWorkoutDay = day.type !== 'workout';
        restToggle.textContent = isSettingWorkoutDay ? 'SET WORKOUT DAY' : 'SET REST DAY';
        restToggle.classList.toggle('set-workout-day-btn', isSettingWorkoutDay);
        restToggle.classList.toggle('set-rest-day-btn', !isSettingWorkoutDay);
        restToggle.onclick = () => setSelectedWorkoutDayType(day.type === 'workout' ? 'rest' : 'workout');
    }

    if (day.type === null) {
        wrapper.innerHTML = `
            <div class="rest-box">
                <h4>No program scheduled for this day.</h4>
            </div>
        `;
        return;
    }

    if (day.type === 'rest') {
        wrapper.innerHTML = `
            <div class="rest-box">
                <h4>Rest day, take it chill.</h4>
            </div>
        `;
        return;
    }

    wrapper.innerHTML = '';
    day.exercises.forEach((exercise, index) => {
        const box = document.createElement('div');
        const isActive = workoutState.activeDayDate === day.date && workoutState.activeExerciseIndex === index && workoutState.timerMode !== 'idle';
        const isResting = isActive && workoutState.timerMode === 'rest';
        const isCompleted = exercise.completed;
        const isSetProgress = Number(exercise.sets || 1) > 1 && !isCompleted;
        const currentSet = Number(exercise.currentSet || 1);
        const totalSets = Number(exercise.sets || 1);
        const nextSetNumber = isCompleted ? totalSets : Math.min(currentSet, totalSets);
        box.className = `exercise-box ${isCompleted ? 'completed' : ''} ${isResting ? 'resting' : ''}`;
        box.draggable = true;
        box.dataset.exerciseIndex = String(index);
        box.innerHTML = `
            <div class="exercise-box-header">
            <div class="exercise-name-order"><span class="exercise-order-number">${index + 1}.</span><h4>${exercise.name}</h4></div>
            </div>
            <div class="meta-line">
                <span>${formatWorkoutCategoryLabel(exercise.category)}</span>
                <span class="meta-separator" aria-hidden="true"></span>
                <span>${exercise.bodyWeight ? 'Body Weight' : `${exercise.weight || 0}kg`}</span>
                <span class="meta-separator" aria-hidden="true"></span>
                <span>${exercise.sets} sets</span>
                <span class="meta-separator" aria-hidden="true"></span>
                <span>${exercise.repsTillFailure ? "'Till Failure" : `${exercise.reps} reps`}</span>
                <span class="meta-separator" aria-hidden="true"></span>
                <span>${exercise.rest || 60}s rest</span>
            </div>
            <div class="exercise-start-control">
                <button class="start-btn" data-start-index="${index}" ${isActive || isCompleted ? 'disabled' : ''}>${isResting ? `Rest ${formatCountdownTime(workoutState.timerRemaining)}` : isActive ? `Timer ${workoutState.timerRemaining}s` : isCompleted ? 'Completed ✓' : isSetProgress ? `Start Set ${nextSetNumber}/${totalSets}` : 'Start Exercise'}</button>
                <button class="complete-exercise-btn ${isCompleted ? 'is-completed' : ''}" data-complete-index="${index}" type="button">${isCompleted ? 'Completed ✓' : 'Complete'}</button>
                ${isActive ? '<button class="skip-workout-phase-btn" data-skip-phase type="button">Skip Timer →</button>' : ''}
            </div>
            <div class="exercise-actions">
                <button class="secondary-btn edit-exercise-btn" data-edit-day-index="${index}" type="button">Edit</button>
                <button class="secondary-btn remove-exercise-btn" data-remove-id="${exercise.id}">Remove</button>
            </div>
        `;
        box.querySelector('[data-start-index]')?.addEventListener('click', () => startWorkoutExercise(day, index));
        box.querySelector('[data-complete-index]')?.addEventListener('click', () => completeWorkoutExercise(day, index));
        box.querySelector('[data-skip-phase]')?.addEventListener('click', skipWorkoutTimerPhase);
        box.querySelector('[data-edit-day-index]')?.addEventListener('click', () => populateExerciseEditor(exercise, true));
        box.querySelector('[data-remove-id]').addEventListener('click', () => {
            removeExerciseFromSelectedDay(exercise.id);
        });
        box.addEventListener('dragstart', event => {
            box.classList.add('exercise-dragging');
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/plain', String(index));
        });
        box.addEventListener('dragend', () => {
            box.classList.remove('exercise-dragging');
            wrapper.querySelectorAll('.exercise-drop-target').forEach(target => target.classList.remove('exercise-drop-target'));
        });
        box.addEventListener('dragover', event => {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'move';
            box.classList.add('exercise-drop-target');
        });
        box.addEventListener('dragleave', event => {
            if (!box.contains(event.relatedTarget)) box.classList.remove('exercise-drop-target');
        });
        box.addEventListener('drop', event => {
            event.preventDefault();
            box.classList.remove('exercise-drop-target');
            const fromIndex = Number(event.dataTransfer.getData('text/plain'));
            reorderWorkoutExercise(day, fromIndex, index);
        });
        box.addEventListener('click', (event) => {
            if (event.target.closest('button')) return;
            populateExerciseEditor(exercise, true);
        });
        box.setAttribute('title', 'Click to edit this exercise for this day');
        wrapper.appendChild(box);
    });

    if (!day.exercises.length) {
        wrapper.innerHTML = '<div class="rest-box"><h4>No exercises added yet.</h4><p>Use the exercise builder to add drills for this day.</p></div>';
    }

    if (day.exercises.length > 0) {
        completeWorkoutDay(day);
    }
}

function reorderWorkoutExercise(day, fromIndex, toIndex) {
    if (!day || !Array.isArray(day.exercises)
        || !Number.isInteger(fromIndex) || !Number.isInteger(toIndex)
        || fromIndex < 0 || toIndex < 0
        || fromIndex >= day.exercises.length || toIndex >= day.exercises.length
        || fromIndex === toIndex) return;

    const activeExerciseId = workoutState.activeDayDate === day.date
        ? day.exercises[workoutState.activeExerciseIndex]?.id
        : null;
    const [movedExercise] = day.exercises.splice(fromIndex, 1);
    day.exercises.splice(toIndex, 0, movedExercise);

    if (activeExerciseId) {
        workoutState.activeExerciseIndex = day.exercises.findIndex(exercise => exercise.id === activeExerciseId);
    }

    saveWorkoutDayTemplate(day, getWorkoutDayIndex(day.date));
    saveWorkoutData();
    renderWorkoutPlanner();
}

function formatCountdownTime(totalSeconds) {
    const seconds = Math.max(0, Number(totalSeconds) || 0);
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
}

function startWorkoutExercise(day, exerciseIndex) {
    if (!day || day.type !== 'workout') return;
    const exercise = day.exercises[exerciseIndex];
    if (!exercise || exercise.completed) return;

    const setIndex = Number(exercise.currentSet || 1);
    const totalSets = Number(exercise.sets || 1);
    if (setIndex > totalSets) {
        exercise.currentSet = totalSets;
    }
    workoutState.activeDayDate = day.date;
    workoutState.activeExerciseIndex = exerciseIndex;
    workoutState.timerRemaining = Number(exercise.duration || 45);
    workoutState.timerMode = 'exercise';
    day.manualCompleted = false;
    day.manualMissed = false;
    startWorkoutPhaseTimer();
    renderWorkoutPlanner();
}

function startWorkoutPhaseTimer() {
    stopWorkoutTimer();
    workoutState.timerInterval = setInterval(() => {
        if (workoutState.timerRemaining <= 1) {
            skipWorkoutTimerPhase();
            return;
        }
        workoutState.timerRemaining -= 1;
        renderWorkoutPlanner();
    }, 1000);
}

function skipWorkoutTimerPhase() {
    const activeDate = workoutState.activeDayDate;
    const activeIndex = workoutState.activeExerciseIndex;
    const day = activeDate ? getWorkoutDayForDate(activeDate) : null;
    const exercise = day?.exercises?.[activeIndex];
    if (!day || !exercise || workoutState.timerMode === 'idle') return;

    stopWorkoutTimer();
    if (workoutState.timerMode === 'exercise') {
        const currentSet = Number(exercise.currentSet || 1);
        const totalSets = Number(exercise.sets || 1);
        if (currentSet >= totalSets) {
            exercise.completed = true;
            exercise.currentSet = totalSets;
            day.manualCompleted = false;
            day.manualMissed = false;
            workoutState.timerMode = 'idle';
            workoutState.activeDayDate = null;
            workoutState.activeExerciseIndex = null;
            workoutState.timerRemaining = 0;
            showTaskCompleteToast('Exercise complete');
            completeWorkoutDay(day);
            updateWorkoutAchievements();
        } else {
            exercise.currentSet = currentSet + 1;
            workoutState.timerMode = 'rest';
            workoutState.timerRemaining = Math.max(1, Number(exercise.rest || 60));
            showTaskCompleteToast(`Set ${currentSet}/${totalSets} complete`);
            startWorkoutPhaseTimer();
        }
    } else {
        workoutState.timerMode = 'idle';
        workoutState.activeDayDate = null;
        workoutState.activeExerciseIndex = null;
        workoutState.timerRemaining = 0;
    }

    renderWorkoutPlanner();
    saveWorkoutData();
}

function completeWorkoutExercise(day, exerciseIndex) {
    const exercise = day?.exercises?.[exerciseIndex];
    if (!exercise) return;

    if (exercise.completed) {
        if (!confirm(`Undo completion of “${exercise.name}”? Its reps, sets, and weight contribution will be removed from your stats.`)) return;
        exercise.completed = false;
        exercise.currentSet = 1;
        day.manualCompleted = false;
        day.manualMissed = false;
        day.completed = isWorkoutDayCompleted(day);
        updateWorkoutAchievements();
        saveWorkoutData();
        renderWorkoutPlanner();
        return;
    }

    if (workoutState.activeDayDate === day.date && workoutState.activeExerciseIndex === exerciseIndex) {
        stopWorkoutTimer();
        workoutState.activeDayDate = null;
        workoutState.activeExerciseIndex = null;
        workoutState.timerMode = 'idle';
        workoutState.timerRemaining = 0;
    }

    exercise.completed = true;
    exercise.currentSet = Number(exercise.sets || 1);
    day.manualCompleted = false;
    day.manualMissed = false;
    completeWorkoutDay(day);
    updateWorkoutAchievements();
    saveWorkoutData();
    renderWorkoutPlanner();
}

function completeWorkoutDay(day) {
    if (!day || day.type !== 'workout') return;
    const wasCompleted = day.completed;
    day.completed = isWorkoutDayCompleted(day);
    if (day.completed && !wasCompleted) {
        renderWorkoutDays();
        saveWorkoutData();
        showTaskCompleteToast('Workout for the day complete!');
        updateWorkoutAchievements();
    }
}

function stopWorkoutTimer() {
    if (workoutState.timerInterval) {
        clearInterval(workoutState.timerInterval);
        workoutState.timerInterval = null;
    }
}

function formatStopwatchTime(totalMilliseconds) {
    const milliseconds = Math.max(0, Math.floor(totalMilliseconds));
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor(milliseconds / 1000) % 60;
    const remainder = milliseconds % 1000;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(remainder).padStart(3, '0')}`;
}

function formatCountdownStopwatchTime(totalSeconds) {
    const seconds = Math.max(0, Math.floor(totalSeconds));
    return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

function syncCountdownDurationControls(resetTimer = true) {
    const minutesInput = document.getElementById('workout-timer-duration-input');
    const secondsInput = document.getElementById('workout-timer-duration-seconds');
    if (!minutesInput || !secondsInput) return;

    const minutes = Math.max(0, Math.min(59, Math.floor(Number(minutesInput.value || 0))));
    let seconds = Math.max(0, Math.min(59, Math.floor(Number(secondsInput.value || 0))));
    minutesInput.value = String(minutes);
    secondsInput.value = String(seconds);
    if (resetTimer && !workoutState.stopwatchRunning && workoutState.stopwatchMode === 'countdown') resetStopwatch();
}

function renderStopwatch() {
    const display = document.getElementById('workout-stopwatch-display');
    const startButton = document.getElementById('workout-timer-start-btn');
    const face = document.getElementById('workout-stopwatch-face');
    const durationControl = document.getElementById('workout-timer-duration-control');
    const isCountdown = workoutState.stopwatchMode === 'countdown';
    if (!display || !startButton || !face) return;
    const shownTime = isCountdown ? workoutState.stopwatchRemaining : workoutState.stopwatchElapsed;
    const formattedTime = isCountdown ? formatCountdownStopwatchTime(shownTime) : formatStopwatchTime(shownTime);
    display.textContent = formattedTime;
    const innerWidth = Math.max(80, face.clientWidth - 28);
    const preferredFontSize = Math.min(56, Math.max(22, window.innerWidth * (isCountdown ? 0.07 : 0.08)));
    const fittedFontSize = Math.min(preferredFontSize, innerWidth / (formattedTime.length * 0.62));
    display.style.fontSize = `${Math.max(17, fittedFontSize)}px`;
    startButton.textContent = workoutState.stopwatchRunning ? 'Pause' : (shownTime > 0 && (isCountdown ? shownTime < workoutState.stopwatchTotal : shownTime > 0) ? 'Resume' : 'Start');
    const modeSwitch = document.querySelector('.workout-stopwatch-mode-switch');
    modeSwitch?.classList.toggle('countdown-mode', isCountdown);
    const stopwatchModeButton = document.getElementById('workout-mode-stopwatch-btn');
    const countdownModeButton = document.getElementById('workout-mode-countdown-btn');
    stopwatchModeButton?.classList.toggle('active', !isCountdown);
    countdownModeButton?.classList.toggle('active', isCountdown);
    stopwatchModeButton?.setAttribute('aria-pressed', String(!isCountdown));
    countdownModeButton?.setAttribute('aria-pressed', String(isCountdown));
    if (durationControl) durationControl.hidden = !isCountdown;
    const progress = isCountdown && workoutState.stopwatchTotal > 0
        ? (workoutState.stopwatchTotal - workoutState.stopwatchRemaining) / workoutState.stopwatchTotal
        : 0;
    face.style.setProperty('--timer-progress', `${Math.min(1, Math.max(0, progress)) * 360}deg`);
    face.classList.toggle('countdown-mode', isCountdown);
}

function startStopwatch() {
    if (workoutState.stopwatchRunning) {
        stopStopwatch();
        return;
    }
    if (workoutState.stopwatchMode === 'countdown' && workoutState.stopwatchRemaining <= 0) {
        resetStopwatch();
    }
    if (workoutState.stopwatchMode === 'countdown' && workoutState.stopwatchRemaining <= 0) {
        showToast({ icon: '⚠️', name: 'Set a timer duration', desc: 'Enter at least one second to start the countdown.' });
        return;
    }
    workoutState.stopwatchRunning = true;
    if (workoutState.stopwatchMode === 'stopwatch') {
        workoutState.stopwatchStartedAt = performance.now() - workoutState.stopwatchElapsed;
    }
    let previousTick = performance.now();
    workoutState.stopwatchInterval = setInterval(() => {
        const now = performance.now();
        if (workoutState.stopwatchMode === 'countdown') {
            workoutState.stopwatchRemaining = Math.max(0, workoutState.stopwatchRemaining - (now - previousTick) / 1000);
            previousTick = now;
            if (workoutState.stopwatchRemaining === 0) {
                stopStopwatch();
                showToast({ icon: '⏰', name: 'Timer complete', desc: 'Your countdown has finished.' });
                return;
            }
        } else {
            workoutState.stopwatchElapsed = Math.max(0, now - workoutState.stopwatchStartedAt);
        }
        renderStopwatch();
    }, workoutState.stopwatchMode === 'stopwatch' ? 16 : 50);
    renderStopwatch();
}

function stopStopwatch() {
    if (workoutState.stopwatchRunning && workoutState.stopwatchMode === 'stopwatch') {
        workoutState.stopwatchElapsed = Math.max(0, performance.now() - workoutState.stopwatchStartedAt);
    }
    if (workoutState.stopwatchInterval) clearInterval(workoutState.stopwatchInterval);
    workoutState.stopwatchInterval = null;
    workoutState.stopwatchRunning = false;
    renderStopwatch();
}

function resetStopwatch() {
    stopStopwatch();
    workoutState.stopwatchElapsed = 0;
    const durationMinutes = Number(document.getElementById('workout-timer-duration-input')?.value || 0);
    const durationSeconds = Number(document.getElementById('workout-timer-duration-seconds')?.value || 0);
    workoutState.stopwatchTotal = Math.max(0, Math.floor(durationMinutes * 60 + durationSeconds));
    workoutState.stopwatchRemaining = workoutState.stopwatchTotal;
    renderStopwatch();
}

function setWorkoutTimerMode(mode) {
    if (mode !== 'stopwatch' && mode !== 'countdown') return;
    stopStopwatch();
    workoutState.stopwatchMode = mode;
    workoutState.stopwatchElapsed = 0;
    const durationMinutes = Number(document.getElementById('workout-timer-duration-input')?.value || 0);
    const durationSeconds = Number(document.getElementById('workout-timer-duration-seconds')?.value || 0);
    workoutState.stopwatchTotal = Math.max(0, Math.floor(durationMinutes * 60 + durationSeconds));
    workoutState.stopwatchRemaining = workoutState.stopwatchTotal;
    renderStopwatch();
}

function updateWorkoutAchievements() {
    const totalCompletedExercises = workoutState.weeks.reduce((total, week) => total + week.days.reduce((sum, day) => sum + ((day.exercises || []).filter(ex => ex.completed).length), 0), 0);
    const totalWorkoutDays = workoutState.weeks.reduce((total, week) => total + week.days.filter(isWorkoutDayCompleted).length, 0);

    if (totalWorkoutDays >= 1) unlockAchievement('firstWorkout');
    if (totalCompletedExercises >= 3) unlockAchievement('workout3');
    if (totalCompletedExercises >= 5) unlockAchievement('workout5');
    if (totalCompletedExercises >= 10) unlockAchievement('workout10');
    if (totalCompletedExercises >= 15) unlockAchievement('workout15');
    if (totalCompletedExercises >= 30) unlockAchievement('workout30');
}

function renderWorkoutCalendar() {
    const calendar = document.getElementById('workout-calendar-grid');
    if (!calendar) return;

    const firstDayOfMonth = new Date(workoutCalendarMonth.getFullYear(), workoutCalendarMonth.getMonth(), 1);
    const monthLabel = document.getElementById('workout-month-label');
    if (monthLabel) {
        monthLabel.textContent = firstDayOfMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    }
    const numDays = new Date(firstDayOfMonth.getFullYear(), firstDayOfMonth.getMonth() + 1, 0).getDate();
    const startOffset = firstDayOfMonth.getDay() === 0 ? 6 : firstDayOfMonth.getDay() - 1;

    calendar.innerHTML = '';

    const weekdays = [
        ['M', 'Monday'], ['T', 'Tuesday'], ['W', 'Wednesday'], ['T', 'Thursday'],
        ['F', 'Friday'], ['S', 'Saturday'], ['S', 'Sunday']
    ];
    weekdays.forEach(([initial, name]) => {
        const label = document.createElement('div');
        label.className = 'calendar-weekday';
        label.textContent = initial;
        label.setAttribute('aria-label', name);
        calendar.appendChild(label);
    });

    for (let i = 0; i < startOffset; i++) {
        const cell = document.createElement('div');
        cell.className = 'calendar-cell muted';
        cell.innerHTML = '<span class="calendar-date">·</span>';
        calendar.appendChild(cell);
    }

    for (let day = 1; day <= numDays; day++) {
        const cell = document.createElement('button');
        const date = new Date(firstDayOfMonth.getFullYear(), firstDayOfMonth.getMonth(), day);
        const iso = isoDate(date);
        let matchingDay = getWorkoutDayForDate(iso);
        if (!matchingDay && iso >= isoDate(new Date())) {
            const template = getWorkoutWeeklyTemplates()[getWorkoutDayIndex(iso)];
            if (template) matchingDay = { type: template.type, completed: false };
        }
        const isPast = iso < isoDate(new Date());
        const isRest = matchingDay?.type === 'rest';
        const isWorkout = matchingDay?.type === 'workout';
        const isMissed = isWorkout && (isPast || matchingDay.manualMissed) && !matchingDay.completed;
        const isDone = isWorkout && matchingDay.completed;
        const isNullDay = !matchingDay || matchingDay.type === null;
        const statusEmoji = isMissed ? '✕' : isRest ? '💤' : isDone ? '✓' : isWorkout ? '💪' : '·';
        cell.className = `calendar-cell ${isNullDay ? 'null-day' : ''} ${isDone ? 'done' : ''} ${isWorkout ? 'workout-day' : ''} ${isRest ? 'rest-day' : ''} ${isMissed ? 'missed' : ''} ${matchingDay?.date === getCurrentWorkoutDay().date ? 'active' : ''}`;
        cell.innerHTML = `<span class="calendar-date">${day}</span><span class="calendar-emoji">${statusEmoji}</span>`;
        cell.setAttribute('aria-label', `${date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}. ${isMissed ? 'Missed workout' : isRest ? 'Rest day' : isDone ? 'Completed workout' : isWorkout ? 'Scheduled workout' : 'No workout status'}. Click to edit status.`);
        cell.addEventListener('click', () => {
            openWorkoutCalendarStatusEditor(date);
        });
        calendar.appendChild(cell);
    }
}

function openWorkoutCalendarStatusEditor(date) {
    workoutCalendarEditingDate = date;
    const overlay = document.getElementById('workout-calendar-status-overlay');
    const dateLabel = document.getElementById('workout-calendar-status-date');
    if (!overlay || !dateLabel) return;
    dateLabel.textContent = date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
    overlay.hidden = false;
    syncWorkoutOverlayScrollLock();
    overlay.querySelector('[data-calendar-status]')?.focus();
}

function closeWorkoutCalendarStatusEditor() {
    const overlay = document.getElementById('workout-calendar-status-overlay');
    if (overlay) overlay.hidden = true;
    syncWorkoutOverlayScrollLock();
    workoutCalendarEditingDate = null;
}

function syncWorkoutOverlayScrollLock() {
    const modalIds = [
        'workout-calendar-status-overlay',
        'workout-exercise-modal',
        'workout-timer-overlay',
        'workout-weight-entry-overlay'
    ];
    const hasOpenModal = modalIds.some(id => {
        const modal = document.getElementById(id);
        return modal && !modal.hidden;
    });
    document.body.classList.toggle('workout-overlay-open', hasOpenModal);
}

function applyWorkoutCalendarStatus(status) {
    if (!workoutCalendarEditingDate) return;

    const date = workoutCalendarEditingDate;
    const dateIso = isoDate(date);
    const weekStart = isoDate(getMonday(date));
    let week = workoutState.weeks.find(item => item.weekStart === weekStart);
    if (!week) {
        week = createDefaultWorkoutWeek(parseWorkoutDate(weekStart));
        const today = isoDate(new Date());
        week.days.forEach(day => {
            if (day.date < today) {
                day.type = null;
                day.exercises = [];
                day.completed = false;
            }
        });
        workoutState.weeks.push(week);
    }
    const dayIndex = week.days.findIndex(item => item.date === dateIso);
    if (dayIndex < 0) return;

    const day = week.days[dayIndex];
    if (status === 'rest') {
        if (day.type === 'workout') day.savedExercisesForWorkout = (day.exercises || []).map(exercise => ({ ...exercise }));
        day.type = 'rest';
        day.exercises = [];
        day.completed = false;
        day.manualCompleted = false;
        day.manualMissed = false;
    } else {
        if (day.type === 'rest') {
            const templateExercises = getWorkoutWeeklyTemplates()[dayIndex]?.exercises || [];
            const exercisesToRestore = day.savedExercisesForWorkout?.length ? day.savedExercisesForWorkout : templateExercises;
            day.exercises = cloneWorkoutExercises(exercisesToRestore, dateIso);
        }
        day.type = 'workout';
        if (status === 'completed') {
            day.exercises.forEach(exercise => {
                exercise.completed = true;
                exercise.currentSet = Number(exercise.sets || 1);
            });
            day.manualCompleted = true;
            day.manualMissed = false;
            day.completed = true;
        } else {
            day.manualCompleted = false;
            day.manualMissed = true;
            day.completed = false;
        }
        delete day.savedExercisesForWorkout;
    }

    closeWorkoutCalendarStatusEditor();
    updateWorkoutAchievements();
    renderWorkoutMetrics();
    renderWorkoutCalendar();
    renderWorkoutAchievements();
    if (getCurrentWorkoutDay().date === dateIso) renderWorkoutDayDetail();
    saveWorkoutData();
}

function renderWorkoutAchievements() {
    const list = document.getElementById('workout-achievements-list');
    if (!list) return;

    const isAdmin = isDeveloperMode();
    const adminControls = document.getElementById('workout-achievements-admin');
    if (adminControls) adminControls.hidden = !isAdmin;

    const deletedAchievementIds = getDeletedAchievementIds();
    const fixedAchievements = Object.keys(workoutAchievementTemplates)
        .filter(key => !deletedAchievementIds.has(key))
        .map(key => achievements[key] || workoutAchievementTemplates[key]);
    const customAchievements = Object.values(achievements).filter(achievement => achievement.customWorkoutAchievement);
    const allAchievements = [...fixedAchievements, ...customAchievements];
    const pageSize = 6;
    const pageCount = Math.max(1, Math.ceil(allAchievements.length / pageSize));
    workoutAchievementPage = Math.max(0, Math.min(workoutAchievementPage, pageCount - 1));
    const visibleAchievements = allAchievements.slice(workoutAchievementPage * pageSize, (workoutAchievementPage + 1) * pageSize);

    list.replaceChildren();
    visibleAchievements.forEach(achievement => {
        const unlocked = !!achievement.unlocked;
        const card = document.createElement('article');
        card.className = `workout-achievement-card ${unlocked ? 'unlocked' : ''}`;

        const title = document.createElement('h4');
        title.textContent = unlocked || isAdmin ? achievement.name : 'Locked';
        const description = document.createElement('p');
        description.textContent = unlocked || isAdmin ? achievement.desc : 'Complete the milestone to unlock this achievement.';
        const icon = document.createElement('div');
        icon.className = 'workout-achievement-icon';
        if (achievement.imageData) {
            const image = document.createElement('img');
            image.src = achievement.imageData;
            image.alt = `${achievement.name} icon`;
            icon.appendChild(image);
        } else if (achievement.emoji) {
            icon.textContent = achievement.emoji;
        } else {
            icon.innerHTML = achievement.icon || '🏆';
        }
        card.append(title, description, icon);

        if (isAdmin) {
            const editButton = document.createElement('button');
            editButton.type = 'button';
            editButton.className = 'mini-btn workout-achievement-edit-btn';
            editButton.textContent = 'Edit';
            editButton.addEventListener('click', () => openWorkoutAchievementEditor(achievement.id));
            card.appendChild(editButton);

            const deleteButton = document.createElement('button');
            deleteButton.type = 'button';
            deleteButton.className = 'mini-btn workout-achievement-delete-btn';
            deleteButton.textContent = 'Delete';
            deleteButton.addEventListener('click', () => deleteWorkoutAchievement(achievement.id));
            card.appendChild(deleteButton);
        }
        list.appendChild(card);
    });

    const pagination = document.getElementById('workout-achievements-pagination');
    const pageLabel = document.getElementById('workout-achievements-page-label');
    const previousButton = document.getElementById('workout-achievements-prev-btn');
    const nextButton = document.getElementById('workout-achievements-next-btn');
    if (pagination) pagination.hidden = pageCount <= 1;
    if (pageLabel) pageLabel.textContent = `${workoutAchievementPage + 1} / ${pageCount}`;
    if (previousButton) previousButton.disabled = workoutAchievementPage === 0;
    if (nextButton) nextButton.disabled = workoutAchievementPage >= pageCount - 1;
}

function openWorkoutAchievementEditor(achievementId = '') {
    const achievement = achievementId ? achievements[achievementId] : null;
    const form = document.getElementById('workout-achievement-form');
    if (!form) return;

    document.getElementById('workout-achievement-id').value = achievement?.id || '';
    document.getElementById('workout-achievement-name').value = achievement?.name || '';
    document.getElementById('workout-achievement-description').value = achievement?.desc || '';
    document.getElementById('workout-achievement-emoji').value = achievement?.emoji || '';
    document.getElementById('workout-achievement-unlocked').checked = !!achievement?.unlocked;
    document.getElementById('workout-achievement-trigger-stat').value = achievement?.trigger?.stat || '';
    document.getElementById('workout-achievement-trigger-target').value = achievement?.trigger?.target || 1;
    document.getElementById('workout-achievement-photo').value = '';
    workoutAchievementPhotoDraft = achievement?.imageData || '';
    const addButton = document.getElementById('workout-achievement-add-btn');
    if (addButton) addButton.hidden = true;
    form.hidden = false;
    renderWorkoutAchievementIconPreview(achievement);
    document.getElementById('workout-achievement-name').focus();
}

function deleteWorkoutAchievement(achievementId) {
    if (!isDeveloperMode()) return;
    const achievement = achievements[achievementId] || workoutAchievementTemplates[achievementId];
    if (!achievement) return;
    if (!confirm(`Delete “${achievement.name}”? This cannot be undone.`)) return;

    if (document.getElementById('workout-achievement-id').value === achievementId) {
        closeWorkoutAchievementEditor();
    }
    delete achievements[achievementId];
    const deletedAchievementIds = getDeletedAchievementIds();
    deletedAchievementIds.add(achievementId);
    localStorage.setItem(DELETED_ACHIEVEMENTS_KEY, JSON.stringify([...deletedAchievementIds]));
    saveData();
    renderWorkoutAchievements();
    renderAchievements();
}

function renderWorkoutAchievementIconPreview(existingAchievement = null) {
    const preview = document.getElementById('workout-achievement-icon-preview');
    if (!preview) return;
    preview.replaceChildren();
    if (workoutAchievementPhotoDraft) {
        const image = document.createElement('img');
        image.src = workoutAchievementPhotoDraft;
        image.alt = 'Achievement icon preview';
        preview.appendChild(image);
    } else {
        const emoji = document.getElementById('workout-achievement-emoji')?.value.trim();
        if (emoji) preview.textContent = emoji;
        else if (existingAchievement?.icon) preview.innerHTML = existingAchievement.icon;
        else preview.textContent = '🏆';
    }
}

async function saveWorkoutAchievementFromForm(event) {
    event.preventDefault();
    if (!isDeveloperMode()) return;
    const idField = document.getElementById('workout-achievement-id');
    const name = document.getElementById('workout-achievement-name').value.trim();
    const description = document.getElementById('workout-achievement-description').value.trim();
    const emoji = document.getElementById('workout-achievement-emoji').value.trim();
    const triggerStat = document.getElementById('workout-achievement-trigger-stat').value;
    const triggerTarget = Number(document.getElementById('workout-achievement-trigger-target').value);
    const photo = document.getElementById('workout-achievement-photo').files?.[0];
    const existing = idField.value ? achievements[idField.value] : null;

    if (photo) {
        if (!photo.type.startsWith('image/') || photo.size > 1024 * 1024) {
            alert('Choose an image smaller than 1 MB.');
            return;
        }
        try {
            workoutAchievementPhotoDraft = await readFileAsDataUrl(photo);
        } catch (error) {
            alert('Could not read the selected achievement image.');
            return;
        }
    }
    if (emoji && /[<>]/.test(emoji)) {
        alert('Enter an emoji, not markup.');
        return;
    }
    if (!name || !description || (!existing && !emoji && !workoutAchievementPhotoDraft)) {
        alert('Enter a name and description, and choose an emoji or photo.');
        return;
    }
    if (triggerStat && (!Number.isFinite(triggerTarget) || triggerTarget <= 0)) {
        alert('Enter a target greater than zero for the achievement trigger.');
        return;
    }

    const id = existing?.id || `customWorkout-${Date.now()}`;
    const next = {
        ...(existing || {}),
        id,
        name,
        desc: description,
        unlocked: document.getElementById('workout-achievement-unlocked').checked,
        customWorkoutAchievement: existing?.customWorkoutAchievement || !existing
    };
    if (triggerStat) next.trigger = { stat: triggerStat, target: triggerTarget };
    else delete next.trigger;
    if (workoutAchievementPhotoDraft && (photo || !emoji)) {
        next.imageData = workoutAchievementPhotoDraft;
        next.emoji = '';
        next.icon = `<img src="${workoutAchievementPhotoDraft}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:10px;display:block;">`;
    } else if (emoji) {
        next.emoji = emoji;
        next.imageData = '';
        next.icon = emoji;
    }
    achievements[id] = next;
    saveData();
    recalculatePoints();
    updatePointsUI();
    evaluateAchievementTriggers();
    const achievementCount = Object.keys(workoutAchievementTemplates).length
        + Object.values(achievements).filter(achievement => achievement.customWorkoutAchievement).length;
    workoutAchievementPage = Math.max(0, Math.ceil(achievementCount / 6) - 1);
    closeWorkoutAchievementEditor();
    renderWorkoutAchievements();
    renderAchievements();
}

function closeWorkoutAchievementEditor() {
    const form = document.getElementById('workout-achievement-form');
    if (form) form.hidden = true;
    const addButton = document.getElementById('workout-achievement-add-btn');
    if (addButton) addButton.hidden = false;
    document.getElementById('workout-achievement-photo').value = '';
    workoutAchievementPhotoDraft = '';
}

function renderWorkoutPlanner() {
    const week = getWorkoutWeekForCurrentView();
    const viewedWeekDate = parseWorkoutDate(week.weekStart);
    workoutCalendarMonth = new Date(viewedWeekDate.getFullYear(), viewedWeekDate.getMonth(), 1);
    const label = document.getElementById('workout-week-label');
    const currentWeekButton = document.getElementById('workout-current-week-btn');
    if (currentWeekButton) currentWeekButton.hidden = week.weekStart === isoDate(getMonday(new Date()));
    if (label) {
        const start = parseWorkoutDate(week.weekStart);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        label.textContent = `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
    }

    renderWorkoutDays();
    renderWorkoutMetrics();
    renderWorkoutDayDetail();
    renderWorkoutCalendar();
    renderWorkoutAchievements();
    addCategoryFilterButtons();
    renderWorkoutExerciseList();
    saveWorkoutData();
    if (currentScreen === 'workoutNow') refreshWorkoutNowControls();
}

function syncWorkoutWeekNavigation(direction) {
    const current = parseWorkoutDate(workoutState.currentWeekStart);
    current.setDate(current.getDate() + (direction * 7));
    workoutState.currentWeekStart = isoDate(current);
    workoutState.selectedDayIndex = 0;
    renderWorkoutPlanner();
}

function goToCurrentWorkoutWeek() {
    const today = new Date();
    workoutState.currentWeekStart = isoDate(getMonday(today));
    workoutState.selectedDayIndex = (today.getDay() + 6) % 7;
    renderWorkoutPlanner();
}

function syncWorkoutMonthNavigation(direction) {
    workoutCalendarMonth = new Date(workoutCalendarMonth.getFullYear(), workoutCalendarMonth.getMonth() + direction, 1);
    renderWorkoutCalendar();
}

function initializeWorkoutProgram() {
    ensureWorkoutState();
    ensureWorkoutWeeklyTemplates();
    const deletedAchievementIds = getDeletedAchievementIds();
    const editor = document.getElementById('workout-exercise-editor');
    const editorModalContent = document.getElementById('workout-exercise-modal-content');
    if (editor && editorModalContent && editor.parentElement !== editorModalContent) {
        editorModalContent.appendChild(editor);
        editor.classList.add('exercise-editor-in-modal');
    }
    Object.keys(workoutAchievementTemplates).forEach(key => {
        if (deletedAchievementIds.has(key)) {
            delete achievements[key];
            return;
        }
        if (!achievements[key]) {
            achievements[key] = { ...workoutAchievementTemplates[key] };
        }
        try {
            const savedAchievement = JSON.parse(localStorage.getItem('triviaAchievements') || '{}')[key];
            if (savedAchievement) Object.assign(achievements[key], savedAchievement);
        } catch (error) {
            // Keep the built-in achievement defaults if saved data is malformed.
        }
    });
    addCategoryFilterButtons();
    renderWorkoutPlanner();

    initializeWorkoutExerciseListResize();

    document.getElementById('workout-prev-week-btn')?.addEventListener('click', () => {
        syncWorkoutWeekNavigation(-1);
    });

    document.getElementById('workout-next-week-btn')?.addEventListener('click', () => {
        syncWorkoutWeekNavigation(1);
    });

    document.getElementById('workout-current-week-btn')?.addEventListener('click', goToCurrentWorkoutWeek);
    document.getElementById('workout-prev-month-btn')?.addEventListener('click', () => syncWorkoutMonthNavigation(-1));
    document.getElementById('workout-next-month-btn')?.addEventListener('click', () => syncWorkoutMonthNavigation(1));
    document.getElementById('workout-calendar-status-close')?.addEventListener('click', closeWorkoutCalendarStatusEditor);
    document.getElementById('workout-calendar-status-overlay')?.addEventListener('click', event => {
        if (event.target.id === 'workout-calendar-status-overlay') closeWorkoutCalendarStatusEditor();
    });
    document.getElementById('workout-calendar-status-overlay')?.addEventListener('wheel', event => event.preventDefault(), { passive: false });
    document.getElementById('workout-calendar-status-overlay')?.addEventListener('touchmove', event => event.preventDefault(), { passive: false });
    document.addEventListener('keydown', event => {
        const statusOverlay = document.getElementById('workout-calendar-status-overlay');
        if (event.key === 'Escape' && statusOverlay && !statusOverlay.hidden) closeWorkoutCalendarStatusEditor();
    });
    document.querySelectorAll('[data-calendar-status]').forEach(button => {
        button.addEventListener('click', () => applyWorkoutCalendarStatus(button.dataset.calendarStatus));
    });

    document.getElementById('workout-new-program-btn')?.addEventListener('click', resetActiveWorkoutProgram);
    const weightButton = document.getElementById('workout-weight-btn');
    const weightMenu = document.getElementById('workout-weight-menu');
    weightButton?.addEventListener('click', () => {
        if (!getBodyWeightEntries().length) {
            openWorkoutWeightEntry();
            return;
        }
        weightMenu.hidden = !weightMenu.hidden;
        weightButton.setAttribute('aria-expanded', String(!weightMenu.hidden));
    });
    weightMenu?.querySelector('[data-weight-action="update"]')?.addEventListener('click', openWorkoutWeightEntry);
    weightMenu?.querySelector('[data-weight-action="graph"]')?.addEventListener('click', openWeightHistoryScreen);
    document.addEventListener('click', event => {
        if (!event.target.closest('.workout-weight-menu-wrap') && weightMenu && !weightMenu.hidden) {
            weightMenu.hidden = true;
            weightButton?.setAttribute('aria-expanded', 'false');
        }
    });
    document.getElementById('workout-weight-entry-form')?.addEventListener('submit', saveWorkoutWeightEntry);
    document.getElementById('workout-weight-date')?.addEventListener('change', event => {
        const selectedDate = event.target.value;
        const existingEntry = getBodyWeightEntries().find(entry => entry.date === selectedDate);
        document.getElementById('workout-weight-input').value = existingEntry ? String(existingEntry.weight) : '';
    });
    document.getElementById('workout-weight-cancel-btn')?.addEventListener('click', closeWorkoutWeightEntry);
    document.getElementById('workout-weight-entry-overlay')?.addEventListener('click', event => {
        if (event.target.id === 'workout-weight-entry-overlay') closeWorkoutWeightEntry();
    });
    document.getElementById('weight-history-back-btn')?.addEventListener('click', () => showScreen(weightHistoryReturnScreen));
    document.getElementById('health-log-weight-btn')?.addEventListener('click', openWorkoutWeightEntry);
    const bmiHeight = document.getElementById('bmi-height');
    const bmiAge = document.getElementById('bmi-age');
    try {
        const savedBmiInputs = JSON.parse(localStorage.getItem('triviaWorkoutBmiInputs') || '{}');
        bmiHeight.value = savedBmiInputs.height || '';
        bmiAge.value = savedBmiInputs.age || '';
    } catch (error) {
        // Ignore malformed saved measurements.
    }
    document.getElementById('bmi-form')?.addEventListener('submit', event => {
        event.preventDefault();
        localStorage.setItem('triviaWorkoutBmiInputs', JSON.stringify({ height: bmiHeight.value, age: bmiAge.value }));
        renderBmiResult();
    });
    [bmiHeight, bmiAge].forEach(input => input.addEventListener('input', () => {
        document.getElementById('bmi-result').textContent = 'Select Calculate BMI to update your result.';
    }));
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            const weightOverlay = document.getElementById('workout-weight-entry-overlay');
            if (weightOverlay && !weightOverlay.hidden) closeWorkoutWeightEntry();
        }
    });
    document.getElementById('workout-save-plan-btn')?.addEventListener('click', saveNamedWorkoutPlan);
    document.getElementById('workout-switch-plan-btn')?.addEventListener('click', switchToSavedWorkoutPlan);
    document.getElementById('workout-saved-plans-select')?.addEventListener('change', () => {
        document.getElementById('workout-switch-plan-btn').disabled = !document.getElementById('workout-saved-plans-select').value;
    });
    renderSavedWorkoutPlans();

    document.getElementById('workout-timer-open-btn')?.addEventListener('click', () => {
        const timerOverlay = document.getElementById('workout-timer-overlay');
        timerOverlay.hidden = false;
        syncWorkoutOverlayScrollLock();
        renderStopwatch();
    });
    document.getElementById('workout-timer-close-btn')?.addEventListener('click', () => {
        document.getElementById('workout-timer-overlay').hidden = true;
        syncWorkoutOverlayScrollLock();
    });
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            const overlay = document.getElementById('workout-timer-overlay');
            if (overlay && !overlay.hidden) {
                overlay.hidden = true;
                syncWorkoutOverlayScrollLock();
            }
        }
    });
    document.getElementById('workout-timer-overlay')?.addEventListener('click', event => {
        if (event.target.id === 'workout-timer-overlay') {
            event.currentTarget.hidden = true;
            syncWorkoutOverlayScrollLock();
        }
    });
    document.getElementById('workout-timer-start-btn')?.addEventListener('click', startStopwatch);
    document.getElementById('workout-timer-reset-btn')?.addEventListener('click', resetStopwatch);
    document.getElementById('workout-mode-stopwatch-btn')?.addEventListener('click', () => setWorkoutTimerMode('stopwatch'));
    document.getElementById('workout-mode-countdown-btn')?.addEventListener('click', () => setWorkoutTimerMode('countdown'));
    document.getElementById('workout-timer-duration-input')?.addEventListener('change', () => syncCountdownDurationControls());
    document.getElementById('workout-timer-duration-seconds')?.addEventListener('change', () => syncCountdownDurationControls());
    syncCountdownDurationControls(false);
    document.querySelectorAll('.workout-duration-adjust').forEach(button => {
        button.addEventListener('click', () => {
            const input = document.getElementById(button.dataset.target);
            if (!input) return;
            const min = Number(input.min || 0);
            const max = Number(input.max || Number.MAX_SAFE_INTEGER);
            const current = Number(input.value || 0);
            const step = Number(button.dataset.step || 0);
            input.value = String(Math.max(min, Math.min(max, current + step)));
            input.dispatchEvent(new Event('change', { bubbles: true }));
        });
    });
    document.getElementById('workout-exercise-till-failure-btn')?.addEventListener('click', () => {
        toggleExerciseOption('workout-exercise-till-failure-btn', 'workout-exercise-reps');
    });
    document.getElementById('workout-exercise-bodyweight-btn')?.addEventListener('click', () => {
        toggleExerciseOption('workout-exercise-bodyweight-btn', 'workout-exercise-weight');
    });
    document.querySelectorAll('.exercise-number-adjust').forEach(button => {
        button.addEventListener('click', () => {
            const input = document.getElementById(button.dataset.target);
            if (!input || input.disabled) return;
            const min = Number(input.min || 0);
            const max = Number(input.max || Number.MAX_SAFE_INTEGER);
            const current = Number(input.value || min);
            const step = Number(input.step || 1) * Number(button.dataset.step || 0);
            input.value = String(Math.max(min, Math.min(max, current + step)));
            input.dispatchEvent(new Event('change', { bubbles: true }));
        });
    });
    document.getElementById('workout-exercise-duration-slider')?.addEventListener('input', () => syncExerciseDurationInput('workout-exercise-duration-slider'));
    document.getElementById('workout-exercise-rest-slider')?.addEventListener('input', () => syncExerciseDurationInput('workout-exercise-rest-slider'));
    document.getElementById('workout-exercise-duration')?.addEventListener('change', () => syncExerciseDurationSlider('workout-exercise-duration', false));
    document.getElementById('workout-exercise-rest')?.addEventListener('change', () => syncExerciseDurationSlider('workout-exercise-rest', false));
    document.getElementById('workout-reset-all-stats-btn')?.addEventListener('click', () => {
        document.getElementById('reset-all-progress-btn')?.click();
    });
    document.getElementById('workout-achievement-add-btn')?.addEventListener('click', () => openWorkoutAchievementEditor());
    document.getElementById('workout-achievement-form')?.addEventListener('submit', saveWorkoutAchievementFromForm);
    document.getElementById('workout-achievement-cancel-btn')?.addEventListener('click', closeWorkoutAchievementEditor);
    document.getElementById('workout-achievement-emoji')?.addEventListener('input', () => renderWorkoutAchievementIconPreview());
    document.getElementById('workout-achievement-photo')?.addEventListener('change', async event => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/') || file.size > 1024 * 1024) {
            alert('Choose an image smaller than 1 MB.');
            event.target.value = '';
            return;
        }
        try {
            workoutAchievementPhotoDraft = await readFileAsDataUrl(file);
            renderWorkoutAchievementIconPreview();
        } catch (error) {
            alert('Could not read the selected achievement image.');
        }
    });
    document.getElementById('workout-achievements-prev-btn')?.addEventListener('click', () => {
        workoutAchievementPage = Math.max(0, workoutAchievementPage - 1);
        renderWorkoutAchievements();
    });
    document.getElementById('workout-achievements-next-btn')?.addEventListener('click', () => {
        const count = Object.keys(workoutAchievementTemplates).length
            + Object.values(achievements).filter(achievement => achievement.customWorkoutAchievement).length;
        workoutAchievementPage = Math.min(Math.ceil(count / 6) - 1, workoutAchievementPage + 1);
        renderWorkoutAchievements();
    });
    document.getElementById('workout-export-btn')?.addEventListener('click', exportWorkoutProgram);
    document.getElementById('workout-import-btn')?.addEventListener('click', () => document.getElementById('workout-import-file')?.click());
    document.getElementById('workout-import-file')?.addEventListener('change', event => {
        const file = event.target.files?.[0];
        if (file) importWorkoutProgramFile(file);
        event.target.value = '';
    });
    renderStopwatch();

    document.getElementById('workout-save-exercise-btn')?.addEventListener('click', saveExerciseFromEditor);
    document.getElementById('workout-create-exercise-btn')?.addEventListener('click', () => {
        clearExerciseEditor();
        openExerciseEditor();
    });
    document.getElementById('workout-clear-editor-btn')?.addEventListener('click', closeExerciseEditor);
    document.getElementById('workout-exercise-modal-close-btn')?.addEventListener('click', closeExerciseEditor);
    document.getElementById('workout-exercise-modal')?.addEventListener('click', event => {
        if (event.target.id === 'workout-exercise-modal') closeExerciseEditor();
    });
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            const modal = document.getElementById('workout-exercise-modal');
            if (modal && !modal.hidden) closeExerciseEditor();
        }
    });
    document.getElementById('workout-add-category-btn')?.addEventListener('click', addWorkoutCategory);
    document.getElementById('workout-new-category-input')?.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') addWorkoutCategory();
    });
    hydrateWorkoutCategoriesSelect();
}

function createQrCodeImageFromText() {
    const container = document.createElement('div');
    container.setAttribute('role', 'dialog');
    container.setAttribute('aria-modal', 'true');
    container.setAttribute('aria-label', 'Create a QR code');
    container.style.position = 'fixed';
    container.style.inset = '0';
    container.style.background = 'rgba(0,0,0,0.75)';
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.justifyContent = 'center';
    container.style.zIndex = '5000';

    const modal = document.createElement('section');
    Object.assign(modal.style, {
        width: '360px', maxWidth: '90vw', background: '#111827', borderRadius: '18px',
        padding: '20px', border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.4)', color: '#fff'
    });

    const title = document.createElement('h3');
    title.textContent = 'Create QR Code';
    title.style.margin = '0 0 12px';
    title.style.color = '#fff';

    const label = document.createElement('label');
    label.textContent = 'Text or link';
    label.style.display = 'block';
    label.style.marginBottom = '8px';
    label.style.color = '#b2bec3';

    const input = document.createElement('input');
    input.type = 'text';
    input.value = 'Workout Plan';
    input.placeholder = 'Enter text or a link';
    input.setAttribute('aria-label', 'Text or link to encode');
    Object.assign(input.style, {
        width: '100%', padding: '11px 12px', border: '1px solid rgba(255,255,255,0.18)',
        borderRadius: '10px', background: '#080b13', color: '#fff', font: 'inherit'
    });

    const qrResult = document.createElement('div');
    qrResult.style.marginTop = '14px';
    qrResult.style.textAlign = 'center';

    const img = document.createElement('img');
    img.alt = 'QR code';
    img.style.width = '220px';
    img.style.height = '220px';
    img.style.display = 'block';
    img.style.margin = '0 auto 12px';
    img.style.background = '#fff';
    img.style.borderRadius = '12px';
    img.style.padding = '8px';

    const close = document.createElement('button');
    close.textContent = 'Close';
    close.style.marginTop = '12px';
    close.style.width = '100%';
    close.style.padding = '10px';
    close.style.borderRadius = '10px';
    close.style.background = 'linear-gradient(135deg, #00cec9, #6c5ce7)';
    close.style.color = '#fff';
    close.style.fontWeight = '700';
    close.onclick = () => container.remove();

    const generate = document.createElement('button');
    generate.type = 'button';
    generate.textContent = 'Generate QR Code';
    Object.assign(generate.style, {
        width: '100%', marginTop: '14px', padding: '11px', borderRadius: '10px',
        background: 'linear-gradient(135deg, #00cec9, #6c5ce7)', color: '#fff', fontWeight: '700'
    });

    const download = document.createElement('a');
    download.download = 'qr-code.png';
    download.hidden = true;
    download.style.display = 'inline-block';
    download.style.width = '100%';
    download.style.marginTop = '8px';
    download.style.textAlign = 'center';
    download.style.padding = '10px';
    download.style.borderRadius = '10px';
    download.style.background = 'rgba(255,255,255,0.06)';
    download.style.color = '#fff';
    download.style.textDecoration = 'none';
    download.style.border = '1px solid rgba(255,255,255,0.12)';
    download.textContent = 'Download PNG';

    function generateQr() {
        const text = input.value.trim();
        if (!text) {
            input.focus();
            return;
        }
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(text)}`;
        img.onload = () => {
            download.href = qrUrl;
            download.hidden = false;
            qrResult.replaceChildren(img, download);
        };
        img.onerror = () => {
            qrResult.textContent = 'QR code service is unavailable. Check your internet connection and try again.';
            download.hidden = true;
        };
        qrResult.textContent = 'Generating…';
        img.src = qrUrl;
    }

    generate.addEventListener('click', generateQr);
    input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') generateQr();
        if (event.key === 'Escape') container.remove();
    });
    container.addEventListener('click', (event) => {
        if (event.target === container) container.remove();
    });

    modal.appendChild(title);
    label.appendChild(input);
    modal.appendChild(label);
    modal.appendChild(generate);
    modal.appendChild(qrResult);
    modal.appendChild(download);
    modal.appendChild(close);
    container.appendChild(modal);
    document.body.appendChild(container);
    input.focus();
}

const devCreateQrBtn = document.getElementById('dev-create-qr-btn');
if (devCreateQrBtn) {
    devCreateQrBtn.addEventListener('click', createQrCodeImageFromText);
}

// QotD Elements & Logic
const qotdWelcomeBtn = document.getElementById('qotd-welcome-btn');
const qotdTimerDisplay = document.getElementById('qotd-timer');
const qotdBackBtn = document.getElementById('qotd-back-btn');
const qotdFinishBtn = document.getElementById('qotd-finish-btn');
const qotdOptions = document.getElementById('qotd-options');
let qotdAnswerSelected = false;
let qotdCorrect = false;
let qotdTimerInterval = null;

function checkQotdStatus() {
    const lastCompleted = localStorage.getItem('qotdCompletedDate');
    const today = new Date().toDateString();
    const adminControls = document.getElementById('qotd-admin-controls');
    const newQuestionButton = document.getElementById('qotd-reset-btn');
    const isAdmin = isDeveloperMode();
    if (adminControls) adminControls.hidden = !isAdmin;
    if (newQuestionButton) newQuestionButton.disabled = !isAdmin;

    if (!isAdmin && lastCompleted === today) {
        qotdWelcomeBtn.classList.add('locked');
        qotdWelcomeBtn.disabled = true;
        startQotdCountdown();
    } else {
        qotdWelcomeBtn.classList.remove('locked');
        qotdWelcomeBtn.disabled = false;
        qotdTimerDisplay.textContent = "Available Now!";
        if (qotdTimerInterval) clearInterval(qotdTimerInterval);
    }
}

function startQotdCountdown() {
    if (qotdTimerInterval) clearInterval(qotdTimerInterval);
    function updateTimer() {
        const now = new Date();
        const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        const diff = tomorrow - now;
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        qotdTimerDisplay.textContent = `Next question in: ${h}h ${m}m ${s}s`;
    }
    updateTimer();
    qotdTimerInterval = setInterval(updateTimer, 1000);
}

function showQotdQuestion(forceNewQuestion = false) {
    if (forceNewQuestion && !isDeveloperMode()) return;
    const today = new Date().toDateString();
    const allQotdQuestions = [...qotdData, ...qotdSeasonTwoData];
    let qotdIndex = Number.parseInt(localStorage.getItem('qotdRandomIndex'), 10);
    const qotdDate = localStorage.getItem('qotdDate');
    
    if (forceNewQuestion || qotdDate !== today || !Number.isInteger(qotdIndex) || qotdIndex < 0 || qotdIndex >= allQotdQuestions.length) {
        const previousIndex = qotdIndex;
        qotdIndex = Math.floor(Math.random() * allQotdQuestions.length);
        if (forceNewQuestion && allQotdQuestions.length > 1 && qotdIndex === previousIndex) {
            qotdIndex = (qotdIndex + 1) % allQotdQuestions.length;
        }
        localStorage.setItem('qotdRandomIndex', qotdIndex);
        localStorage.setItem('qotdDate', today);
    }
    
    const q = allQotdQuestions[Number(qotdIndex)];
    const randomizedOptions = shuffle(q.options.map((option, index) => ({ option, index })));
    const correctAnswerIndex = randomizedOptions.findIndex(option => option.index === q.answer);
    
    document.getElementById('qotd-category-title').textContent = `Category: ${q.category}`;
    document.getElementById('qotd-text').textContent = q.q;
    
    qotdOptions.innerHTML = '';
    qotdAnswerSelected = false;
    qotdCorrect = false;
    qotdFinishBtn.classList.add('hidden');
    
    randomizedOptions.forEach(({ option }, index) => {
        const btn = document.createElement('button');
        btn.classList.add('option-btn');
        btn.textContent = option;
        
        // Dev outline cheat
        if (localStorage.getItem('devMode') === 'true' && index === correctAnswerIndex) {
            btn.style.outline = '3px solid var(--secondary)';
            btn.style.boxShadow = '0 0 15px var(--secondary)';
        }
        
        btn.addEventListener('click', () => {
            if (qotdAnswerSelected) return;
            playPopSound();
            qotdAnswerSelected = true;
            if (index === correctAnswerIndex) {
                btn.classList.add('correct');
                qotdCorrect = true;
            } else {
                btn.classList.add('wrong');
                qotdOptions.children[correctAnswerIndex].classList.add('correct');
                qotdCorrect = false;
            }
            Array.from(qotdOptions.children).forEach(b => b.disabled = true);
            const isAdmin = isDeveloperMode();
            qotdFinishBtn.textContent = isAdmin
                ? (qotdCorrect ? 'Correct! Play again anytime' : 'Close! Play again anytime')
                : (qotdCorrect ? 'Correct! Come back tomorrow' : 'Close! Come back tomorrow');
            qotdFinishBtn.classList.remove('hidden');
            if (!isAdmin) localStorage.setItem('qotdCompletedDate', new Date().toDateString());
        });
        qotdOptions.appendChild(btn);
    });
    
    showScreen('qotd');
}

qotdWelcomeBtn.addEventListener('click', () => {
    playPopSound();
    checkQotdStatus();
    showQotdQuestion();
});

document.getElementById('qotd-reset-btn')?.addEventListener('click', () => {
    if (!isDeveloperMode()) return;
    playPopSound();
    localStorage.removeItem('qotdCompletedDate');
    checkQotdStatus();
    showQotdQuestion(true);
});

qotdBackBtn.addEventListener('click', () => {
    playPopSound();
    showScreen('welcome');
});
qotdFinishBtn.addEventListener('click', () => {
    playPopSound();
    showScreen('welcome');
    checkQotdStatus();
});

// Game Logic
function startGame() {
    score = 0;
    currentQuestionIndex = 0;

    if (currentCategory === 'personal') {
        // Fixed order, always the same 10 questions — no shuffle
        questions = [...triviaData.personal];
    } else {
        // Get questions from data and shuffle them
        const questionBank = currentTriviaSeason === '2' ? seasonTwoTriviaData : triviaData;
        const allQuestions = questionBank[currentCategory][currentDifficulty];
        questions = shuffle([...allQuestions]).slice(0, 10);
    }

    showScreen('game');
    loadQuestion();
}

function loadQuestion() {
    answerSelected = false;
    nextBtn.classList.add('hidden');
    optionsContainer.innerHTML = '';
    
    const q = questions[currentQuestionIndex];
    document.getElementById('question-text').textContent = q.q;
    
    // Update Progress
    document.getElementById('question-count').textContent = `${currentQuestionIndex + 1}/10`;
    document.getElementById('progress-bar').style.width = `${((currentQuestionIndex + 1) / 10) * 100}%`;

    // Render Options
    q.options.forEach((opt, index) => {
        const btn = document.createElement('button');
        btn.classList.add('option-btn');
        btn.textContent = opt;
        
        // Dev outline cheat
        if (localStorage.getItem('devMode') === 'true' && index === q.answer) {
            btn.style.outline = '3px solid var(--secondary)';
            btn.style.boxShadow = '0 0 15px var(--secondary)';
        }
        
        btn.addEventListener('click', () => {
            playPopSound();
            selectAnswer(index, btn);
        });
        optionsContainer.appendChild(btn);
    });
}

function selectAnswer(selectedIndex, btnElement) {
    if (answerSelected) return;
    answerSelected = true;

    const q = questions[currentQuestionIndex];
    Array.from(optionsContainer.children).forEach(child => child.disabled = true);

    if (selectedIndex === q.answer) {
        btnElement.classList.add('correct');
        score++;
    } else {
        btnElement.classList.add('wrong');
        if (optionsContainer.children[q.answer]) {
            optionsContainer.children[q.answer].classList.add('correct');
        }
    }

    nextBtn.classList.remove('hidden');
    nextBtn.textContent = currentQuestionIndex === questions.length - 1 ? 'Finish' : 'Continue to Next Question';
}

function startMillionaireGame() {
    // mark flow no longer in title/name startup phase
    millionaireFlowActive = false;
    if (bgMusic && !bgMusic.paused) {
        bgMusic.pause();
        isMusicPlaying = false;
    }

    const appEl = document.getElementById('app');
    if (appEl) appEl.classList.add('millionaire-active');
    millionaireScore = 0;
    millionaireCurrentIndex = 0;
    millionaireAnswerSelected = false;
    millionaireTimeRemaining = 300; // 5 minutes per question
    millionaireLifelines = { callFriend: false, fiftyFifty: false, audienceVote: false, askHost: false };
    clearTimeout(millionaireRevealTimeout);
    stopMillionaireTimer();
    millionaireQuestions = [...millionaireData];
    // stop name-loop audio if playing
    if (millionaireNameAudio) { try { millionaireNameAudio.pause(); millionaireNameAudio.currentTime = 0; } catch(e) {} }
    showScreen('millionaire');
    renderMillionairePrizeList();
    loadMillionaireQuestion();
}

function setMillionaireContestantName() {
    if (millionaireContestantNameDisplay) {
        millionaireContestantNameDisplay.textContent = millionaireContestantName ? millionaireContestantName : 'Unknown';
    }
}

function loadMillionaireQuestion() {
    millionaireAnswerSelected = false;
    millionaireNextBtn.classList.add('hidden');
    millionaireOptions.innerHTML = '';
    clearTimeout(millionaireRevealTimeout);
    stopMillionaireTimer();
    startMillionaireBgMusic();

    const q = millionaireQuestions[millionaireCurrentIndex];
    millionaireQuestionText.textContent = q.q;
    millionaireQuestionCount.textContent = `${millionaireCurrentIndex + 1}`;
    setMillionaireContestantName();
    millionaireTimerDisplay.textContent = formatTime(millionaireTimeRemaining);
    millionaireStatusText.textContent = '3 minutes. Use a lifeline to stop the timer.';
    lifelineCallBtn.disabled = millionaireLifelines.callFriend;
    lifelineFiftyBtn.disabled = millionaireLifelines.fiftyFifty;
    lifelineAudienceBtn.disabled = millionaireLifelines.audienceVote;
    lifelineHostBtn.disabled = millionaireLifelines.askHost;
    lifelineCallBtn.classList.toggle('lifeline-used', millionaireLifelines.callFriend);
    lifelineFiftyBtn.classList.toggle('lifeline-used', millionaireLifelines.fiftyFifty);
    lifelineAudienceBtn.classList.toggle('lifeline-used', millionaireLifelines.audienceVote);
    lifelineHostBtn.classList.toggle('lifeline-used', millionaireLifelines.askHost);
    renderMillionairePrizeList();

    q.options.forEach((opt, index) => {
        const btn = document.createElement('button');
        btn.classList.add('option-btn');
        btn.textContent = opt;
        
        // Dev outline cheat
        if (localStorage.getItem('devMode') === 'true' && index === q.answer) {
            btn.style.outline = '3px solid var(--secondary)';
            btn.style.boxShadow = '0 0 15px var(--secondary)';
        }
        
        btn.addEventListener('click', () => {
            if (millionaireAnswerSelected) return;
            
            // Clear audience vote tints if active
            Array.from(millionaireOptions.children).forEach(b => {
                b.classList.remove('audience-vote-correct', 'audience-vote-high', 'audience-vote-med', 'audience-vote-low');
            });
            millionaireAnswerSelected = true;
            stopMillionaireTimer();
            btn.classList.add('pending');
            millionaireStatusText.textContent = 'Suspense... Revealing answer in 5 seconds';
            
            // Show skip suspense button if dev mode is enabled
            const isDev = localStorage.getItem('devMode') === 'true';
            const skipBtn = document.getElementById('millionaire-skip-suspense-btn');
            if (skipBtn) skipBtn.style.display = isDev ? 'block' : 'none';
            
            // Stop background music and play pending sound
            [millionaireBg1, millionaireBg2, millionaireBg3, millionaireBg4].forEach(track => {
                if (track && !track.paused) { try { track.pause(); } catch(e) {} }
            });
            if (soundEnabled && millionaireAnswerPending) {
                try {
                    millionaireAnswerPending.volume = sfxVolume;
                    millionaireAnswerPending.currentTime = 0;
                    millionaireAnswerPending.play().catch(() => {});
                } catch(e) {}
            }

            activeSuspenseCallback = () => {
                revealMillionaireAnswer(index, btn);
                activeSuspenseCallback = null;
                if (skipBtn) skipBtn.style.display = 'none';
            };
            millionaireRevealTimeout = setTimeout(activeSuspenseCallback, 5000);
        });
        millionaireOptions.appendChild(btn);
    });
    startMillionaireTimer();
}

function renderMillionairePrizeList() {
    millionairePrizeList.innerHTML = '';
    millionairePrizeLevels.forEach((amount, index) => {
        const level = document.createElement('div');
        level.className = 'millionaire-prize-item';
        if (index === millionaireCurrentIndex) level.classList.add('active');
        if (index === 4 || index === 9 || index === 14) {
            level.classList.add('guaranteed');
            if (millionaireCurrentIndex > index) {
                level.classList.add('safe-haven-unlocked');
            }
        }
        level.innerHTML = `<span>Q${index + 1}</span><span>${amount}</span>`;
        millionairePrizeList.appendChild(level);
    });
}



function revealMillionaireAnswer(selectedIndex, btnElement) {
    if (millionaireAnswerPending) { try { millionaireAnswerPending.pause(); millionaireAnswerPending.currentTime = 0; } catch(e) {} }

    const q = millionaireQuestions[millionaireCurrentIndex];
    const isCorrect = selectedIndex === q.answer;
    if (isCorrect) {
        if (soundEnabled && millionaireAnswerCorrect) {
            try {
                millionaireAnswerCorrect.volume = sfxVolume;
                millionaireAnswerCorrect.currentTime = 0;
                millionaireAnswerCorrect.play().catch(() => {});
            } catch(e) {}
        }
        btnElement.classList.remove('pending');
        btnElement.classList.add('correct');
        millionaireScore++;
        millionaireStatusText.textContent = 'Correct! You keep your winnings.';
        millionaireNextBtn.textContent = millionaireCurrentIndex === millionaireQuestions.length - 1 ? 'Finish Game' : 'Next Question';
    } else {
        if (soundEnabled && millionaireAnswerWrong) {
            try {
                millionaireAnswerWrong.volume = sfxVolume;
                millionaireAnswerWrong.currentTime = 0;
                millionaireAnswerWrong.play().catch(() => {});
            } catch(e) {}
        }
        btnElement.classList.remove('pending');
        btnElement.classList.add('wrong');
        millionaireOptions.children[q.answer].classList.add('correct');
        millionaireStatusText.textContent = 'Wrong answer. Game over.';
        millionaireNextBtn.textContent = 'Finish Game';
    }

    Array.from(millionaireOptions.children).forEach(btn => btn.disabled = true);
    millionaireNextBtn.classList.remove('hidden');
}

function startMillionaireTimer() {
    millionaireTimeRemaining = 180;
    updateMillionaireTimer();
    millionaireTimerInterval = setInterval(updateMillionaireTimer, 1000);
}

function updateMillionaireTimer() {
    if (millionaireTimeRemaining <= 0) {
        stopMillionaireTimer();
        millionaireStatusText.textContent = 'Time is up! The answer will be revealed.';
        Array.from(millionaireOptions.children).forEach(btn => btn.disabled = true);
        millionaireRevealTimeout = setTimeout(() => {
            const q = millionaireQuestions[millionaireCurrentIndex];
            millionaireOptions.children[q.answer].classList.add('correct');
            millionaireNextBtn.classList.remove('hidden');
            millionaireNextBtn.textContent = millionaireCurrentIndex === millionaireQuestions.length - 1 ? 'Finish Game' : 'Next Question';
        }, 1000);
        return;
    }
    millionaireTimeRemaining -= 1;
    millionaireTimerDisplay.textContent = formatTime(millionaireTimeRemaining);
}

function stopMillionaireTimer() {
    if (millionaireTimerInterval) {
        clearInterval(millionaireTimerInterval);
        millionaireTimerInterval = null;
    }
    if (millionaireAudienceTimeout) {
        clearTimeout(millionaireAudienceTimeout);
        millionaireAudienceTimeout = null;
    }
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${minutes}:${secs}`;
}

function useMillionaireLifeline(type) {
    if (millionaireLifelines[type]) return;
    millionaireLifelines[type] = true;
    stopMillionaireTimer();
    if (type === 'fiftyFifty') {
        const q = millionaireQuestions[millionaireCurrentIndex];
        const wrongButtons = Array.from(millionaireOptions.children).filter((btn, idx) => idx !== q.answer && !btn.disabled);
        shuffle(wrongButtons).slice(0, 2).forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = '0.35';
        });
        millionaireStatusText.textContent = '50:50 used. Two wrong answers removed.';
    } else if (type === 'callFriend') {
        millionaireStatusText.textContent = 'Call a Friend used. The timer stopped for this question.';
    } else if (type === 'audienceVote') {
        millionaireStatusText.textContent = 'Suspense... Waiting for audience votes (5 seconds)';
        
        // Show skip suspense button if dev mode is enabled
        const isDev = localStorage.getItem('devMode') === 'true';
        const skipBtn = document.getElementById('millionaire-skip-suspense-btn');
        if (skipBtn) skipBtn.style.display = isDev ? 'block' : 'none';

        activeSuspenseCallback = () => {
            const q = millionaireQuestions[millionaireCurrentIndex];
            const correctBtn = millionaireOptions.children[q.answer];
            if (correctBtn && !correctBtn.disabled) correctBtn.classList.add('audience-vote-correct');

            const wrongButtons = Array.from(millionaireOptions.children).filter((btn, idx) => idx !== q.answer && !btn.disabled);
            const classes = shuffle(['audience-vote-high', 'audience-vote-med', 'audience-vote-low']);
            wrongButtons.forEach((btn, i) => {
                btn.classList.add(classes[i % classes.length]);
            });
            millionaireStatusText.textContent = 'The audience has voted!';
            activeSuspenseCallback = null;
            if (skipBtn) skipBtn.style.display = 'none';
        };
        millionaireAudienceTimeout = setTimeout(activeSuspenseCallback, 5000);
    } else if (type === 'askHost') {
        millionaireStatusText.textContent = 'Ask the Host used. The timer is stopped.';
    }
    lifelineCallBtn.disabled = millionaireLifelines.callFriend;
    lifelineFiftyBtn.disabled = millionaireLifelines.fiftyFifty;
    lifelineAudienceBtn.disabled = millionaireLifelines.audienceVote;
    lifelineHostBtn.disabled = millionaireLifelines.askHost;
    lifelineCallBtn.classList.toggle('lifeline-used', millionaireLifelines.callFriend);
    lifelineFiftyBtn.classList.toggle('lifeline-used', millionaireLifelines.fiftyFifty);
    lifelineAudienceBtn.classList.toggle('lifeline-used', millionaireLifelines.audienceVote);
    lifelineHostBtn.classList.toggle('lifeline-used', millionaireLifelines.askHost);
}

nextBtn.addEventListener('click', () => {
    playPopSound();
    currentQuestionIndex++;
    if (currentQuestionIndex < questions.length) {
        loadQuestion();
    } else {
        endGame();
    }
});

millionaireNextBtn.addEventListener('click', () => {
    playPopSound();
    if (millionaireOptions.querySelector('.wrong') || millionaireStatusText.textContent.includes('Game over') || millionaireTimeRemaining <= 0) {
        endMillionaireGame();
        return;
    }

    millionaireCurrentIndex++;
    if (millionaireCurrentIndex < millionaireQuestions.length) {
        millionaireTimeRemaining = 180;
        loadMillionaireQuestion();
    } else {
        endMillionaireGame();
    }
});

lifelineCallBtn.addEventListener('click', () => {
    useMillionaireLifeline('callFriend');
});

lifelineFiftyBtn.addEventListener('click', () => {
    useMillionaireLifeline('fiftyFifty');
});

lifelineAudienceBtn.addEventListener('click', () => {
    useMillionaireLifeline('audienceVote');
});

lifelineHostBtn.addEventListener('click', () => {
    useMillionaireLifeline('askHost');
});

function endGame() {
    document.getElementById('final-score').textContent = score;
    
    const resultTitle = document.getElementById('result-title');
    const resultMessage = document.getElementById('result-message');
    
    document.querySelector('.score-total').textContent = '/10';
    if (score >= 7) {
        resultTitle.textContent = "Category Complete!";
        resultTitle.style.background = "linear-gradient(to right, #00b894, #00cec9)";
        resultTitle.style.webkitBackgroundClip = "text";
        resultMessage.textContent = "Great job! You passed the challenge.";
        
        // Update points and completion
        if (!completedDifficulties[currentCategory][currentDifficulty]) {
            completedDifficulties[currentCategory][currentDifficulty] = true;
            unlockAchievement(currentCategory);
            totalPoints++;
            updatePointsUI();
            saveData();
        }
    } else {
        resultTitle.textContent = "Better luck next time";
        resultTitle.style.background = "linear-gradient(to right, #d63031, #e17055)";
        resultTitle.style.webkitBackgroundClip = "text";
        resultMessage.textContent = "You need 7 correct answers to pass.";
    }

    showScreen('result');
}

function endMillionaireGame() {
    document.getElementById('final-score').textContent = millionaireScore;
    document.querySelector('.score-total').textContent = '/15';

    const resultTitle = document.getElementById('result-title');
    const resultMessage = document.getElementById('result-message');
    resultTitle.textContent = 'Millionaire Mode Complete';
    resultTitle.style.background = 'linear-gradient(to right, #f6d365, #fda085)';
    resultTitle.style.webkitBackgroundClip = 'text';
    resultMessage.textContent = `You answered ${millionaireScore} out of 15 questions correctly.`;
    stopMillionaireTimer();
    clearTimeout(millionaireRevealTimeout);
    stopAllMillionaireAudio();
    const appEl = document.getElementById('app');
    if (appEl) appEl.classList.remove('millionaire-active');
    currentGameMode = 'category';

    const completedMillionaire = millionaireCurrentIndex === millionaireQuestions.length;
    if (completedMillionaire && typeof unlockAchievement === 'function') {
        const wasUnlocked = achievements.millionaire && achievements.millionaire.unlocked;
        unlockAchievement('millionaire');
        if (!wasUnlocked) {
            totalPoints++;
            updatePointsUI();
            saveData();
        }
    }

    showScreen('result');
}

// Function to update dev mode UI styling (dashed borders and cursors on welcome screen)
function updateDevModeUIStyles() {
    const isDev = localStorage.getItem('devMode') === 'true';
    const daysLeftTracker = document.getElementById('days-left-tracker');
    const clickCounterEl = document.getElementById('maya-click-counter');
    
    if (daysLeftTracker) {
        daysLeftTracker.style.cursor = isDev ? 'pointer' : 'default';
        daysLeftTracker.title = isDev ? 'Click to edit target date (Dev)' : '';
        daysLeftTracker.style.pointerEvents = 'auto';
        daysLeftTracker.style.position = 'relative';
        if (isDev) {
            daysLeftTracker.style.border = '1px dashed var(--secondary)';
        } else {
            daysLeftTracker.style.border = '1px solid rgba(255,255,255,0.06)';
        }
    }
    
    if (clickCounterEl) {
        clickCounterEl.style.cursor = isDev ? 'pointer' : 'default';
        clickCounterEl.title = isDev ? 'Click to edit click count (Dev)' : '';
        clickCounterEl.style.pointerEvents = 'auto';
        clickCounterEl.style.position = 'relative';
        if (isDev) {
            clickCounterEl.style.border = '1px dashed var(--secondary)';
        } else {
            clickCounterEl.style.border = '1px solid rgba(255,255,255,0.06)';
        }
    }
    
    // Trigger Minesweeper/Sudoku re-render if active to toggle cheats visibility
    if (typeof minesweeperState !== 'undefined' && minesweeperState.gameActive) {
        try { renderMinesweeperBoard(); } catch(e){}
    }
    if (typeof sudokuState !== 'undefined' && sudokuState.gameActive) {
        try { renderSudokuBoard(); } catch(e){}
    }
}

// Function to render the Dev LocalStorage Editor and update status elements
function renderDevDashboard() {
    const isDev = localStorage.getItem('devMode') === 'true';
    const devStatusEl = document.getElementById('dev-mode-status');
    const devPasswordContainer = document.getElementById('dev-password-container');
    const devDashboardPanel = document.getElementById('dev-dashboard-panel');
    const devLsItems = document.getElementById('dev-ls-items');
    
    if (!devStatusEl) return;
    
    if (isDev) {
        devStatusEl.textContent = 'ENABLED';
        devStatusEl.style.color = 'var(--correct)';
        if (devPasswordContainer) devPasswordContainer.style.display = 'none';
        if (devDashboardPanel) devDashboardPanel.style.display = 'flex';
        
        if (devLsItems) {
            devLsItems.innerHTML = '';
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                const val = localStorage.getItem(key) || '';
                
                const itemDiv = document.createElement('div');
                itemDiv.style.display = 'flex';
                itemDiv.style.alignItems = 'center';
                itemDiv.style.gap = '8px';
                itemDiv.style.background = 'rgba(255,255,255,0.02)';
                itemDiv.style.padding = '6px 10px';
                itemDiv.style.borderRadius = '8px';
                itemDiv.style.border = '1px solid rgba(255,255,255,0.05)';
                itemDiv.style.width = '100%';
                
                itemDiv.innerHTML = `
                    <span style="font-size: 0.85rem; font-weight: bold; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; color: var(--secondary);" title="${key}">${key}</span>
                    <input type="text" value="${val.replace(/"/g, '&quot;')}" style="width: 120px; padding: 4px 6px; border-radius: 6px; border: 1px solid var(--glass-border); background: rgba(0,0,0,0.3); color: white; font-size: 0.8rem;" data-key="${key}" class="dev-ls-val-input">
                    <button style="color: #e74c3c; font-size: 1.1rem; padding: 2px 6px; cursor: pointer; background: transparent; border: none;" class="dev-ls-del-btn" data-key="${key}">🗑️</button>
                `;
                devLsItems.appendChild(itemDiv);
            }
            
            // Add change listener to inputs
            devLsItems.querySelectorAll('.dev-ls-val-input').forEach(input => {
                input.addEventListener('change', (e) => {
                    const key = e.target.dataset.key;
                    const val = e.target.value;
                    localStorage.setItem(key, val);
                    
                    if (key === 'mayaClickCount') {
                        const countEl = document.getElementById('maya-click-count');
                        if (countEl) countEl.textContent = val;
                    }
                    if (key === 'daysLeftTargetDate') {
                        updateDaysLeftTracker();
                    }
                    if (key === 'devMode') {
                        updateDevModeUIStyles();
                        renderDevDashboard();
                    }
                });
            });
            
            // Add click listener to delete buttons
            devLsItems.querySelectorAll('.dev-ls-del-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const key = e.target.dataset.key;
                    localStorage.removeItem(key);
                    renderDevDashboard();
                    
                    if (key === 'mayaClickCount') {
                        const countEl = document.getElementById('maya-click-count');
                        if (countEl) countEl.textContent = '0';
                    }
                    if (key === 'daysLeftTargetDate') {
                        updateDaysLeftTracker();
                    }
                    if (key === 'devMode') {
                        updateDevModeUIStyles();
                    }
                });
            });
        }
    } else {
        devStatusEl.textContent = 'DISABLED';
        devStatusEl.style.color = 'var(--accent)';
        if (devPasswordContainer) devPasswordContainer.style.display = 'flex';
        if (devDashboardPanel) devDashboardPanel.style.display = 'none';
    }
}

// Function to update the countdown to July 10th
function updateDaysLeftTracker() {
    const daysLeftCountEl = document.getElementById('days-left-count');
    if (!daysLeftCountEl) return;

    const today = new Date();
    const currentYear = today.getFullYear();
    
    // Check if custom target date is stored in localStorage
    const savedDateStr = localStorage.getItem('daysLeftTargetDate');
    let targetDate;
    
    if (savedDateStr) {
        targetDate = new Date(savedDateStr);
    } else {
        // July is month 6 (0-indexed)
        targetDate = new Date(currentYear, 6, 10);
        
        // If today is past July 10th of current year, countdown to next year's July 10th
        if (today > targetDate) {
            targetDate = new Date(currentYear + 1, 6, 10);
        }
    }
    
    // Set both to midnight to get precise calendar days remaining
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const targetMidnight = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    
    const diffTime = targetMidnight - todayMidnight;
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    daysLeftCountEl.textContent = String(diffDays);
}

let activeDevStatKey = null;

function openDevStatEditor(key) {
    if (localStorage.getItem('devMode') !== 'true') return;
    const overlay = document.getElementById('dev-stat-edit-overlay');
    const title = document.getElementById('dev-stat-edit-title');
    const label = document.getElementById('dev-stat-edit-label');
    const input = document.getElementById('dev-stat-edit-input');
    if (!overlay || !input || !title || !label) return;

    activeDevStatKey = key;
    if (key === 'daysLeftTargetDate') {
        title.textContent = 'Edit countdown date';
        label.textContent = 'Target date';
        input.type = 'date';
        input.value = localStorage.getItem(key) || '2026-07-10';
    } else {
        title.textContent = 'Edit Maya clicks';
        label.textContent = 'Click count';
        input.type = 'number';
        input.min = '0';
        input.step = '1';
        input.value = localStorage.getItem(key) || '0';
    }
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    input.focus();
}

function closeDevStatEditor() {
    const overlay = document.getElementById('dev-stat-edit-overlay');
    if (!overlay) return;
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
    activeDevStatKey = null;
}

function saveDevStatEditor() {
    if (localStorage.getItem('devMode') !== 'true' || !activeDevStatKey) return;
    const input = document.getElementById('dev-stat-edit-input');
    if (!input) return;
    const value = input.value.trim();
    if (activeDevStatKey === 'daysLeftTargetDate') {
        if (!value) {
            localStorage.removeItem(activeDevStatKey);
        } else {
            const [year, month, day] = value.split('-').map(Number);
            const date = new Date(year, month - 1, day);
            if (!/^\d{4}-\d{2}-\d{2}$/.test(value)
                || date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
                alert('Choose a valid target date.');
                return;
            }
            localStorage.setItem(activeDevStatKey, value);
        }
        updateDaysLeftTracker();
    } else {
        const count = Number(value);
        if (!Number.isSafeInteger(count) || count < 0) {
            alert('Enter a whole number of zero or greater.');
            return;
        }
        localStorage.setItem(activeDevStatKey, String(count));
        const countEl = document.getElementById('maya-click-count');
        if (countEl) countEl.textContent = String(count);
    }
    closeDevStatEditor();
    renderDevDashboard();
    updateDevModeUIStyles();
}

// Initial Setup
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    initializeWorkoutProgram();
    checkQotdStatus();
    updateDaysLeftTracker();
    renderMailBadge();
    renderMailList();

    if (mailBtn) {
        mailBtn.addEventListener('click', () => {
            openMailOverlay();
        });
    }

    if (mailCloseBtn) {
        mailCloseBtn.addEventListener('click', closeMailOverlay);
    }

    if (mailPreviewBackBtn) {
        mailPreviewBackBtn.addEventListener('click', closeMailPreview);
    }

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && mailPreviewOverlay && !mailPreviewOverlay.classList.contains('hidden')) {
            closeMailPreview();
        }
    });

    if (mailComposeBtn) {
        mailComposeBtn.addEventListener('click', () => {
            if (isDeveloperMode()) {
                openMailComposeOverlay();
            } else {
                alert('Only developer mode can add a letter.');
            }
        });
    }

    if (mailComposeCloseBtn) {
        mailComposeCloseBtn.addEventListener('click', closeMailComposeOverlay);
    }

    if (mailSubmitBtn) {
        mailSubmitBtn.addEventListener('click', handleMailSubmit);
    }

    window.addEventListener('mail-state-updated', () => {
        renderMailBadge();
        renderMailList();
    });

    window.addEventListener('storage', (event) => {
        if (event.key === MAIL_STORAGE_KEY) {
            renderMailBadge();
            renderMailList();
        }
    });

    // Show welcome initially
    showScreen('welcome');
    // Initialize maya click counter display
    const initialCount = parseInt(localStorage.getItem('mayaClickCount') || '0', 10) || 0;
    const countEl = document.getElementById('maya-click-count');
    if (countEl) countEl.textContent = String(initialCount);
    // Load saved profile image if present and update UI
    const savedProfile = localStorage.getItem('playerProfileImage');
    const profileScreenImg = document.getElementById('profile-screen-avatar');
    const pBtn = document.getElementById('profile-btn');
    const pBtnMenu = document.getElementById('profile-btn-menu');
    const removeBtn = document.getElementById('remove-photo-btn');
    if (savedProfile) {
        // set screen avatar
        if (profileScreenImg) profileScreenImg.src = savedProfile;
        // set button icons to image
        if (pBtn) pBtn.innerHTML = `<img class="profile-avatar" src="${savedProfile}" alt="Profile">`;
        if (pBtnMenu) pBtnMenu.innerHTML = `<img class="profile-avatar" src="${savedProfile}" alt="Profile">`;
        if (removeBtn) removeBtn.style.display = 'inline-block';
    } else {
        // set default avatar visuals
        const defaultSvg = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect rx="32" width="100%" height="100%" fill="%236c5ce7"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-size="32" fill="white">👤</text></svg>');
        if (profileScreenImg) profileScreenImg.src = defaultSvg;
        if (pBtn) pBtn.innerHTML = '👤';
        if (pBtnMenu) pBtnMenu.innerHTML = '👤';
        if (removeBtn) removeBtn.style.display = 'none';
    }

    // Dev Mode settings page listeners
    let devPasswordFailStreak = 0;
    const devUnlockBtn = document.getElementById('dev-unlock-btn');
    const devPasswordInput = document.getElementById('dev-password-input');
    if (devUnlockBtn && devPasswordInput) {
        devUnlockBtn.addEventListener('click', () => {
            if (devPasswordInput.value === 'raduissexy') {
                devPasswordFailStreak = 0;
                localStorage.setItem('devMode', 'true');
                devPasswordInput.value = '';
                renderDevDashboard();
                updateDevModeUIStyles();
                checkQotdStatus();
                alert("Developer Mode Activated!");
            } else {
                devPasswordInput.value = '';
                devPasswordFailStreak++;
                if (devPasswordFailStreak >= 5) {
                    devPasswordFailStreak = 0;
                    unlockAchievement('hackerAttempt');
                } else {
                    alert(`Incorrect password. (${devPasswordFailStreak}/5)`);
                }
            }
        });
        devPasswordInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                devUnlockBtn.click();
            }
        });
    }

    const devDeactivateBtn = document.getElementById('dev-deactivate-btn');
    if (devDeactivateBtn) {
        devDeactivateBtn.addEventListener('click', () => {
            localStorage.removeItem('devMode');
            renderDevDashboard();
            updateDevModeUIStyles();
            checkQotdStatus();
            alert("Developer Mode Deactivated.");
        });
    }

    const devAddKeyBtn = document.getElementById('dev-add-key-btn');
    if (devAddKeyBtn) {
        devAddKeyBtn.addEventListener('click', () => {
            const key = prompt("Enter new local storage key:");
            if (!key) return;
            const val = prompt(`Enter value for key '${key}':`);
            if (val === null) return;
            localStorage.setItem(key, val);
            renderDevDashboard();
            if (key === 'mayaClickCount') {
                const countEl = document.getElementById('maya-click-count');
                if (countEl) countEl.textContent = val;
                updateDevModeUIStyles();
            }
            if (key === 'daysLeftTargetDate') {
                updateDaysLeftTracker();
                updateDevModeUIStyles();
            }
        });
    }

    const devReloadLsBtn = document.getElementById('dev-reload-ls-btn');
    if (devReloadLsBtn) {
        devReloadLsBtn.addEventListener('click', () => {
            renderDevDashboard();
        });
    }

    const daysLeftTracker = document.getElementById('days-left-tracker');
    if (daysLeftTracker) {
        daysLeftTracker.addEventListener('click', () => openDevStatEditor('daysLeftTargetDate'));
    }

    const clickCounterEl = document.getElementById('maya-click-counter');
    if (clickCounterEl) {
        clickCounterEl.addEventListener('click', (event) => {
            event.stopPropagation();
            openDevStatEditor('mayaClickCount');
        });
    }

    document.getElementById('dev-stat-edit-save').addEventListener('click', saveDevStatEditor);
    document.getElementById('dev-stat-edit-cancel').addEventListener('click', closeDevStatEditor);
    document.getElementById('dev-stat-edit-input').addEventListener('keydown', (event) => {
        if (event.key === 'Enter') saveDevStatEditor();
        if (event.key === 'Escape') closeDevStatEditor();
    });
    document.getElementById('dev-stat-edit-overlay').addEventListener('click', (event) => {
        if (event.target.id === 'dev-stat-edit-overlay') closeDevStatEditor();
    });

    // Millionaire Skip Suspense Button Click Handler
    const skipSuspenseBtn = document.getElementById('millionaire-skip-suspense-btn');
    if (skipSuspenseBtn) {
        skipSuspenseBtn.addEventListener('click', () => {
            if (activeSuspenseCallback) {
                if (millionaireRevealTimeout) {
                    clearTimeout(millionaireRevealTimeout);
                    millionaireRevealTimeout = null;
                }
                if (millionaireAudienceTimeout) {
                    clearTimeout(millionaireAudienceTimeout);
                    millionaireAudienceTimeout = null;
                }
                const cb = activeSuspenseCallback;
                cb();
            }
        });
    }

    // Initialize developer mode elements and styles on load
    renderDevDashboard();
    updateDevModeUIStyles();
});

// Profile image picker
const profileInput = document.getElementById('profile-input');
function openProfilePicker() {
    if (profileInput) profileInput.click();
}
// wire upload button on profile screen to file picker
const uploadPhotoBtn = document.getElementById('upload-photo-btn');
if (uploadPhotoBtn) uploadPhotoBtn.addEventListener('click', openProfilePicker);
if (profileInput) {
    profileInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(ev) {
            const dataUrl = ev.target.result;
            // set avatars
            document.querySelectorAll('.profile-avatar').forEach(img => { try { img.src = dataUrl; } catch(e){} });
            const profileScreenImg = document.getElementById('profile-screen-avatar');
            if (profileScreenImg) profileScreenImg.src = dataUrl;
            // update profile buttons to show uploaded image
            const pBtn = document.getElementById('profile-btn');
            const pBtnMenu = document.getElementById('profile-btn-menu');
            if (pBtn) pBtn.innerHTML = `<img class="profile-avatar" src="${dataUrl}" alt="Profile">`;
            if (pBtnMenu) pBtnMenu.innerHTML = `<img class="profile-avatar" src="${dataUrl}" alt="Profile">`;
            const removeBtn = document.getElementById('remove-photo-btn');
            if (removeBtn) removeBtn.style.display = 'inline-block';
            // persist
            try { localStorage.setItem('playerProfileImage', dataUrl); } catch(e) {}
        };
        reader.readAsDataURL(file);
        // clear input so same file can be picked again
        profileInput.value = '';
    });
}

// Remove photo handler
const removePhotoBtn = document.getElementById('remove-photo-btn');
if (removePhotoBtn) {
    removePhotoBtn.addEventListener('click', () => {
        try { localStorage.removeItem('playerProfileImage'); } catch(e) {}
        const pBtn = document.getElementById('profile-btn');
        const pBtnMenu = document.getElementById('profile-btn-menu');
        const profileScreenImg = document.getElementById('profile-screen-avatar');
        // default svg
        const defaultSvg = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect rx="32" width="100%" height="100%" fill="%236c5ce7"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-size="32" fill="white">👤</text></svg>');
        if (pBtn) pBtn.innerHTML = '👤';
        if (pBtnMenu) pBtnMenu.innerHTML = '👤';
        if (profileScreenImg) profileScreenImg.src = defaultSvg;
        removePhotoBtn.style.display = 'none';
    });
}

// Maya Otter Click Handler
const mayaOtter = document.getElementById('maya-otter');
if (mayaOtter) {
    mayaOtter.addEventListener('click', () => {
        // increment stored counter
        let count = parseInt(localStorage.getItem('mayaClickCount') || '0', 10);
        count = isNaN(count) ? 0 : count + 1;
        localStorage.setItem('mayaClickCount', String(count));

        // unlock achievement at exactly 100 clicks
        if (count === 100) {
            unlockAchievement('mayaOverload');
        }

        // update small counter display on welcome screen
        const countEl = document.getElementById('maya-click-count');
        if (countEl) countEl.textContent = String(count);

        // show playful toast
        const container = document.getElementById('toast-container');
        const popup = document.createElement('div');
        popup.className = 'toast maya-toast';
        popup.innerHTML = `
            <div style="text-align: center; width: 100%;">
                <h4 style="margin: 0; color: var(--secondary); font-size: 1.1rem;">Maya!</h4>
                <p style="margin:6px 0 0 0; color:var(--text-muted);">You've clicked ${count} times</p>
            </div>
        `;
        container.appendChild(popup);
        setTimeout(() => popup.remove(), 2500);
    });
}

// Start music on first interaction (required by browsers)
document.body.addEventListener('click', () => {
    if (!isMusicPlaying && musicEnabled) {
        playMusic();
    }
}, { once: true });
