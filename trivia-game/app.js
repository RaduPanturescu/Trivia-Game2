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
let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let answerSelected = false;
let currentScreen = 'welcome';
let previousScreen = 'welcome';

// DOM Elements
const screens = {
    welcome: document.getElementById('welcome-screen'),
    menu: document.getElementById('menu-screen'),
    settings: document.getElementById('settings-screen'),
    difficulty: document.getElementById('difficulty-screen'),
    game: document.getElementById('game-screen'),
    result: document.getElementById('result-screen'),
    qotd: document.getElementById('qotd-screen'),
    profile: document.getElementById('profile-screen'),
    millionaireTitle: document.getElementById('millionaire-title-screen'),
    millionaireName: document.getElementById('millionaire-name-screen'),
    millionaire: document.getElementById('millionaire-screen'),
    minesweeperSize: document.getElementById('minesweeper-size-screen'),
    minesweeper: document.getElementById('minesweeper-screen'),
    sudokuSize: document.getElementById('sudoku-size-screen'),
    sudoku: document.getElementById('sudoku-screen')
};
let screenTransitionTimeout = null;

const startBtn = document.getElementById('start-btn');
const settingsBtn = document.getElementById('settings-btn');
const backToWelcomeBtn = document.getElementById('back-to-welcome');
const mysteryBtn = document.getElementById('mystery-btn');
const categoryBtns = document.querySelectorAll('.category-btn:not(#mystery-btn)');
const difficultyBtns = document.querySelectorAll('.diff-btn');
const backToMenuBtn = document.getElementById('back-to-menu');
const exitGameBtn = document.getElementById('exit-game-btn');
const nextBtn = document.getElementById('next-btn');
const finishBtn = document.getElementById('finish-btn');
const resetProfileBtn = document.getElementById('reset-profile-btn');
const optionsContainer = document.getElementById('options-container');

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
            const wideScreens = ['minesweeper', 'minesweeperSize', 'sudoku', 'sudokuSize'];
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
    showScreen('menu');
});
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
    showScreen('welcome');
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

minesweeperNewGameBtn.addEventListener('click', () => {
    playPopSound();
    if (document.querySelector('.diff-btn')) {
        const selectedDifficulty = document.querySelector('.diff-btn[data-diff]');
        if (selectedDifficulty) {
            const difficulty = selectedDifficulty.getAttribute('data-diff');
            resetMinesweeper();
            initMinesweeper(difficulty);
        }
    }
});

minesweeperBackBtn.addEventListener('click', () => {
    playPopSound();
    resetMinesweeper();
    // Go back to the minesweeper size selector (previous page)
    showScreen('minesweeperSize');
});

// Add event listeners for minesweeper difficulty selection
document.querySelectorAll('#minesweeper-size-screen .diff-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        playPopSound();
        const difficulty = btn.getAttribute('data-diff');
        initMinesweeper(difficulty);
        showScreen('minesweeper');
    });
});

// Sudoku Mode
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
        resetSudoku();
        initSudoku(difficulty);
    });
}

if (sudokuBackBtn) {
    sudokuBackBtn.addEventListener('click', () => {
        playPopSound();
        resetSudoku();
        // Go back to the sudoku difficulty selector (previous page)
        showScreen('sudokuSize');
    });
}

// Add event listeners for sudoku difficulty selection
document.querySelectorAll('#sudoku-size-screen .diff-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        playPopSound();
        const difficulty = btn.getAttribute('data-diff');
        initSudoku(difficulty);
        showScreen('sudoku');
    });
});

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

function saveData() {
    localStorage.setItem('triviaPoints', totalPoints);
    localStorage.setItem('triviaDifficulties', JSON.stringify(completedDifficulties));
    localStorage.setItem('triviaAchievements', JSON.stringify(achievements));
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
            if (achievements[key]) achievements[key].unlocked = parsedAch[key].unlocked;
        });
    }

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
    saveData();
}

function showToast(ach) {
    playPopSound();
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
        <div class="toast-icon">${ach.icon}</div>
        <div class="toast-content">
            <h4 style="margin: 0; color: var(--secondary); font-size: 1.1rem;">Achievement Unlocked!</h4>
            <p style="margin: 5px 0 0 0; color: white; font-size: 0.9rem;">${ach.name}</p>
        </div>
    `;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4500);
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
    
    if (lastCompleted === today) {
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

qotdWelcomeBtn.addEventListener('click', () => {
    playPopSound();
    const today = new Date().toDateString();
    let qotdIndex = localStorage.getItem('qotdRandomIndex');
    let qotdDate = localStorage.getItem('qotdDate');
    
    if (qotdDate !== today || !qotdIndex) {
        qotdIndex = Math.floor(Math.random() * qotdData.length);
        localStorage.setItem('qotdRandomIndex', qotdIndex);
        localStorage.setItem('qotdDate', today);
    }
    
    const q = qotdData[qotdIndex];
    
    document.getElementById('qotd-category-title').textContent = `Category: ${q.category}`;
    document.getElementById('qotd-text').textContent = q.q;
    
    qotdOptions.innerHTML = '';
    qotdAnswerSelected = false;
    qotdCorrect = false;
    qotdFinishBtn.classList.add('hidden');
    
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
            if (qotdAnswerSelected) return;
            playPopSound();
            qotdAnswerSelected = true;
            if (index === q.answer) {
                btn.classList.add('correct');
                qotdCorrect = true;
            } else {
                btn.classList.add('wrong');
                qotdOptions.children[q.answer].classList.add('correct');
                qotdCorrect = false;
            }
            Array.from(qotdOptions.children).forEach(b => b.disabled = true);
            qotdFinishBtn.textContent = qotdCorrect ? "Correct! Come back tomorrow" : "Close! Come back tomorrow";
            qotdFinishBtn.classList.remove('hidden');
            localStorage.setItem('qotdCompletedDate', new Date().toDateString());
        });
        qotdOptions.appendChild(btn);
    });
    
    showScreen('qotd');
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
        const allQuestions = triviaData[currentCategory][currentDifficulty];
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
        if (isDev) {
            daysLeftTracker.style.border = '1px dashed var(--secondary)';
        } else {
            daysLeftTracker.style.border = '1px solid rgba(255,255,255,0.06)';
        }
    }
    
    if (clickCounterEl) {
        clickCounterEl.style.cursor = isDev ? 'pointer' : 'default';
        clickCounterEl.title = isDev ? 'Click to edit click count (Dev)' : '';
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

// Initial Setup
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    checkQotdStatus();
    updateDaysLeftTracker();
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
            }
            if (key === 'daysLeftTargetDate') {
                updateDaysLeftTracker();
            }
        });
    }

    const devReloadLsBtn = document.getElementById('dev-reload-ls-btn');
    if (devReloadLsBtn) {
        devReloadLsBtn.addEventListener('click', () => {
            renderDevDashboard();
        });
    }

    // Days Left Tracker Click Handler (Prompts for target date in Dev Mode)
    const daysLeftTracker = document.getElementById('days-left-tracker');
    if (daysLeftTracker) {
        daysLeftTracker.addEventListener('click', () => {
            const isDev = localStorage.getItem('devMode') === 'true';
            if (!isDev) return;
            
            const currentTarget = localStorage.getItem('daysLeftTargetDate') || '2026-07-10';
            const newDateStr = prompt("Enter target date for countdown (YYYY-MM-DD):", currentTarget);
            if (newDateStr === null) return; // Cancelled
            
            if (newDateStr === "") {
                localStorage.removeItem('daysLeftTargetDate');
                alert("Target date reset to July 10th.");
            } else {
                const parsed = Date.parse(newDateStr);
                if (isNaN(parsed)) {
                    alert("Invalid date format. Please use YYYY-MM-DD.");
                    return;
                }
                localStorage.setItem('daysLeftTargetDate', newDateStr);
            }
            updateDaysLeftTracker();
            renderDevDashboard();
        });
    }

    // Maya Click Counter Click Handler (Prompts for click count in Dev Mode)
    const clickCounterEl = document.getElementById('maya-click-counter');
    if (clickCounterEl) {
        clickCounterEl.addEventListener('click', (e) => {
            const isDev = localStorage.getItem('devMode') === 'true';
            if (!isDev) return;
            
            e.stopPropagation();
            
            const currentCount = localStorage.getItem('mayaClickCount') || '0';
            const newCountStr = prompt("Enter new click count for Maya:", currentCount);
            if (newCountStr === null) return;
            
            const newCount = parseInt(newCountStr, 10);
            if (isNaN(newCount) || newCount < 0) {
                alert("Please enter a valid non-negative integer.");
                return;
            }
            
            localStorage.setItem('mayaClickCount', String(newCount));
            const countEl = document.getElementById('maya-click-count');
            if (countEl) countEl.textContent = String(newCount);
            renderDevDashboard();
        });
    }

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
        popup.className = 'toast';
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
