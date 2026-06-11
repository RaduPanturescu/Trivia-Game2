// Sudoku Game Logic
let sudokuState = {
    board: [],
    original: [],
    solution: [],
    selected: null,
    gameActive: false,
    gameWon: false,
    gameLost: false,
    difficulty: 'medium',
    startTime: 0,
    time: 0,
    timerInterval: null,
    mistakes: 0,
    completedRows: new Set(),
    completedCols: new Set(),
    completedBoxes: new Set()
};

const sudokuDifficulties = {
    easy: { clues: 40, label: 'Easy (40 clues)' },
    medium: { clues: 30, label: 'Medium (30 clues)' },
    hard: { clues: 20, label: 'Hard (20 clues)' }
};

function initSudoku(difficulty) {
    sudokuState.difficulty = difficulty;
    sudokuState.mistakes = 0;
    sudokuState.gameActive = true;
    sudokuState.gameWon = false;
    sudokuState.gameLost = false;
    sudokuState.selected = null;
    sudokuState.startTime = Date.now();
    sudokuState.time = 0;
    
    // Generate new sudoku puzzle
    sudokuState.solution = generateSudokuSolution();
    const clueCount = sudokuDifficulties[difficulty].clues;
    sudokuState.board = generateSudokuPuzzle(sudokuState.solution, clueCount);
    sudokuState.original = sudokuState.board.map(row => [...row]);
    sudokuState.completedRows = new Set();
    sudokuState.completedCols = new Set();
    sudokuState.completedBoxes = new Set();
    
    renderSudokuBoard();
    startSudokuTimer();
    updateMistakeCount();
    renderSudokuLeaderboard();
}

function generateSudokuSolution() {
    const board = Array(9).fill(null).map(() => Array(9).fill(0));
    fillSudoku(board);
    return board.map(row => [...row]);
}

function fillSudoku(board) {
    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (board[row][col] === 0) {
                shuffle(numbers);
                for (let num of numbers) {
                    if (isValidSudokuMove(board, row, col, num)) {
                        board[row][col] = num;
                        if (fillSudoku(board)) return true;
                        board[row][col] = 0;
                    }
                }
                return false;
            }
        }
    }
    return true;
}

function isValidSudokuMove(board, row, col, num) {
    // Check row
    for (let c = 0; c < 9; c++) {
        if (board[row][c] === num) return false;
    }
    
    // Check column
    for (let r = 0; r < 9; r++) {
        if (board[r][col] === num) return false;
    }
    
    // Check 3x3 box
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let r = boxRow; r < boxRow + 3; r++) {
        for (let c = boxCol; c < boxCol + 3; c++) {
            if (board[r][c] === num) return false;
        }
    }
    
    return true;
}

function generateSudokuPuzzle(solution, clueCount) {
    const puzzle = solution.map(row => [...row]);
    let cellsToRemove = 81 - clueCount;
    
    while (cellsToRemove > 0) {
        const row = Math.floor(Math.random() * 9);
        const col = Math.floor(Math.random() * 9);
        
        if (puzzle[row][col] !== 0) {
            puzzle[row][col] = 0;
            cellsToRemove--;
        }
    }
    
    return puzzle;
}

function startSudokuTimer() {
    if (sudokuState.timerInterval) clearInterval(sudokuState.timerInterval);
    
    sudokuState.timerInterval = setInterval(() => {
        if (sudokuState.gameActive) {
            sudokuState.time = Math.floor((Date.now() - sudokuState.startTime) / 1000);
            updateSudokuTimer();
        }
    }, 100);
}

function updateSudokuTimer() {
    const timerEl = document.getElementById('sudoku-timer');
    if (timerEl) {
        const mins = Math.floor(sudokuState.time / 60);
        const secs = sudokuState.time % 60;
        timerEl.textContent = `⏱️ ${mins}:${secs.toString().padStart(2, '0')}`;
    }
}

function renderSudokuBoard() {
    const boardEl = document.getElementById('sudoku-board');
    if (!boardEl) return;
    
    boardEl.innerHTML = '';
    
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            const cell = document.createElement('input');
            cell.type = 'text';
            cell.inputMode = 'numeric';
            cell.className = 'sudoku-cell';
            cell.dataset.row = row;
            cell.dataset.col = col;
            cell.maxLength = 1;
            
            // Add box borders
            if ((row + 1) % 3 === 0 && row !== 8) cell.style.borderBottom = '2px solid var(--primary)';
            if ((col + 1) % 3 === 0 && col !== 8) cell.style.borderRight = '2px solid var(--primary)';
            
            const value = sudokuState.board[row][col];
            if (value !== 0) {
                cell.value = value;
                cell.disabled = true;
                cell.classList.add('sudoku-given');
            }
            
            cell.addEventListener('focus', (e) => {
                document.querySelectorAll('.sudoku-cell').forEach(c => c.classList.remove('selected'));
                cell.classList.add('selected');
                sudokuState.selected = { row, col };
                highlightRelated(row, col);
            });
            
            cell.addEventListener('input', (e) => {
                let val = e.target.value;
                if (val === '') {
                    sudokuState.board[row][col] = 0;
                } else if (/^[1-9]$/.test(val)) {
                    const num = parseInt(val);
                    const conflicts = getSudokuConflicts(row, col, num);
                    if (conflicts.length > 0) {
                        sudokuState.mistakes++;
                        updateMistakeCount();
                        cell.classList.add('error');
                        highlightSudokuConflicts(row, col, conflicts);
                        setTimeout(() => cell.classList.remove('error'), 500);
                        cell.value = '';
                        sudokuState.board[row][col] = 0;
                        if (sudokuState.mistakes >= 3 && localStorage.getItem('devMode') !== 'true') {
                            endSudokuGame(false);
                        }
                    } else if (num === sudokuState.solution[row][col]) {
                        sudokuState.board[row][col] = num;
                        cell.classList.remove('error');
                    } else {
                        sudokuState.mistakes++;
                        updateMistakeCount();
                        cell.value = '';
                        sudokuState.board[row][col] = 0;
                        cell.classList.add('error');
                        setTimeout(() => cell.classList.remove('error'), 500);
                        if (sudokuState.mistakes >= 3 && localStorage.getItem('devMode') !== 'true') {
                            endSudokuGame(false);
                        }
                    }
                } else {
                    cell.value = '';
                }
                
                checkSudokuCompletionEffects(row, col);
                checkSudokuWin();
            });
            
            cell.addEventListener('keydown', (e) => {
                const row = parseInt(cell.dataset.row);
                const col = parseInt(cell.dataset.col);
                
                if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    if (row > 0) document.querySelector(`[data-row="${row - 1}"][data-col="${col}"]`).focus();
                } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    if (row < 8) document.querySelector(`[data-row="${row + 1}"][data-col="${col}"]`).focus();
                } else if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    if (col > 0) document.querySelector(`[data-row="${row}"][data-col="${col - 1}"]`).focus();
                } else if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    if (col < 8) document.querySelector(`[data-row="${row}"][data-col="${col + 1}"]`).focus();
                } else if (e.key === 'Backspace' || e.key === 'Delete') {
                    e.preventDefault();
                    cell.value = '';
                    sudokuState.board[row][col] = 0;
                }
            });
            
            // Dev tool: Shift+Click to reveal correct answer
            cell.addEventListener('click', (e) => {
                const isDev = localStorage.getItem('devMode') === 'true';
                if (e.shiftKey && isDev) {
                    const correctAnswer = sudokuState.solution[row][col];
                    if (!cell.disabled) {
                        cell.value = correctAnswer;
                        sudokuState.board[row][col] = correctAnswer;
                        cell.classList.add('dev-filled');
                        setTimeout(() => cell.classList.remove('dev-filled'), 1500);
                    }
                    checkSudokuCompletionEffects(row, col);
                    checkSudokuWin();
                }
            });
            
            boardEl.appendChild(cell);
        }
    }
}

function highlightRelated(row, col) {
    const cells = document.querySelectorAll('.sudoku-cell');
    cells.forEach(c => c.classList.remove('related'));
    
    // Highlight row
    cells.forEach(c => {
        if (parseInt(c.dataset.row) === row) c.classList.add('related');
    });
    
    // Highlight column
    cells.forEach(c => {
        if (parseInt(c.dataset.col) === col) c.classList.add('related');
    });
    
    // Highlight box
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    cells.forEach(c => {
        const r = parseInt(c.dataset.row);
        const col_c = parseInt(c.dataset.col);
        if (r >= boxRow && r < boxRow + 3 && col_c >= boxCol && col_c < boxCol + 3) {
            c.classList.add('related');
        }
    });
}

function updateMistakeCount() {
    const mistakesEl = document.getElementById('sudoku-mistakes');
    if (mistakesEl) {
        mistakesEl.textContent = `❌ ${sudokuState.mistakes} / 3`;
        if (sudokuState.mistakes >= 3) {
            mistakesEl.style.color = 'var(--incorrect)';
        }
    }
}

function checkSudokuCompletionEffects(row, col) {
    if (!sudokuState.gameActive) return;

    const rowComplete = sudokuState.board[row].every((val, c) => val !== 0 && val === sudokuState.solution[row][c]);
    if (rowComplete && !sudokuState.completedRows.has(row)) {
        sudokuState.completedRows.add(row);
        flashCells(document.querySelectorAll(`.sudoku-cell[data-row="${row}"]`));
    }

    const colComplete = Array.from({ length: 9 }).every((_, r) => sudokuState.board[r][col] !== 0 && sudokuState.board[r][col] === sudokuState.solution[r][col]);
    if (colComplete && !sudokuState.completedCols.has(col)) {
        sudokuState.completedCols.add(col);
        flashCells(Array.from(document.querySelectorAll(`.sudoku-cell[data-col="${col}"]`)));
    }

    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    const boxIndex = boxRow + boxCol / 3;
    const boxComplete = [];
    for (let r = boxRow; r < boxRow + 3; r++) {
        for (let c = boxCol; c < boxCol + 3; c++) {
            boxComplete.push(sudokuState.board[r][c] !== 0 && sudokuState.board[r][c] === sudokuState.solution[r][c]);
        }
    }
    if (boxComplete.every(Boolean) && !sudokuState.completedBoxes.has(boxIndex)) {
        sudokuState.completedBoxes.add(boxIndex);
        const cells = [];
        for (let r = boxRow; r < boxRow + 3; r++) {
            for (let c = boxCol; c < boxCol + 3; c++) {
                cells.push(document.querySelector(`.sudoku-cell[data-row="${r}"][data-col="${c}"]`));
            }
        }
        flashCells(cells);
    }
}

function getSudokuConflicts(row, col, value) {
    const conflicts = [];

    // Row conflicts
    for (let c = 0; c < 9; c++) {
        if (c !== col && sudokuState.board[row][c] === value) {
            conflicts.push({ row, col: c });
        }
    }

    // Column conflicts
    for (let r = 0; r < 9; r++) {
        if (r !== row && sudokuState.board[r][col] === value) {
            conflicts.push({ row: r, col });
        }
    }

    // Box conflicts
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let r = boxRow; r < boxRow + 3; r++) {
        for (let c = boxCol; c < boxCol + 3; c++) {
            if (!(r === row && c === col) && sudokuState.board[r][c] === value) {
                conflicts.push({ row: r, col: c });
            }
        }
    }

    return conflicts;
}

function highlightSudokuConflicts(row, col, conflicts) {
    const conflictKeys = new Set([`${row},${col}`]);
    conflicts.forEach(({ row: r, col: c }) => conflictKeys.add(`${r},${c}`));

    conflictKeys.forEach(key => {
        const [r, c] = key.split(',').map(Number);
        const cell = document.querySelector(`.sudoku-cell[data-row="${r}"][data-col="${c}"]`);
        if (cell) {
            cell.classList.add('sudoku-conflict');
        }
    });

    setTimeout(() => {
        conflictKeys.forEach(key => {
            const [r, c] = key.split(',').map(Number);
            const cell = document.querySelector(`.sudoku-cell[data-row="${r}"][data-col="${c}"]`);
            if (cell) {
                cell.classList.remove('sudoku-conflict');
            }
        });
    }, 1000);
}

function flashCells(cells) {
    const allCells = Array.from(cells).filter(Boolean);
    allCells.forEach(cell => {
        cell.classList.add('sudoku-flash');
        setTimeout(() => cell.classList.remove('sudoku-flash'), 1000);
    });
}

function checkSudokuWin() {
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (sudokuState.board[row][col] !== sudokuState.solution[row][col]) {
                return;
            }
        }
    }
    
    sudokuState.gameWon = true;
    sudokuState.gameActive = false;
    recordSudokuLeaderboardEntry();
    if (typeof unlockAchievement === 'function') {
        unlockAchievement('sudoCute');
    }
    renderSudokuLeaderboard();
    endSudokuGame(true);
}

function recordSudokuLeaderboardEntry() {
    const entries = loadSudokuLeaderboard();
    const entry = {
        difficulty: sudokuState.difficulty,
        time: sudokuState.time,
        date: new Date().toLocaleString()
    };
    entries.push(entry);
    entries.sort((a, b) => a.time - b.time);
    localStorage.setItem('sudokuLeaderboard', JSON.stringify(entries.slice(0, 20)));
}

function loadSudokuLeaderboard() {
    const stored = localStorage.getItem('sudokuLeaderboard');
    if (!stored) return [];
    try {
        return JSON.parse(stored) || [];
    } catch {
        return [];
    }
}

function formatLeaderboardTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function renderSudokuLeaderboard() {
    const listEl = document.getElementById('sudoku-leaderboard-list');
    const prEl = document.getElementById('sudoku-pr');
    if (!listEl || !prEl) return;
    
    const entries = loadSudokuLeaderboard();
    const best = entries.length > 0 ? entries[0] : null;
    prEl.textContent = best ? `PR: ${formatLeaderboardTime(best.time)} (${best.difficulty})` : 'PR: -';
    
    if (entries.length === 0) {
        listEl.innerHTML = '<div class="leaderboard-empty">No sudoku rounds played yet.</div>';
        return;
    }
    
    listEl.innerHTML = entries.map((entry, index) => `
        <div class="leaderboard-row ${index === 0 ? 'leaderboard-top' : ''}">
            <div>#${index + 1}</div>
            <div>${entry.difficulty}</div>
            <div>${formatLeaderboardTime(entry.time)}</div>
            <div>${entry.date}</div>
        </div>
    `).join('');
}

const sudokuClearLeaderboardBtn = document.getElementById('sudoku-clear-leaderboard-btn');
if (sudokuClearLeaderboardBtn) {
    sudokuClearLeaderboardBtn.addEventListener('click', () => {
        localStorage.removeItem('sudokuLeaderboard');
        renderSudokuLeaderboard();
    });
}

function endSudokuGame(won) {
    if (sudokuState.timerInterval) clearInterval(sudokuState.timerInterval);
    
    const resultEl = document.getElementById('sudoku-result');
    if (resultEl) {
        if (won) {
            resultEl.innerHTML = `<h2>🎉 You Won!</h2><p>Time: ${formatTime(sudokuState.time)}</p>`;
            resultEl.style.color = 'var(--correct)';
        } else {
            resultEl.innerHTML = `<h2>💥 Game Over!</h2><p>Too many mistakes (3 strikes)</p>`;
            resultEl.style.color = 'var(--incorrect)';
        }
        resultEl.style.display = 'block';
    }
    
    // Disable all cells
    document.querySelectorAll('.sudoku-cell:not(.sudoku-given)').forEach(cell => {
        cell.disabled = true;
    });
}

function resetSudoku() {
    if (sudokuState.timerInterval) clearInterval(sudokuState.timerInterval);
    const resultEl = document.getElementById('sudoku-result');
    if (resultEl) resultEl.style.display = 'none';
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}
