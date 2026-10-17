(() => {
    const DB_NAME = 'biankaPicturePuzzles';
    const STORE_NAME = 'personalPuzzles';
    const DAILY_SEQUENCE_KEY = 'puzzleDailySequence';
    const DAILY_DONE_KEY = 'puzzleDailyCompletedDate';
    const DIFFICULTIES = {
        easy: { rows: 3, columns: 3, label: 'Easy' },
        medium: { rows: 5, columns: 5, label: 'Medium' },
        hard: { rows: 7, columns: 7, label: 'Hard' }
    };
    const $ = (id) => document.getElementById(id);
    const elements = {
        open: $('puzzle-welcome-btn'),
        back: $('puzzle-back-btn'),
        dailyPlay: $('daily-puzzle-play-btn'),
        dailyDifficulty: $('daily-puzzle-difficulty'),
        dailyMessage: $('daily-puzzle-message'),
        upload: $('puzzle-upload-input'),
        name: $('puzzle-name-input'),
        difficulty: $('puzzle-difficulty-select'),
        savePlay: $('puzzle-save-play-btn'),
        list: $('your-puzzles-list'),
        panel: $('puzzle-game-panel'),
        title: $('active-puzzle-title'),
        pieceCount: $('puzzle-piece-count'),
        board: $('puzzle-board'),
        boardViewport: $('puzzle-board-viewport'),
        tray: $('puzzle-piece-tray'),
        workspace: $('puzzle-workspace'),
        message: $('puzzle-game-message'),
        close: $('puzzle-close-game-btn')
    };

    let dbPromise;
    let dailyPool = [];
    let todayPuzzle = null;
    let active = null;
    let selectedPiece = null;
    let selectedPointerId = null;
    let dragOffsetX = 0;
    let dragOffsetY = 0;
    let placed = 0;
    let zoom = 1;
    let fittedWidth = 0;
    let fittedHeight = 0;

    function openDatabase() {
        if (!window.indexedDB) return Promise.reject(new Error('IndexedDB is unavailable.'));
        if (!dbPromise) {
            dbPromise = new Promise((resolve, reject) => {
                const request = indexedDB.open(DB_NAME, 1);
                request.onupgradeneeded = () => {
                    if (!request.result.objectStoreNames.contains(STORE_NAME)) {
                        request.result.createObjectStore(STORE_NAME, { keyPath: 'id' });
                    }
                };
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        }
        return dbPromise;
    }

    async function readLibrary() {
        const db = await openDatabase();
        return new Promise((resolve, reject) => {
            const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    async function storePuzzle(puzzle) {
        const db = await openDatabase();
        return new Promise((resolve, reject) => {
            const request = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).put(puzzle);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async function removePuzzle(id) {
        const db = await openDatabase();
        return new Promise((resolve, reject) => {
            const request = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).delete(id);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    function todayString() {
        const date = new Date();
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    function dateOrdinal(value) {
        const [year, month, day] = value.split('-').map(Number);
        return Date.UTC(year, month - 1, day) / 86400000;
    }

    function shuffle(items) {
        for (let i = items.length - 1; i > 0; i -= 1) {
            const j = Math.floor(Math.random() * (i + 1));
            [items[i], items[j]] = [items[j], items[i]];
        }
        return items;
    }

    function normalizeDailyImage(entry) {
        if (typeof entry === 'string') {
            return { src: `./puzzles-of-the-day/${entry}`, title: entry.replace(/\.[^.]+$/, '') };
        }
        if (!entry || typeof entry.src !== 'string') return null;
        const src = /^(\.\/|\/|https?:|data:)/.test(entry.src)
            ? entry.src
            : `./puzzles-of-the-day/${entry.src}`;
        return { src, title: entry.title || entry.src.replace(/\.[^.]+$/, '') };
    }

    async function loadDaily() {
        try {
            const response = await fetch('./puzzles-of-the-day/puzzles.json', { cache: 'no-store' });
            if (!response.ok) throw new Error('No puzzle list found.');
            const manifest = await response.json();
            const entries = Array.isArray(manifest) ? manifest : manifest.puzzles;
            dailyPool = (Array.isArray(entries) ? entries : []).map(normalizeDailyImage).filter(Boolean);
            updateDailyPuzzle();
        } catch (error) {
            dailyPool = [];
            elements.dailyMessage.textContent = 'Add image filenames to puzzles-of-the-day/puzzles.json to start the daily rotation.';
            elements.dailyPlay.disabled = true;
            elements.dailyPlay.textContent = 'No Daily Picture Yet';
        }
    }

    function updateDailyPuzzle() {
        const today = todayString();
        elements.dailyPlay.disabled = true;
        todayPuzzle = null;
        if (!dailyPool.length) {
            elements.dailyMessage.textContent = 'Add pictures to the puzzles-of-the-day folder and list them in puzzles.json.';
            elements.dailyPlay.textContent = 'No Daily Picture Yet';
            return;
        }
        const ids = dailyPool.map((item) => item.src);
        let sequence;
        try { sequence = JSON.parse(localStorage.getItem(DAILY_SEQUENCE_KEY) || 'null'); } catch (error) { sequence = null; }
        const matchesPool = sequence && Array.isArray(sequence.ids)
            && sequence.ids.length === ids.length && ids.every((id) => sequence.ids.includes(id));
        if (!matchesPool || !sequence.startDate) sequence = { ids: shuffle([...ids]), startDate: today };
        let offset = dateOrdinal(today) - dateOrdinal(sequence.startDate);
        if (offset < 0 || offset >= sequence.ids.length) {
            sequence = { ids: shuffle([...ids]), startDate: today };
            offset = 0;
        }
        localStorage.setItem(DAILY_SEQUENCE_KEY, JSON.stringify(sequence));
        todayPuzzle = dailyPool.find((item) => item.src === sequence.ids[offset]) || null;
        const done = localStorage.getItem(DAILY_DONE_KEY) === today;
        elements.dailyMessage.textContent = `${todayPuzzle ? todayPuzzle.title : 'Picture unavailable'} · ${done ? 'Completed today — come back tomorrow.' : 'No repeats until the entire picture pool has been used.'}`;
        elements.dailyPlay.disabled = done || !todayPuzzle;
        elements.dailyPlay.textContent = done ? 'Completed Today ✓' : 'Play Today’s Puzzle';
    }

    async function renderLibrary() {
        try {
            const puzzles = await readLibrary();
            elements.list.replaceChildren();
            if (!puzzles.length) {
                const empty = document.createElement('p');
                empty.className = 'puzzle-empty-state';
                empty.textContent = 'No personal puzzles yet. Upload a picture to get started.';
                elements.list.appendChild(empty);
                return;
            }
            puzzles.sort((a, b) => b.createdAt - a.createdAt).forEach((puzzle) => {
                const card = document.createElement('article');
                card.className = 'your-puzzle-card';
                const image = document.createElement('img');
                image.src = puzzle.image;
                image.alt = `${puzzle.name} preview`;
                const title = document.createElement('h4');
                title.textContent = puzzle.name;
                const controls = document.createElement('div');
                controls.className = 'your-puzzle-card-controls';
                const select = document.createElement('select');
                select.setAttribute('aria-label', `Difficulty for ${puzzle.name}`);
                Object.entries(DIFFICULTIES).forEach(([value, difficulty]) => {
                    const option = document.createElement('option');
                    option.value = value;
                    option.textContent = `${difficulty.label} · ${difficulty.rows * difficulty.columns} pieces`;
                    select.appendChild(option);
                });
                const play = document.createElement('button');
                play.type = 'button';
                play.textContent = 'Play';
                play.addEventListener('click', () => startPuzzle({ id: puzzle.id, title: puzzle.name, src: puzzle.image, source: 'personal' }, select.value));
                const remove = document.createElement('button');
                remove.type = 'button';
                remove.className = 'puzzle-delete-btn';
                remove.textContent = 'Delete';
                remove.addEventListener('click', async () => {
                    await removePuzzle(puzzle.id);
                    renderLibrary();
                });
                controls.append(select, play, remove);
                card.append(image, title, controls);
                elements.list.appendChild(card);
            });
        } catch (error) {
            elements.list.textContent = 'Your puzzle library could not be loaded in this browser.';
        }
    }

    function openPuzzleScreen() {
        if (typeof playPopSound === 'function') playPopSound();
        showScreen('puzzle');
        loadDaily();
        renderLibrary();
    }

    function pointOnEdge(startX, startY, unitX, unitY, normalX, normalY, length, t, outward) {
        const offset = outward;
        return [
            startX + unitX * length * t + normalX * offset,
            startY + unitY * length * t + normalY * offset
        ];
    }

    function traceJigsawEdge(context, start, end, normal, polarity, tab) {
        const dx = end[0] - start[0];
        const dy = end[1] - start[1];
        const length = Math.hypot(dx, dy);
        const unitX = dx / length;
        const unitY = dy / length;
        const nx = normal[0];
        const ny = normal[1];
        const p = (t, amount) => pointOnEdge(start[0], start[1], unitX, unitY, nx, ny, length, t, amount * polarity * tab);
        if (!polarity) {
            context.lineTo(end[0], end[1]);
            return;
        }
        context.lineTo(...p(0.35, 0));
        context.bezierCurveTo(...p(0.40, 0), ...p(0.40, 0.68), ...p(0.46, 0.68));
        context.bezierCurveTo(...p(0.47, 1.35), ...p(0.53, 1.35), ...p(0.54, 0.68));
        context.bezierCurveTo(...p(0.60, 0.68), ...p(0.60, 0), ...p(0.65, 0));
        context.lineTo(end[0], end[1]);
    }

    function traceJigsawPath(context, row, column, cellWidth, cellHeight, tab) {
        const topPolarity = row === 0 ? 0 : -active.horizontalEdges[row - 1][column];
        const rightPolarity = column === active.columns - 1 ? 0 : active.verticalEdges[row][column];
        const bottomPolarity = row === active.rows - 1 ? 0 : active.horizontalEdges[row][column];
        const leftPolarity = column === 0 ? 0 : -active.verticalEdges[row][column - 1];
        const left = tab;
        const top = tab;
        const right = tab + cellWidth;
        const bottom = tab + cellHeight;
        context.beginPath();
        context.moveTo(left, top);
        traceJigsawEdge(context, [left, top], [right, top], [0, -1], topPolarity, tab);
        traceJigsawEdge(context, [right, top], [right, bottom], [1, 0], rightPolarity, tab);
        traceJigsawEdge(context, [right, bottom], [left, bottom], [0, 1], bottomPolarity, tab);
        traceJigsawEdge(context, [left, bottom], [left, top], [-1, 0], leftPolarity, tab);
        context.closePath();
    }

    function drawJigsawOutline(slot, index, cellWidth, cellHeight, tab) {
        const row = Math.floor(index / active.columns);
        const column = index % active.columns;
        const canvas = slot.querySelector('.puzzle-slot-outline');
        const width = Math.ceil(cellWidth + tab * 2);
        const height = Math.ceil(cellHeight + tab * 2);
        canvas.width = width;
        canvas.height = height;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        const context = canvas.getContext('2d');
        if (!context) return;
        context.clearRect(0, 0, width, height);
        traceJigsawPath(context, row, column, cellWidth, cellHeight, tab);
        context.lineJoin = 'round';
        context.lineWidth = Math.max(1.2, tab * 0.08);
        context.strokeStyle = 'rgba(226, 238, 255, 0.32)';
        context.stroke();
    }

    function drawJigsawPiece(piece, boardWidth, boardHeight, cellWidth, cellHeight, tab) {
        const index = Number(piece.dataset.index);
        const row = Math.floor(index / active.columns);
        const column = index % active.columns;
        const canvas = piece.querySelector('canvas');
        const width = Math.ceil(cellWidth + tab * 2);
        const height = Math.ceil(cellHeight + tab * 2);
        canvas.width = width;
        canvas.height = height;
        piece.style.width = `${width}px`;
        piece.style.height = `${height}px`;
        const context = canvas.getContext('2d');
        if (!context) return;

        context.clearRect(0, 0, width, height);
        context.save();
        traceJigsawPath(context, row, column, cellWidth, cellHeight, tab);
        context.clip();
        context.drawImage(active.imageElement, tab - column * cellWidth, tab - row * cellHeight, boardWidth, boardHeight);
        context.restore();
        traceJigsawPath(context, row, column, cellWidth, cellHeight, tab);
        context.lineJoin = 'round';
        context.lineWidth = Math.max(1.25, tab * 0.09);
        context.strokeStyle = 'rgba(241, 247, 255, 0.82)';
        context.shadowColor = 'rgba(0, 0, 0, 0.4)';
        context.shadowBlur = 3;
        context.stroke();
    }

    function fitBoard() {
        const maxWidth = Math.max(220, Math.min(740, (elements.workspace.clientWidth || 800) - 48));
        const fit = Math.min(maxWidth / active.imageWidth, 460 / active.imageHeight);
        fittedWidth = Math.max(active.columns * 18, Math.round(active.imageWidth * fit));
        fittedHeight = Math.max(active.rows * 18, Math.round(active.imageHeight * fit));
        const width = Math.round(fittedWidth * zoom);
        const height = Math.round(fittedHeight * zoom);
        const cellWidth = width / active.columns;
        const cellHeight = height / active.rows;
        const tab = Math.max(5, Math.min(cellWidth, cellHeight) * 0.2);
        elements.board.style.width = `${width}px`;
        elements.board.style.height = `${height}px`;
        elements.board.style.gridTemplateColumns = `repeat(${active.columns}, minmax(0, 1fr))`;
        elements.board.style.gridTemplateRows = `repeat(${active.rows}, minmax(0, 1fr))`;
        elements.board.style.setProperty('--jigsaw-tab', `${tab}px`);
        elements.tray.style.gridTemplateColumns = `repeat(${active.columns}, ${cellWidth + tab * 2}px)`;
        elements.tray.style.width = `${active.columns * (cellWidth + tab * 2) + (active.columns - 1) * 5 + 20}px`;
        elements.pieceTab = tab;
        elements.board.querySelectorAll('.puzzle-slot').forEach((slot, index) => {
            drawJigsawOutline(slot, index, cellWidth, cellHeight, tab);
        });
        elements.panel.querySelectorAll('.puzzle-piece').forEach((piece) => {
            drawJigsawPiece(piece, width, height, cellWidth, cellHeight, tab);
        });
    }

    function finishPuzzle() {
        const total = active.rows * active.columns;
        if (placed !== total) {
            elements.message.textContent = `${placed} of ${total} pieces placed.`;
            return;
        }
        if (active.source === 'daily') {
            localStorage.setItem(DAILY_DONE_KEY, todayString());
            updateDailyPuzzle();
            elements.message.textContent = 'Picture complete! Your next daily puzzle will be ready tomorrow. 🎉';
        } else {
            elements.message.textContent = 'Picture complete! Great work! 🎉';
        }
    }

    function dropPiece(event) {
        if (!selectedPiece || event.pointerId !== selectedPointerId) return;
        const piece = selectedPiece;
        const pieceWidth = piece.getBoundingClientRect().width;
        const pieceHeight = piece.getBoundingClientRect().height;
        const pieceLeft = event.clientX - dragOffsetX;
        const pieceTop = event.clientY - dragOffsetY;
        const centerX = pieceLeft + pieceWidth / 2;
        const centerY = pieceTop + pieceHeight / 2;
        const boardRect = elements.board.getBoundingClientRect();
        const cellWidth = boardRect.width / active.columns;
        const cellHeight = boardRect.height / active.rows;
        let target = -1;
        let nearCenter = false;
        if (centerX >= boardRect.left && centerX <= boardRect.right && centerY >= boardRect.top && centerY <= boardRect.bottom) {
            const column = Math.min(active.columns - 1, Math.floor((centerX - boardRect.left) / cellWidth));
            const row = Math.min(active.rows - 1, Math.floor((centerY - boardRect.top) / cellHeight));
            target = row * active.columns + column;
            const slotCenterX = boardRect.left + (column + 0.5) * cellWidth;
            const slotCenterY = boardRect.top + (row + 0.5) * cellHeight;
            nearCenter = Math.hypot(centerX - slotCenterX, centerY - slotCenterY)
                <= Math.max(22, Math.min(cellWidth, cellHeight) * 0.38);
        }

        piece.classList.remove('is-dragging');
        piece.style.zIndex = '';
        selectedPiece = null;
        selectedPointerId = null;
        if (target === Number(piece.dataset.index) && nearCenter) {
            piece.classList.remove('is-scattered');
            piece.classList.add('is-placed');
            piece.style.position = '';
            piece.style.left = '';
            piece.style.top = '';
            piece.disabled = true;
            elements.board.children[target].appendChild(piece);
            placed += 1;
            finishPuzzle();
            return;
        }

        const workspaceRect = elements.workspace.getBoundingClientRect();
        piece.classList.add('is-scattered');
        piece.style.left = `${pieceLeft - workspaceRect.left + elements.workspace.scrollLeft}px`;
        piece.style.top = `${pieceTop - workspaceRect.top + elements.workspace.scrollTop}px`;
        elements.workspace.appendChild(piece);
        elements.message.textContent = 'Piece dropped. Keep moving it until it is close to its matching outline.';
    }

    function startPuzzle(puzzle, level) {
        const difficulty = DIFFICULTIES[level] || DIFFICULTIES.medium;
        const image = new Image();
        image.onload = () => {
            const horizontalEdges = Array.from({ length: difficulty.rows - 1 }, () =>
                Array.from({ length: difficulty.columns }, () => Math.random() < 0.5 ? -1 : 1));
            const verticalEdges = Array.from({ length: difficulty.rows }, () =>
                Array.from({ length: difficulty.columns - 1 }, () => Math.random() < 0.5 ? -1 : 1));
            active = {
                ...puzzle,
                rows: difficulty.rows,
                columns: difficulty.columns,
                imageWidth: image.naturalWidth,
                imageHeight: image.naturalHeight,
                imageElement: image,
                horizontalEdges,
                verticalEdges
            };
            zoom = 1;
            placed = 0;
            selectedPiece = null;
            selectedPointerId = null;
            elements.title.textContent = puzzle.title;
            elements.pieceCount.textContent = `${difficulty.label} · ${difficulty.rows * difficulty.columns} pieces · image ratio preserved`;
            elements.message.textContent = 'Hold the left mouse button and drag a piece onto its matching outline.';
            elements.board.replaceChildren();
            elements.tray.replaceChildren();
            elements.workspace.querySelectorAll('.puzzle-piece.is-scattered').forEach((piece) => piece.remove());
            const total = difficulty.rows * difficulty.columns;
            for (let i = 0; i < total; i += 1) {
                const slot = document.createElement('div');
                slot.className = 'puzzle-slot';
                const outline = document.createElement('canvas');
                outline.className = 'puzzle-slot-outline';
                outline.setAttribute('aria-hidden', 'true');
                slot.appendChild(outline);
                elements.board.appendChild(slot);
            }
            shuffle(Array.from({ length: total }, (_, i) => i)).forEach((index) => {
                const piece = document.createElement('button');
                piece.type = 'button';
                piece.className = 'puzzle-piece';
                piece.dataset.index = String(index);
                piece.setAttribute('aria-label', `Puzzle piece ${index + 1}`);
                piece.appendChild(document.createElement('canvas'));
                piece.addEventListener('pointerdown', (event) => {
                    if (event.button !== 0 || piece.disabled) return;
                    event.preventDefault();
                    const rect = piece.getBoundingClientRect();
                    selectedPiece = piece;
                    selectedPointerId = event.pointerId;
                    dragOffsetX = event.clientX - rect.left;
                    dragOffsetY = event.clientY - rect.top;
                    piece.classList.remove('is-scattered');
                    piece.classList.add('is-dragging');
                    piece.style.left = `${rect.left}px`;
                    piece.style.top = `${rect.top}px`;
                    document.body.appendChild(piece);
                    elements.message.textContent = 'Dragging — release near the matching outline to snap the piece in place.';
                });
                elements.tray.appendChild(piece);
            });
            elements.panel.hidden = false;
            fitBoard();
            elements.panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        };
        image.onerror = () => alert('That image could not be opened. Check the image file and daily puzzle list.');
        image.src = puzzle.src;
    }

    elements.open.addEventListener('click', openPuzzleScreen);
    elements.back.addEventListener('click', () => showScreen('welcome'));
    elements.dailyPlay.addEventListener('click', () => {
        if (todayPuzzle && localStorage.getItem(DAILY_DONE_KEY) !== todayString()) {
            startPuzzle({ ...todayPuzzle, source: 'daily' }, elements.dailyDifficulty.value);
        }
    });
    elements.savePlay.addEventListener('click', async () => {
        const file = elements.upload.files && elements.upload.files[0];
        if (!file || !file.type.startsWith('image/')) return alert('Choose a picture file first.');
        if (file.size > 15 * 1024 * 1024) return alert('Choose an image smaller than 15 MB.');
        try {
            const image = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = () => reject(reader.error);
                reader.readAsDataURL(file);
            });
            const puzzle = {
                id: `puzzle-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
                name: elements.name.value.trim() || file.name.replace(/\.[^.]+$/, ''),
                image,
                createdAt: Date.now()
            };
            await storePuzzle(puzzle);
            elements.upload.value = '';
            elements.name.value = '';
            await renderLibrary();
            startPuzzle({ id: puzzle.id, title: puzzle.name, src: puzzle.image, source: 'personal' }, elements.difficulty.value);
        } catch (error) {
            alert('The puzzle could not be saved. Try a smaller image or check browser storage availability.');
        }
    });
    elements.close.addEventListener('click', () => {
        if (selectedPiece) {
            selectedPiece.classList.remove('is-dragging');
            selectedPiece.style.left = '';
            selectedPiece.style.top = '';
            elements.tray.appendChild(selectedPiece);
            selectedPiece = null;
            selectedPointerId = null;
        }
        elements.panel.hidden = true;
    });
    document.addEventListener('pointermove', (event) => {
        if (!selectedPiece || event.pointerId !== selectedPointerId) return;
        selectedPiece.style.left = `${event.clientX - dragOffsetX}px`;
        selectedPiece.style.top = `${event.clientY - dragOffsetY}px`;
    });
    document.addEventListener('pointerup', dropPiece);
    document.addEventListener('pointercancel', dropPiece);
    elements.workspace.addEventListener('wheel', (event) => {
        if (!active) return;
        event.preventDefault();
        zoom = Math.max(0.65, Math.min(2.5, zoom + (event.deltaY < 0 ? 0.1 : -0.1)));
        fitBoard();
    }, { passive: false });
})();
