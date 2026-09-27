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
    workout: document.getElementById('workout-screen'),
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
const resetAllProgressBtn = document.getElementById('reset-all-progress-btn');
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

const workoutWelcomeBtn = document.getElementById('workout-welcome-btn');
const workoutMenuBtn = document.getElementById('workout-program-btn');
const backToMenuFromWorkout = document.getElementById('back-to-menu-from-workout');

if (workoutWelcomeBtn) {
    workoutWelcomeBtn.addEventListener('click', () => {
        playPopSound();
        showScreen('workout');
        renderWorkoutPlanner();
    });
}

if (workoutMenuBtn) {
    workoutMenuBtn.addEventListener('click', () => {
        playPopSound();
        showScreen('workout');
        renderWorkoutPlanner();
    });
}

if (backToMenuFromWorkout) {
    backToMenuFromWorkout.addEventListener('click', () => {
        playPopSound();
        showScreen('welcome');
    });
}

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
        localStorage.clear();
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
    if (!(typeof workoutAchievementTemplates !== 'undefined' && workoutAchievementTemplates[id])) {
        showToast(achievements[id]);
    }
    renderAchievements();
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
    stopwatchRemaining: 300,
    stopwatchTotal: 300,
    weeks: []
};

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
    const templates = getWorkoutWeeklyTemplates();
    templates[dayIndex] = {
        type: day.type,
        exercises: (day.exercises || []).map(({ id, completed, currentSet, ...exercise }) => ({ ...exercise }))
    };
    localStorage.setItem(WORKOUT_WEEKLY_TEMPLATE_KEY, JSON.stringify(templates));

    const currentWeekStart = isoDate(parseWorkoutDate(workoutState.currentWeekStart));
    workoutState.weeks.forEach(week => {
        if (week.weekStart <= currentWeekStart) return;
        const futureDay = week.days[dayIndex];
        if (!futureDay) return;
        futureDay.type = day.type;
        futureDay.exercises = day.type === 'workout' ? cloneWorkoutExercises(day.exercises, futureDay.date) : [];
        futureDay.completed = false;
        delete futureDay.savedExercisesForWorkout;
    });
    saveWorkoutData();
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

function saveWorkoutCategories(categories) {
    localStorage.setItem('triviaWorkoutCategories', JSON.stringify(categories));
}

function hydrateWorkoutCategoriesSelect() {
    const categorySelect = document.getElementById('workout-exercise-category');
    if (!categorySelect) return;
    const categories = getWorkoutCategories();
    const selected = categorySelect.value;
    categorySelect.innerHTML = '<option value="">Select a category</option>' + categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
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
        type: type || 'rest',
        exercises: exercises || [],
        completed: false
    };
}

function createDefaultWorkoutWeek(weekStart) {
    const days = [];
    const defaults = [
        { type: 'workout', exercises: [
            { ...workoutExerciseCatalog[0], id: `${workoutExerciseCatalog[0].id}-${Date.now()}-1`, completed: false },
            { ...workoutExerciseCatalog[7], id: `${workoutExerciseCatalog[7].id}-${Date.now()}-2`, completed: false }
        ] },
        { type: 'workout', exercises: [
            { ...workoutExerciseCatalog[6], id: `${workoutExerciseCatalog[6].id}-${Date.now()}-3`, completed: false },
            { ...workoutExerciseCatalog[9], id: `${workoutExerciseCatalog[9].id}-${Date.now()}-4`, completed: false }
        ] },
        { type: 'rest', exercises: [] },
        { type: 'workout', exercises: [
            { ...workoutExerciseCatalog[2], id: `${workoutExerciseCatalog[2].id}-${Date.now()}-5`, completed: false },
            { ...workoutExerciseCatalog[3], id: `${workoutExerciseCatalog[3].id}-${Date.now()}-6`, completed: false }
        ] },
        { type: 'workout', exercises: [
            { ...workoutExerciseCatalog[8], id: `${workoutExerciseCatalog[8].id}-${Date.now()}-7`, completed: false },
            { ...workoutExerciseCatalog[12], id: `${workoutExerciseCatalog[12].id}-${Date.now()}-8`, completed: false }
        ] },
        { type: 'workout', exercises: [
            { ...workoutExerciseCatalog[10], id: `${workoutExerciseCatalog[10].id}-${Date.now()}-9`, completed: false },
            { ...workoutExerciseCatalog[11], id: `${workoutExerciseCatalog[11].id}-${Date.now()}-10`, completed: false }
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
    if (!confirm('Start a new workout program? This will remove all workouts from the active plan.')) return;
    if (!confirm('Are you sure? Every day in the active plan will become a rest day. Your saved plans, achievements, and stats will remain.')) return;

    snapshotWorkoutMetricBaseline();
    stopWorkoutTimer();
    workoutState.activeDayDate = null;
    workoutState.activeExerciseIndex = null;
    workoutState.timerMode = 'idle';
    workoutState.timerRemaining = 0;
    const currentStart = isoDate(getMonday(new Date()));
    if (!workoutState.weeks.length) workoutState.weeks = [createDefaultWorkoutWeek(parseWorkoutDate(currentStart))];
    workoutState.weeks.forEach(week => {
        week.days = (week.days || []).map(day => ({
            date: day.date,
            dayLabel: day.dayLabel,
            type: 'rest',
            exercises: [],
            completed: false
        }));
        while (week.days.length < 7) {
            const date = parseWorkoutDate(week.weekStart);
            date.setDate(date.getDate() + week.days.length);
            week.days.push(createWorkoutDay(date, 'rest', []));
        }
    });
    if (!workoutState.weeks.some(week => week.weekStart === currentStart)) {
        workoutState.weeks.unshift(createDefaultWorkoutWeek(parseWorkoutDate(currentStart)));
        const newest = workoutState.weeks.find(week => week.weekStart === currentStart);
        newest.days.forEach(day => {
            day.type = 'rest';
            day.exercises = [];
            day.completed = false;
        });
    }
    const restTemplates = Object.fromEntries(Array.from({ length: 7 }, (_, index) => [index, { type: 'rest', exercises: [] }]));
    localStorage.setItem(WORKOUT_WEEKLY_TEMPLATE_KEY, JSON.stringify(restTemplates));
    workoutState.currentWeekStart = currentStart;
    workoutState.selectedDayIndex = (new Date().getDay() + 6) % 7;
    saveWorkoutData();
    renderWorkoutPlanner();
    showToast({ icon: '🆕', name: 'New program ready', desc: 'All days are now set as rest days. Your stats are preserved.' });
}

function getWorkoutWeekForCurrentView() {
    const weekStart = isoDate(parseWorkoutDate(workoutState.currentWeekStart));
    let week = workoutState.weeks.find(item => item.weekStart === weekStart);
    if (!week) {
        const date = parseWorkoutDate(workoutState.currentWeekStart);
        week = createDefaultWorkoutWeek(date);
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
    } else {
        day.type = 'workout';
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
    const filters = ['all', ...Array.from(new Set([...workoutExerciseCatalog.map(ex => ex.category), ...custom.map(ex => ex.category), ...getWorkoutCategories()]))];
    const container = document.getElementById('workout-category-filters');
    if (!container) return;

    container.innerHTML = '';
    filters.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = `filter-chip ${cat === workoutState.activeFilter ? 'active' : ''}`;
        btn.textContent = cat === 'all' ? 'All' : cat;
        btn.addEventListener('click', () => {
            workoutState.activeFilter = cat;
            renderWorkoutExerciseList();
            renderWorkoutPlanner();
        });
        container.appendChild(btn);
    });
}

function renderWorkoutExerciseList() {
    const list = document.getElementById('workout-exercise-list');
    if (!list) return;

    const custom = JSON.parse(localStorage.getItem('triviaWorkoutCustomExercises') || '[]');
    const allExercises = [...workoutExerciseCatalog, ...custom];
    const filtered = workoutState.activeFilter === 'all'
        ? allExercises
        : allExercises.filter(ex => ex.category === workoutState.activeFilter);

    list.innerHTML = '';
    filtered.forEach(ex => {
        const currentSet = Number(ex.currentSet || 1);
        const item = document.createElement('div');
        item.className = 'workout-exercise-item';
        item.innerHTML = `
            <div>
                <strong>${ex.name}</strong>
                <div class="exercise-item-meta">${ex.category} • ${ex.sets} sets • ${ex.reps} reps • ${ex.weight}kg ${ex.completed ? '• Finished' : `• Set ${Math.min(currentSet, Number(ex.sets || 1))}/${Number(ex.sets || 1)}`}</div>
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
    });
}

function removeCustomExercise(exerciseId) {
    const custom = JSON.parse(localStorage.getItem('triviaWorkoutCustomExercises') || '[]');
    localStorage.setItem('triviaWorkoutCustomExercises', JSON.stringify(custom.filter(exercise => exercise.id !== exerciseId)));
    workoutState.weeks.forEach(week => week.days.forEach(day => {
        day.exercises = (day.exercises || []).filter(exercise => exercise.id !== exerciseId);
        day.completed = day.exercises.length > 0 && day.exercises.every(exercise => exercise.completed);
    }));
    renderWorkoutPlanner();
    saveWorkoutData();
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

    workoutState.editingExerciseId = exercise.id;
    workoutState.editingDayExercise = isDayExercise;
    workoutState.editingExerciseMode = isDayExercise ? 'day' : 'library';
    name.value = exercise.name;
    description.value = exercise.description || '';
    category.value = exercise.category || 'chest';
    sets.value = exercise.sets || 3;
    reps.value = exercise.reps || 10;
    weight.value = exercise.weight || 0;
    duration.value = exercise.duration || 45;
    rest.value = exercise.rest || 60;
    const saveButton = document.getElementById('workout-save-exercise-btn');
    if (saveButton) saveButton.textContent = 'Save Exercise Changes';
    openExerciseEditor(isDayExercise ? 'Edit Today’s Exercise' : 'Edit Exercise in List', isDayExercise
        ? 'These changes apply to the selected day only.'
        : 'Update this reusable exercise without changing any scheduled day.');
}

function openExerciseEditor(title = 'Create a New Exercise', description = 'Create an exercise for your reusable exercise list.') {
    const modal = document.getElementById('workout-exercise-modal');
    const editor = document.getElementById('workout-exercise-editor');
    if (!modal || !editor) return;
    document.getElementById('workout-exercise-modal-title').textContent = title;
    document.getElementById('workout-exercise-modal-description').textContent = description;
    editor.hidden = false;
    editor.classList.add('exercise-editor-in-modal');
    modal.hidden = false;
}

function closeExerciseEditor() {
    const modal = document.getElementById('workout-exercise-modal');
    const editor = document.getElementById('workout-exercise-editor');
    if (modal) modal.hidden = true;
    if (editor) editor.hidden = true;
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
    if (duration) duration.value = '';
    if (rest) rest.value = '';
    workoutState.editingExerciseId = null;
    workoutState.editingDayExercise = false;
    workoutState.editingExerciseMode = 'new';
}

function saveExerciseFromEditor() {
    const nameValue = document.getElementById('workout-exercise-name').value.trim();
    const categoryValue = document.getElementById('workout-exercise-category').value;
    const requiredFields = [
        document.getElementById('workout-exercise-name'),
        document.getElementById('workout-exercise-sets'),
        document.getElementById('workout-exercise-reps'),
        document.getElementById('workout-exercise-duration'),
        document.getElementById('workout-exercise-rest')
    ];
    if (!categoryValue || requiredFields.some(field => !field.value.trim() || !field.checkValidity())) {
        showToast({ icon: '⚠️', name: 'Exercise details required', desc: 'Name, category, sets, reps, timer, and rest are required.' });
        return;
    }

    const descriptionValue = document.getElementById('workout-exercise-description').value.trim() || 'Custom exercise added to your weekly plan.';
    const template = {
        name: nameValue,
        category: categoryValue,
        sets: Number(document.getElementById('workout-exercise-sets').value),
        reps: Number(document.getElementById('workout-exercise-reps').value),
        weight: Number(document.getElementById('workout-exercise-weight').value || 0),
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
        targetDay.completed = targetDay.exercises.length > 0 && targetDay.exercises.every(ex => ex.completed);
        saveWorkoutData();
        closeExerciseEditor();
        renderWorkoutPlanner();
        showToast({ icon: '✅', name: 'Today’s exercise updated', desc: `${nameValue} was changed for this day only.` });
        return;
    }

    const customExercises = JSON.parse(localStorage.getItem('triviaWorkoutCustomExercises') || '[]');
    const editingLibraryExercise = workoutState.editingExerciseMode === 'library';
    if (editingLibraryExercise) {
        const customIndex = customExercises.findIndex(ex => ex.id === workoutState.editingExerciseId);
        const original = workoutExerciseCatalog.find(ex => ex.id === workoutState.editingExerciseId);
        if (customIndex >= 0) {
            customExercises[customIndex] = { ...customExercises[customIndex], ...template };
        } else {
            customExercises.push({ ...original, ...template, id: `custom-${Date.now()}` });
        }
    } else {
        customExercises.push({ ...template, id: `custom-${Date.now()}` });
    }
    localStorage.setItem('triviaWorkoutCustomExercises', JSON.stringify(customExercises));
    const savedName = nameValue;
    closeExerciseEditor();
    renderWorkoutPlanner();
    showToast({ icon: '✅', name: editingLibraryExercise ? 'Exercise updated' : 'Exercise added', desc: `${savedName} is in your exercise list.` });
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

    day.completed = false;
    saveWorkoutDayTemplate(day, workoutState.selectedDayIndex);
    renderWorkoutPlanner();
    saveWorkoutData();
    showToast({ icon: '💪', name: 'Exercise added', desc: `${exercise.name} was added to ${day.dayLabel}.` });
}

function removeExerciseFromSelectedDay(exerciseId) {
    const day = getCurrentWorkoutDay();
    if (!day) return;
    day.exercises = day.exercises.filter(ex => ex.id !== exerciseId);
    day.completed = day.exercises.length > 0 && day.exercises.every(ex => ex.completed);
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
        const missed = day.type === 'workout' && day.date < today && !day.completed;
        const btn = document.createElement('button');
        btn.className = `workout-day-pill ${index === workoutState.selectedDayIndex ? 'active' : ''} ${day.completed ? 'completed' : ''} ${day.type === 'rest' ? 'rest-day' : ''} ${missed ? 'missed-day' : ''}`;
        btn.type = 'button';
        btn.innerHTML = `
            <span class="day-letter">${day.dayLabel}</span>
            <span class="day-number">${parseWorkoutDate(day.date).getDate()}</span>
            <span class="day-status">${day.type === 'rest' ? 'Rest' : missed ? '✕' : day.exercises.filter(ex => ex.completed).length + '/' + day.exercises.length || '0/0'}</span>
        `;
        btn.addEventListener('click', () => setSelectedWorkoutDay(index));
        container.appendChild(btn);
    });
}

function renderWorkoutMetrics() {
    const baseline = getWorkoutMetricBaseline();
    const totalWorkouts = baseline.workouts + workoutState.weeks.reduce((total, week) => total + week.days.filter(day => day.type === 'workout').length, 0);
    const totalSets = baseline.sets + workoutState.weeks.reduce((total, week) => total + week.days.reduce((sum, day) => sum + (day.exercises || []).reduce((s, ex) => s + Number(ex.sets || 0), 0), 0), 0);
    const totalReps = baseline.reps + workoutState.weeks.reduce((total, week) => total + week.days.reduce((sum, day) => sum + (day.exercises || []).reduce((s, ex) => s + Number(ex.reps || 0) * Number(ex.sets || 0), 0), 0), 0);
    const streak = calculateWorkoutStreak();

    document.getElementById('workout-streak-count').textContent = String(streak);
    document.getElementById('workout-total-days').textContent = String(totalWorkouts);
    document.getElementById('workout-total-sets').textContent = String(totalSets);
    document.getElementById('workout-total-reps').textContent = String(totalReps);
}

function getWorkoutMetricBaseline() {
    try {
        const baseline = JSON.parse(localStorage.getItem('triviaWorkoutMetricBaseline') || '{}');
        return {
            workouts: Number(baseline.workouts || 0),
            sets: Number(baseline.sets || 0),
            reps: Number(baseline.reps || 0),
            streak: Number(baseline.streak || 0),
            throughDate: baseline.throughDate || '0000-00-00'
        };
    } catch (error) {
        return { workouts: 0, sets: 0, reps: 0, streak: 0, throughDate: '0000-00-00' };
    }
}

function snapshotWorkoutMetricBaseline() {
    const previous = getWorkoutMetricBaseline();
    const workouts = workoutState.weeks.reduce((total, week) => total + week.days.filter(day => day.type === 'workout').length, 0);
    const sets = workoutState.weeks.reduce((total, week) => total + week.days.reduce((sum, day) => sum + (day.exercises || []).reduce((subtotal, exercise) => subtotal + Number(exercise.sets || 0), 0), 0), 0);
    const reps = workoutState.weeks.reduce((total, week) => total + week.days.reduce((sum, day) => sum + (day.exercises || []).reduce((subtotal, exercise) => subtotal + Number(exercise.reps || 0) * Number(exercise.sets || 0), 0), 0), 0);
    const baseline = {
        workouts: previous.workouts + workouts,
        sets: previous.sets + sets,
        reps: previous.reps + reps,
        streak: calculateWorkoutStreak(),
        throughDate: isoDate(new Date())
    };
    localStorage.setItem('triviaWorkoutMetricBaseline', JSON.stringify(baseline));
}

function calculateWorkoutStreak() {
    const today = isoDate(new Date());
    const baseline = getWorkoutMetricBaseline();
    const baselineThroughDate = baseline.throughDate || '0000-00-00';
    const knownDates = new Set(workoutState.weeks.flatMap(week => (week.days || []).map(day => day.date)));
    const scheduledDays = Array.from(knownDates)
        .filter(date => date > baselineThroughDate && date <= today)
        .map(getWorkoutDayForDate)
        .filter(day => day && day.type === 'workout')
        .sort((a, b) => a.date.localeCompare(b.date));

    let streak = baseline.streak;
    for (const day of scheduledDays) {
        if (day.completed) {
            streak += 1;
        } else if (day.date < today) {
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

    const isToday = day.date === isoDate(new Date());
    title.textContent = isToday ? "Today's Exercises" : `Exercises for ${day.dayLabel}`;
    const restToggle = document.getElementById('workout-toggle-rest-btn');
    if (restToggle) {
        restToggle.textContent = day.type === 'rest' ? 'Set as Workout Day' : 'Mark as Rest Day';
        restToggle.onclick = () => setSelectedWorkoutDayType(day.type === 'rest' ? 'workout' : 'rest');
    }

    if (day.type === 'rest') {
        wrapper.innerHTML = `
            <div class="rest-box">
                <h4>Rest day, take it chill.</h4>
                <p>Recovery matters. Keep hydration high and let your muscles rebuild.</p>
            </div>
        `;
        return;
    }

    const completedExercises = day.exercises.filter(ex => ex.completed).length;
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
        box.innerHTML = `
            <div class="exercise-box-header">
                <h4>${exercise.name}</h4>
                <span class="timer-pill">${exercise.duration || 45}s</span>
            </div>
            <div class="meta-line">
                <span>${exercise.category}</span>
                <span>${exercise.sets} sets</span>
                <span>${exercise.reps} reps</span>
                <span>${exercise.weight || 0}kg</span>
                <span>${exercise.rest || 60}s rest</span>
            </div>
            <p style="font-size:0.78rem; color: var(--text-muted); margin:0;">${exercise.description || 'Custom exercise'}</p>
            <div class="exercise-start-control">
                <button class="start-btn" data-start-index="${index}" ${isActive || isCompleted ? 'disabled' : ''}>${isResting ? `Rest ${formatCountdownTime(workoutState.timerRemaining)}` : isActive ? `Timer ${workoutState.timerRemaining}s` : isCompleted ? 'Completed ✓' : isSetProgress ? `Start Set ${nextSetNumber}/${totalSets}` : 'Start Exercise'}</button>
            </div>
            <div class="exercise-actions">
                <button class="secondary-btn edit-exercise-btn" data-edit-day-index="${index}" type="button">Edit</button>
                <button class="secondary-btn remove-exercise-btn" data-remove-id="${exercise.id}">Remove</button>
            </div>
        `;
        box.querySelector('[data-start-index]')?.addEventListener('click', () => startWorkoutExercise(day, index));
        box.querySelector('[data-edit-day-index]')?.addEventListener('click', () => populateExerciseEditor(exercise, true));
        box.querySelector('[data-remove-id]').addEventListener('click', () => {
            removeExerciseFromSelectedDay(exercise.id);
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

    if (completedExercises === day.exercises.length && day.exercises.length > 0) {
        completeWorkoutDay(day);
    }
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
    stopWorkoutTimer();
    workoutState.timerInterval = setInterval(() => {
        if (workoutState.timerRemaining <= 1) {
            stopWorkoutTimer();
            if (setIndex >= totalSets) {
                exercise.completed = true;
                exercise.currentSet = totalSets;
                workoutState.timerMode = 'idle';
                workoutState.activeExerciseIndex = null;
                workoutState.timerRemaining = 0;
                showTaskCompleteToast('Exercise complete');
                renderWorkoutPlanner();
                saveWorkoutData();
                completeWorkoutDay(day);
                updateWorkoutAchievements();
                return;
            }

            exercise.currentSet = setIndex + 1;
            workoutState.timerMode = 'rest';
            workoutState.timerRemaining = Math.max(1, Number(exercise.rest || 60));
            showTaskCompleteToast(`Set ${setIndex}/${totalSets} complete`);
            renderWorkoutPlanner();
            saveWorkoutData();
            workoutState.timerInterval = setInterval(() => {
                if (workoutState.timerRemaining <= 1) {
                    stopWorkoutTimer();
                    workoutState.timerMode = 'idle';
                    workoutState.activeExerciseIndex = null;
                    workoutState.timerRemaining = 0;
                    renderWorkoutPlanner();
                    saveWorkoutData();
                    return;
                }
                workoutState.timerRemaining -= 1;
                renderWorkoutPlanner();
            }, 1000);
            return;
        }
        workoutState.timerRemaining -= 1;
        renderWorkoutPlanner();
    }, 1000);
    renderWorkoutPlanner();
}

function completeWorkoutDay(day) {
    if (!day || day.type !== 'workout') return;
    const hasExercises = day.exercises.length > 0;
    if (!hasExercises) return;

    const wasCompleted = day.completed;
    day.completed = day.exercises.every(ex => ex.completed);
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

function formatStopwatchTime(totalSeconds) {
    const seconds = Math.max(0, Math.floor(totalSeconds));
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainder = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
}

function renderStopwatch() {
    const display = document.getElementById('workout-stopwatch-display');
    const startButton = document.getElementById('workout-timer-start-btn');
    const face = document.getElementById('workout-stopwatch-face');
    const durationControl = document.getElementById('workout-timer-duration-control');
    const isCountdown = workoutState.stopwatchMode === 'countdown';
    if (!display || !startButton || !face) return;
    const shownSeconds = isCountdown ? workoutState.stopwatchRemaining : workoutState.stopwatchElapsed;
    const formattedTime = formatStopwatchTime(shownSeconds);
    display.textContent = formattedTime;
    const innerWidth = Math.max(80, face.clientWidth - 28);
    const preferredFontSize = Math.min(56, Math.max(22, window.innerWidth * (isCountdown ? 0.07 : 0.08)));
    const fittedFontSize = Math.min(preferredFontSize, innerWidth / (formattedTime.length * 0.62));
    display.style.fontSize = `${Math.max(17, fittedFontSize)}px`;
    startButton.textContent = workoutState.stopwatchRunning ? 'Pause' : (shownSeconds > 0 && (isCountdown ? shownSeconds < workoutState.stopwatchTotal : shownSeconds > 0) ? 'Resume' : 'Start');
    document.getElementById('workout-mode-stopwatch-btn')?.classList.toggle('active', !isCountdown);
    document.getElementById('workout-mode-countdown-btn')?.classList.toggle('active', isCountdown);
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
    workoutState.stopwatchInterval = setInterval(() => {
        if (workoutState.stopwatchMode === 'countdown') {
            workoutState.stopwatchRemaining = Math.max(0, workoutState.stopwatchRemaining - 1);
            if (workoutState.stopwatchRemaining === 0) {
                stopStopwatch();
                showToast({ icon: '⏰', name: 'Timer complete', desc: 'Your countdown has finished.' });
                return;
            }
        } else {
            workoutState.stopwatchElapsed += 1;
        }
        renderStopwatch();
    }, 1000);
    renderStopwatch();
}

function stopStopwatch() {
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
    workoutState.stopwatchTotal = Math.max(1, Math.floor(durationMinutes * 60 + durationSeconds));
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
    workoutState.stopwatchTotal = Math.max(1, Math.floor(durationMinutes * 60 + durationSeconds));
    workoutState.stopwatchRemaining = workoutState.stopwatchTotal;
    renderStopwatch();
}

function updateWorkoutAchievements() {
    const totalCompletedExercises = workoutState.weeks.reduce((total, week) => total + week.days.reduce((sum, day) => sum + ((day.exercises || []).filter(ex => ex.completed).length), 0), 0);
    const totalWorkoutDays = workoutState.weeks.reduce((total, week) => total + week.days.filter(day => day.type === 'workout' && day.completed).length, 0);

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

    const viewedWeekDate = parseWorkoutDate(workoutState.currentWeekStart);
    const firstDayOfMonth = new Date(viewedWeekDate.getFullYear(), viewedWeekDate.getMonth(), 1);
    const numDays = new Date(firstDayOfMonth.getFullYear(), firstDayOfMonth.getMonth() + 1, 0).getDate();
    const startOffset = firstDayOfMonth.getDay() === 0 ? 6 : firstDayOfMonth.getDay() - 1;

    calendar.innerHTML = '';

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
        const matchingDay = getWorkoutDayForDate(iso);
        const isPast = iso < isoDate(new Date());
        const isRest = matchingDay?.type === 'rest';
        const isWorkout = matchingDay?.type === 'workout';
        const isMissed = isWorkout && isPast && !matchingDay.completed;
        const isDone = isWorkout && matchingDay.completed;
        const statusEmoji = isMissed ? '✕' : isRest ? '💤' : isDone ? '✓' : isWorkout ? '💪' : '•';
        cell.className = `calendar-cell ${isDone ? 'done' : ''} ${isWorkout ? 'workout-day' : ''} ${isRest ? 'rest-day' : ''} ${isMissed ? 'missed' : ''} ${matchingDay && matchingDay.date === getCurrentWorkoutDay().date ? 'active' : ''}`;
        cell.innerHTML = `<span class="calendar-date">${day}</span><span class="calendar-emoji">${statusEmoji}</span>`;
        cell.addEventListener('click', () => {
            const thisWeek = getMonday(date);
            workoutState.currentWeekStart = isoDate(thisWeek);
            const week = getWorkoutWeekForCurrentView();
            const index = week.days.findIndex(dayInfo => dayInfo.date === iso);
            workoutState.selectedDayIndex = index >= 0 ? index : 0;
            renderWorkoutPlanner();
        });
        calendar.appendChild(cell);
    }
}

function renderWorkoutAchievements() {
    const list = document.getElementById('workout-achievements-list');
    if (!list) return;

    const keys = Object.keys(workoutAchievementTemplates);
    list.innerHTML = keys.map(key => {
        const achievement = achievements[key] || workoutAchievementTemplates[key];
        const unlocked = !!achievement.unlocked;
        return `
            <div class="workout-achievement-card ${unlocked ? 'unlocked' : ''}">
                <h4>${unlocked ? achievement.name : 'Locked'}</h4>
                <p>${unlocked ? achievement.desc : 'Complete the milestone to unlock this achievement.'}</p>
                <div>${achievement.icon}</div>
            </div>
        `;
    }).join('');
}

function renderWorkoutPlanner() {
    const week = getWorkoutWeekForCurrentView();
    const label = document.getElementById('workout-week-label');
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
}

function syncWorkoutWeekNavigation(direction) {
    const current = parseWorkoutDate(workoutState.currentWeekStart);
    current.setDate(current.getDate() + (direction * 7));
    workoutState.currentWeekStart = isoDate(current);
    workoutState.selectedDayIndex = 0;
    renderWorkoutPlanner();
}

function initializeWorkoutProgram() {
    ensureWorkoutState();
    ensureWorkoutWeeklyTemplates();
    const editor = document.getElementById('workout-exercise-editor');
    const editorModalContent = document.getElementById('workout-exercise-modal-content');
    if (editor && editorModalContent && editor.parentElement !== editorModalContent) {
        editorModalContent.appendChild(editor);
        editor.classList.add('exercise-editor-in-modal');
    }
    Object.keys(workoutAchievementTemplates).forEach(key => {
        if (!achievements[key]) {
            achievements[key] = { ...workoutAchievementTemplates[key] };
        }
    });
    addCategoryFilterButtons();
    renderWorkoutPlanner();

    document.getElementById('workout-prev-week-btn')?.addEventListener('click', () => {
        syncWorkoutWeekNavigation(-1);
    });

    document.getElementById('workout-next-week-btn')?.addEventListener('click', () => {
        syncWorkoutWeekNavigation(1);
    });

    document.getElementById('workout-new-program-btn')?.addEventListener('click', resetActiveWorkoutProgram);
    document.getElementById('workout-save-plan-btn')?.addEventListener('click', saveNamedWorkoutPlan);
    document.getElementById('workout-switch-plan-btn')?.addEventListener('click', switchToSavedWorkoutPlan);
    document.getElementById('workout-saved-plans-select')?.addEventListener('change', () => {
        document.getElementById('workout-switch-plan-btn').disabled = !document.getElementById('workout-saved-plans-select').value;
    });
    renderSavedWorkoutPlans();

    document.getElementById('workout-timer-open-btn')?.addEventListener('click', () => {
        document.getElementById('workout-timer-overlay').hidden = false;
        renderStopwatch();
    });
    document.getElementById('workout-timer-close-btn')?.addEventListener('click', () => {
        document.getElementById('workout-timer-overlay').hidden = true;
    });
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            const overlay = document.getElementById('workout-timer-overlay');
            if (overlay && !overlay.hidden) overlay.hidden = true;
        }
    });
    document.getElementById('workout-timer-overlay')?.addEventListener('click', event => {
        if (event.target.id === 'workout-timer-overlay') event.currentTarget.hidden = true;
    });
    document.getElementById('workout-timer-start-btn')?.addEventListener('click', startStopwatch);
    document.getElementById('workout-timer-reset-btn')?.addEventListener('click', resetStopwatch);
    document.getElementById('workout-mode-stopwatch-btn')?.addEventListener('click', () => setWorkoutTimerMode('stopwatch'));
    document.getElementById('workout-mode-countdown-btn')?.addEventListener('click', () => setWorkoutTimerMode('countdown'));
    document.getElementById('workout-timer-duration-input')?.addEventListener('change', () => {
        if (!workoutState.stopwatchRunning && workoutState.stopwatchMode === 'countdown') resetStopwatch();
    });
    document.getElementById('workout-timer-duration-seconds')?.addEventListener('change', () => {
        if (!workoutState.stopwatchRunning && workoutState.stopwatchMode === 'countdown') resetStopwatch();
    });
    document.getElementById('workout-reset-all-stats-btn')?.addEventListener('click', () => {
        document.getElementById('reset-all-progress-btn')?.click();
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

const workoutProgramToggle = document.getElementById('workout-program-btn');
if (workoutProgramToggle) {
    workoutProgramToggle.addEventListener('click', () => {
        showScreen('workout');
        renderWorkoutPlanner();
    });
}

function createQrCodeImageFromText() {
    const text = prompt('Enter text for the QR code:', 'Workout Plan');
    if (text === null || text.trim() === '') return;

    const safeText = encodeURIComponent(text.trim());
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${safeText}`;

    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.inset = '0';
    container.style.background = 'rgba(0,0,0,0.75)';
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.justifyContent = 'center';
    container.style.zIndex = '5000';

    const modal = document.createElement('div');
    modal.style.width = '360px';
    modal.style.maxWidth = '90vw';
    modal.style.background = '#111827';
    modal.style.borderRadius = '18px';
    modal.style.padding = '20px';
    modal.style.border = '1px solid rgba(255,255,255,0.12)';
    modal.style.boxShadow = '0 20px 50px rgba(0,0,0,0.4)';

    const title = document.createElement('h3');
    title.textContent = 'QR Code Export';
    title.style.margin = '0 0 12px';
    title.style.color = '#fff';

    const img = document.createElement('img');
    img.src = qrUrl;
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

    const download = document.createElement('a');
    download.href = qrUrl;
    download.download = 'workout-qr.png';
    download.target = '_blank';
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

    modal.appendChild(title);
    modal.appendChild(img);
    modal.appendChild(download);
    modal.appendChild(close);
    container.appendChild(modal);
    document.body.appendChild(container);

    img.onerror = () => {
        alert('QR code service is unavailable right now.');
        container.remove();
    };
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
    initializeWorkoutProgram();
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
