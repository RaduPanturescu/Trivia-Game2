/* Actual performance is intentionally stored separately from planned workouts. */
const EXERCISE_STATS_KEY = 'triviaExerciseStatsV1';
const EXERCISE_AREAS = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Quadriceps', 'Glutes', 'Hamstrings', 'Calves', 'Core', 'Cardio', 'Conditioning', 'Mobility'];
let exerciseCoverageSignature = '';
let exerciseCoverageMode = 'plan';

function exerciseStatsData() {
    try {
        const data = JSON.parse(localStorage.getItem(EXERCISE_STATS_KEY) || '{}');
        return { logs: Array.isArray(data.logs) ? data.logs : [], maxes: Array.isArray(data.maxes) ? data.maxes : [], runs: Array.isArray(data.runs) ? data.runs : [], completed: Array.isArray(data.completed) ? data.completed : [], areas: data.areas && typeof data.areas === 'object' ? data.areas : {} };
    } catch (error) {
        return { logs: [], maxes: [], runs: [], completed: [], areas: {} };
    }
}

function saveExerciseStats(data) {
    try {
        localStorage.setItem(EXERCISE_STATS_KEY, JSON.stringify(data));
        return true;
    } catch (error) {
        alert('Could not save exercise stats. Check your browser storage and try again.');
        return false;
    }
}

function exerciseKey(name) { return String(name || '').trim().toLocaleLowerCase(); }
function exerciseEscape(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
}
function exerciseNumber(value) { return Number(value).toLocaleString(undefined, { maximumFractionDigits: 3 }); }

function exerciseShortDate(date) {
    return formatDisplayDate(date);
}

function exerciseStatsLibrary() {
    let custom = [];
    try { custom = JSON.parse(localStorage.getItem('triviaWorkoutCustomExercises') || '[]'); } catch (error) { /* Ignore malformed custom exercises. */ }
    return [...getWorkoutExerciseCatalog(), ...(Array.isArray(custom) ? custom : [])];
}

function initializeExerciseSuggestions(inputId, listId) {
    const input = document.getElementById(inputId);
    const list = document.getElementById(listId);
    let active = -1;
    const close = () => { list.hidden = true; input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-activedescendant'); active = -1; };
    const choose = value => { input.value = value; close(); input.focus(); input.dispatchEvent(new Event('change', { bubbles: true })); };
    const render = () => {
        const planned = workoutState.weeks.flatMap(week => (week.days || []).flatMap(day => day.exercises || []));
        const names = [...new Set([...exerciseStatsLibrary(), ...planned].map(item => item.name).filter(Boolean))].sort((a, b) => a.localeCompare(b));
        const matches = names.filter(name => exerciseKey(name).includes(exerciseKey(input.value)));
        list.replaceChildren(); active = -1; input.removeAttribute('aria-activedescendant');
        matches.forEach((name, index) => {
            const option = document.createElement('span');
            option.id = `${listId}-option-${index}`;
            option.className = 'exercise-suggestion-option';
            option.setAttribute('role', 'option');
            option.setAttribute('aria-selected', 'false');
            option.textContent = name;
            option.addEventListener('pointerdown', event => event.preventDefault());
            option.addEventListener('click', () => choose(name));
            list.appendChild(option);
        });
        list.hidden = !matches.length;
        input.setAttribute('aria-expanded', String(!!matches.length));
    };
    input.addEventListener('focus', render);
    input.addEventListener('input', render);
    input.addEventListener('blur', close);
    input.addEventListener('keydown', event => {
        if (event.key === 'Escape') { close(); return; }
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            if (list.hidden) render();
            const options = [...list.children];
            if (!options.length) return;
            active = Math.max(0, Math.min(options.length - 1, active + (event.key === 'ArrowDown' ? 1 : -1)));
            options.forEach((option, index) => option.setAttribute('aria-selected', String(index === active)));
            input.setAttribute('aria-activedescendant', options[active].id);
            options[active].scrollIntoView({ block: 'nearest' });
        } else if (event.key === 'Enter' && !list.hidden && active >= 0) {
            event.preventDefault(); choose(list.children[active].textContent);
        }
    });
}

function renderExerciseReviewDays(week) {
    const daySelect = document.getElementById('exercise-review-day');
    const previous = daySelect.value;
    daySelect.innerHTML = (week?.days || []).map(day => `<option value="${exerciseEscape(day.date)}">${exerciseEscape(day.dayLabel)} · ${exerciseEscape(formatDisplayDate(day.date))}</option>`).join('');
    if ([...daySelect.options].some(option => option.value === previous)) daySelect.value = previous;
    renderExerciseReviewExisting();
}

function renderExerciseReviewExisting() {
    const day = getWorkoutDayForDate(document.getElementById('exercise-review-day').value);
    const select = document.getElementById('exercise-review-existing');
    const previous = select.value;
    select.innerHTML = '<option value="">＋ Add new exercise</option>' + (day?.exercises || []).map((exercise, index) => `<option value="${index}">${exerciseEscape(exercise.name)}${exercise.completed ? ' (completed)' : ''}</option>`).join('');
    if ([...select.options].some(option => option.value === previous)) select.value = previous;
    populateExerciseReview();
}

function populateExerciseReview() {
    const day = getWorkoutDayForDate(document.getElementById('exercise-review-day').value);
    const index = document.getElementById('exercise-review-existing').value;
    const exercise = index === '' ? null : day?.exercises?.[Number(index)];
    document.getElementById('exercise-review-name').value = exercise?.name || '';
    document.getElementById('exercise-review-sets').value = exercise?.sets || 3;
    document.getElementById('exercise-review-reps').value = exercise?.reps || 10;
    document.getElementById('exercise-review-failure').checked = !!exercise?.repsTillFailure;
    document.getElementById('exercise-review-reps').disabled = !!exercise?.repsTillFailure;
    document.getElementById('exercise-review-weight').value = exercise?.weight ?? 0;
    document.getElementById('exercise-review-type').value = exercise && !isBodyweightExercise(exercise) ? 'weighted' : 'bodyweight';
    const blocked = !day || day.date < isoDate(new Date()) || day.manualCompleted || day.manualMissed || exercise?.completed || Number(exercise?.currentSet || 1) > 1 || (exercise && day.date === workoutState.activeDayDate && Number(index) === workoutState.activeExerciseIndex);
    document.getElementById('exercise-review-save').disabled = !!blocked;
    document.getElementById('exercise-review-message').textContent = blocked ? 'Past days and completed or active exercises cannot be changed here.' : 'Changes apply to this day and its recurring plan; logs are not renamed.';
    document.getElementById('exercise-review-save').textContent = exercise ? 'Save exercise' : '＋ Add to day';
}

// Name-based suggestions are deliberately editable, particularly for custom exercises.
function guessExerciseAreas(exercise) {
    const name = exerciseKey(exercise.name);
    const category = exerciseKey(exercise.category);
    const matches = [];
    const add = (...areas) => areas.forEach(area => { if (!matches.includes(area)) matches.push(area); });
    if (/pull.?up|chin.?up|row|lat pull/.test(name)) add('Back', 'Biceps');
    else if (/overhead press|shoulder press|pike press|pike push|lateral raise/.test(name)) add('Shoulders', 'Triceps');
    else if (/push.?up|bench press|incline press|\bdips?\b/.test(name)) add('Chest', 'Shoulders', 'Triceps');
    else if (/curl/.test(name)) add('Biceps');
    else if (/tricep/.test(name)) add('Triceps');
    else if (/romanian deadlift|\brdl\b/.test(name)) add('Hamstrings', 'Glutes');
    else if (/deadlift/.test(name)) add('Back', 'Hamstrings', 'Glutes');
    else if (/hip thrust|glute bridge/.test(name)) add('Glutes', 'Hamstrings');
    else if (/squat|lunge|step.?up|wall sit/.test(name)) add('Quadriceps', 'Glutes');
    else if (/swing/.test(name)) add('Glutes', 'Hamstrings', 'Conditioning');
    else if (/plank|crunch|sit.?up|shoulder taps/.test(name)) add('Core');
    else if (/jump rope|running|jog|cycling|rowing|swim/.test(name)) add('Cardio', 'Conditioning');
    else if (/burpee|mountain climber/.test(name)) add('Conditioning', 'Core');
    else if (/stretch|mobility|yoga/.test(name)) add('Mobility');
    else if (/calf|calves/.test(name)) add('Calves');
    if (!matches.length) {
        const fallback = { chest: ['Chest'], back: ['Back'], shoulders: ['Shoulders'], biceps: ['Biceps'], triceps: ['Triceps'], legs: ['Quadriceps'], glutes: ['Glutes'], core: ['Core'], cardio: ['Cardio'], conditioning: ['Conditioning'], mobility: ['Mobility'], calves: ['Calves'], hamstrings: ['Hamstrings'] };
        add(...(fallback[category] || []));
    }
    return matches;
}

function exerciseAreas(exercise, data) {
    const key = exerciseKey(exercise.name);
    return Object.hasOwn(data.areas, key) && Array.isArray(data.areas[key])
        ? data.areas[key].filter(area => EXERCISE_AREAS.includes(area)) : guessExerciseAreas(exercise);
}

function exerciseRadar(areas, counts, label, measure = 'planned sets') {
    const center = 160, radius = 102, maximum = Math.max(0, ...areas.map(area => counts[area]));
    const point = (index, fraction) => {
        const angle = -Math.PI / 2 + index * 2 * Math.PI / areas.length;
        return [center + Math.cos(angle) * radius * fraction, center + Math.sin(angle) * radius * fraction];
    };
    const polygon = fraction => areas.map((_, index) => point(index, fraction).join(',')).join(' ');
    const rings = [0.25, 0.5, 0.75, 1].map(fraction => `<polygon class="exercise-radar-grid" points="${polygon(fraction)}"/>`).join('');
    const axes = areas.map((area, index) => {
        const [x, y] = point(index, 1), [lx, ly] = point(index, 1.28);
        return `<line class="exercise-radar-grid" x1="${center}" y1="${center}" x2="${x}" y2="${y}"/><text x="${lx}" y="${ly}" text-anchor="middle" dominant-baseline="middle">${exerciseEscape(area)}</text>`;
    }).join('');
    const values = areas.map((area, index) => point(index, maximum ? counts[area] / maximum : 0).join(',')).join(' ');
    return `<div class="exercise-radar"><strong>${label}</strong><svg viewBox="0 0 320 320" role="img" aria-label="${label} ${measure} radar, scaled to the highest area. See the accompanying list for counts.">${rings}${axes}<polygon class="exercise-radar-value" points="${values}"/></svg></div>`;
}

function getCoverageExercises(week, data) {
    if (exerciseCoverageMode === 'plan') return (week?.days || []).flatMap(day => day.type === 'workout' ? day.exercises || [] : []);
    const planned = workoutState.weeks.flatMap(item => (item.days || []).flatMap(day => day.exercises || []));
    const reference = new Map([...planned, ...exerciseStatsLibrary()].map(exercise => [exerciseKey(exercise.name), exercise]));
    const manual = data.logs.map(log => ({ ...reference.get(exerciseKey(log.name)), ...log }));
    const completed = (data.completed || []).map(log => ({ ...reference.get(exerciseKey(log.name)), ...log }));
    return [...manual, ...completed];
}

function renderExerciseAreaOptions() {
    const select = document.getElementById('exercise-area-select');
    const options = document.getElementById('exercise-area-options');
    const week = workoutState.weeks.find(item => item.weekStart === isoDate(parseWorkoutDate(workoutState.currentWeekStart)));
    const data = exerciseStatsData();
    const exercise = getCoverageExercises(week, data).find(item => exerciseKey(item.name) === select.value);
    const selected = exercise ? exerciseAreas(exercise, data) : [];
    options.innerHTML = exercise ? EXERCISE_AREAS.map(area => `<label><input type="checkbox" value="${area}" ${selected.includes(area) ? 'checked' : ''}> ${area}</label>`).join('') : `<p class="exercise-stats-help">${exerciseCoverageMode === 'plan' ? 'Add exercises to this week' : 'Log an exercise'} to assign areas.</p>`;
    document.getElementById('exercise-area-save').disabled = !exercise;
    document.getElementById('exercise-area-reset').disabled = !exercise;
}

function renderExerciseCoverage() {
    const panel = document.getElementById('exercise-stats-panel');
    if (!panel) return;
    const week = workoutState.weeks.find(item => item.weekStart === isoDate(parseWorkoutDate(workoutState.currentWeekStart)));
    const data = exerciseStatsData();
    const exercises = getCoverageExercises(week, data);
    const signature = JSON.stringify([exerciseCoverageMode, week?.weekStart, week?.days, data.areas, exerciseCoverageMode === 'all' ? exercises : null]);
    if (signature === exerciseCoverageSignature) return;
    exerciseCoverageSignature = signature;
    const counts = Object.fromEntries(EXERCISE_AREAS.map(area => [area, 0]));
    let unassigned = 0;
    exercises.forEach(exercise => {
        const areas = exerciseAreas(exercise, data);
        if (!areas.length) unassigned++;
        areas.forEach(area => { counts[area] += Math.max(0, Number(exercise.sets) || 0); });
    });
    const allTime = exerciseCoverageMode === 'all';
    const days = new Set(exercises.map(exercise => exercise.date).filter(date => /^\d{4}-\d{2}-\d{2}$/.test(date || ''))).size;
    const planButton = document.getElementById('exercise-coverage-plan');
    const allButton = document.getElementById('exercise-coverage-all-time');
    planButton.classList.toggle('active', !allTime);
    allButton.classList.toggle('active', allTime);
    planButton.setAttribute('aria-pressed', String(!allTime));
    allButton.setAttribute('aria-pressed', String(allTime));
    document.getElementById('exercise-coverage-navigation').hidden = allTime;
    document.getElementById('exercise-plan-list').hidden = allTime;
    document.getElementById('exercise-coverage-current').hidden = !allTime && Boolean(week?.weekStart && workoutState?.currentWeekStart === week.weekStart && week.weekStart === isoDate(getMonday(new Date())));
    document.getElementById('exercise-coverage-week').textContent = allTime ? 'ALL TIME' : week?.weekStart ? `WEEK OF ${formatDisplayDate(week.weekStart)}` : 'NO WEEK';
    document.getElementById('exercise-coverage-help').textContent = '';
    document.getElementById('exercise-coverage-help').hidden = true;
    const measure = allTime ? 'average sets per logged training day' : 'planned sets';
    const chartCounts = allTime && days ? Object.fromEntries(EXERCISE_AREAS.map(area => [area, counts[area] / days])) : counts;
    document.getElementById('exercise-coverage-chart').innerHTML = exerciseRadar(EXERCISE_AREAS.slice(0, 10), chartCounts, 'Muscle groups', measure) + exerciseRadar(EXERCISE_AREAS.slice(10), chartCounts, 'Fitness', measure);
    const sortedAreas = [...EXERCISE_AREAS].sort((a, b) => counts[b] - counts[a]);
    document.getElementById('exercise-coverage-list').innerHTML = sortedAreas.map(area => `<div><span>${area}</span><span class="exercise-coverage-values"><strong class="${counts[area] ? '' : 'exercise-coverage-zero'}">${exerciseNumber(counts[area])} sets</strong>${allTime ? `<small>${exerciseNumber(days ? counts[area] / days : 0)} avg / day</small>` : ''}</span></div>`).join('');
    document.getElementById('exercise-coverage-unassigned').textContent = allTime
        ? exercises.length ? `${days} logged training ${days === 1 ? 'day' : 'days'} · ${exercises.length} ${exercises.length === 1 ? 'entry' : 'entries'} · ${unassigned} unassigned` : 'No performances logged yet. Log an exercise to see all-time coverage.'
        : `${exercises.length} planned · ${unassigned} unassigned`;
    const select = document.getElementById('exercise-area-select');
    const previous = select.value;
    const unique = new Map(exercises.map(exercise => [exerciseKey(exercise.name), exercise.name]).filter(([key]) => key));
    select.innerHTML = [...unique].map(([key, name]) => `<option value="${exerciseEscape(key)}">${exerciseEscape(name)}</option>`).join('');
    if (unique.has(previous)) select.value = previous;
    renderExerciseAreaOptions();
    renderExerciseReviewDays(week);
}

function renderExerciseHistory() {
    const data = exerciseStatsData();
    for (const type of ['calisthenics', 'weights']) {
        const list = document.getElementById(`exercise-history-${type}`);
        const openHistories = new Set([...list.querySelectorAll('.exercise-history-details[open]')].map(details => details.dataset.exerciseKey));
        const logs = data.logs.filter(log => log.type === type).sort((a, b) => b.date.localeCompare(a.date) || b.created - a.created);
        if (!logs.length) { list.innerHTML = '<p class="exercise-stats-empty">No performances logged yet.</p>'; continue; }
        const groups = new Map();
        logs.forEach(log => { const key = exerciseKey(log.name); if (!groups.has(key)) groups.set(key, []); groups.get(key).push(log); });
        list.innerHTML = [...groups.values()].map(entries => {
            const latest = entries[0];
            const weighted = entries.filter(log => Number(log.weight) > 0);
            const bodyweight = entries.filter(log => Number(log.weight) === 0);
            const maxWeight = weighted.reduce((best, log) => !best || Number(log.weight) > Number(best.weight) || (Number(log.weight) === Number(best.weight) && Number(log.reps) > Number(best.reps)) ? log : best, null);
            const maxReps = weighted.reduce((best, log) => !best || Number(log.reps) > Number(best.reps) ? log : best, null);
            const bodyweightBest = bodyweight.reduce((best, log) => Math.max(best, Number(log.reps)), 0);
            const summary = [
                bodyweight.length ? `<strong>${exerciseNumber(bodyweightBest)} Reps</strong> - Personal Best${weighted.length ? ' (bodyweight)' : ''}` : '',
                maxWeight ? `Best load: <strong>${exerciseNumber(maxWeight.weight)} kg × ${exerciseNumber(maxWeight.reps)}</strong> · Best reps: <strong>${exerciseNumber(maxReps.reps)}</strong> (${exerciseNumber(maxReps.weight)} kg)` : ''
            ].filter(Boolean).join('<br>');
            const rows = entries.map(log => {
                const unloaded = Number(log.weight) === 0;
                const metadata = [
                    !unloaded ? `${Number(log.sets) * Number(log.reps)} total reps` : '',
                    !unloaded && type === 'weights' ? `${exerciseNumber(log.sets * log.reps * log.weight)} kg volume` : '',
                    log.rpe ? `RPE ${exerciseNumber(log.rpe)}` : '',
                    log.rest !== '' && log.rest != null ? `${exerciseNumber(log.rest)}s rest` : '',
                    log.notes ? exerciseEscape(log.notes) : ''
                ].filter(Boolean);
                const details = unloaded
                    ? `${exerciseNumber(log.sets)} x ${exerciseNumber(log.reps)} Reps - ${exerciseEscape(exerciseShortDate(log.date))}`
                    : `${exerciseEscape(formatDisplayDate(log.date))} · ${exerciseNumber(log.sets)} × ${exerciseNumber(log.reps)} @ ${exerciseNumber(log.weight)} kg`;
                return `<div class="exercise-log-row"><div><strong>${details}</strong>${metadata.length ? `<span class="exercise-log-meta">${metadata.join(' · ')}</span>` : ''}</div><button type="button" class="exercise-delete" data-delete-log="${exerciseEscape(log.id)}" aria-label="Delete log for ${exerciseEscape(log.name)} on ${exerciseEscape(formatDisplayDate(log.date))}">×</button></div>`;
            }).join('');
            const key = exerciseKey(latest.name);
            return `<article class="exercise-history-item"><h5>${exerciseEscape(latest.name)}</h5><p>${summary}</p><details class="exercise-history-details" data-exercise-key="${exerciseEscape(key)}" ${openHistories.has(key) ? 'open' : ''}><summary>History (${entries.length})</summary>${rows}</details></article>`;
        }).join('');
    }
}

function renderExerciseMaxes() {
    const data = exerciseStatsData();
    const list = document.getElementById('exercise-max-list');
    const openHistories = new Set([...list.querySelectorAll('.exercise-max-tests[open]')].map(details => details.dataset.trackerId));
    if (!data.maxes.length) { list.innerHTML = '<p class="exercise-stats-empty">Add a lift to start tracking its 1RM.</p>'; return; }
    list.innerHTML = data.maxes.map(item => {
        const logs = data.logs.filter(log => log.type === 'weights' && exerciseKey(log.name) === exerciseKey(item.name));
        const tests = (Array.isArray(item.tests) ? item.tests : []).concat(logs.filter(log => Number(log.reps) === 1 && Number(log.weight) > 0).map(log => ({ weight: log.weight, date: log.date })));
        const best = tests.reduce((max, test) => Number(test.weight) > Number(max?.weight || 0) ? test : max, null);
        const estimates = logs.filter(log => Number(log.reps) >= 2 && Number(log.reps) <= 10 && Number(log.weight) > 0).map(log => ({ value: Number(log.weight) * (1 + Number(log.reps) / 30), log }));
        const estimate = estimates.reduce((max, candidate) => candidate.value > (max?.value || 0) ? candidate : max, null);
        const manualTests = Array.isArray(item.tests) ? item.tests : [];
        const testHistory = manualTests.length ? `<details class="exercise-max-tests" data-tracker-id="${exerciseEscape(item.id)}" ${openHistories.has(item.id) ? 'open' : ''}><summary>Manual test history (${manualTests.length})</summary>${manualTests.map((test, index) => `<div class="exercise-log-row"><span>${exerciseEscape(formatDisplayDate(test.date))} · ${exerciseNumber(test.weight)} kg</span><button type="button" class="exercise-delete" data-test-tracker="${exerciseEscape(item.id)}" data-test-index="${index}" aria-label="Delete ${exerciseEscape(item.name)} test from ${exerciseEscape(formatDisplayDate(test.date))}">×</button></div>`).join('')}</details>` : '';
        return `<article class="exercise-max-item"><div><h5>${exerciseEscape(item.name)}</h5><p>Tested: <strong>${best ? `${exerciseNumber(best.weight)} kg` : '—'}</strong>${best ? ` <span>(${exerciseEscape(formatDisplayDate(best.date))})</span>` : ''} · Estimated: <strong>${estimate ? `${exerciseNumber(estimate.value)} kg` : '—'}</strong>${estimate ? ` <span>(${exerciseNumber(estimate.log.weight)} kg × ${exerciseNumber(estimate.log.reps)})</span>` : ''}</p>${testHistory}</div><button type="button" class="exercise-delete" data-delete-max="${exerciseEscape(item.id)}" aria-label="Remove ${exerciseEscape(item.name)} 1RM tracker">×</button></article>`;
    }).join('');
}

function initializeExerciseStats() {
    const panel = document.getElementById('exercise-stats-panel');
    const today = isoDate(new Date());
    document.getElementById('exercise-log-date').value = formatDisplayDate(today);
    document.getElementById('exercise-max-date').value = formatDisplayDate(today);
    initializeExerciseSuggestions('exercise-log-name', 'exercise-log-suggestions');
    initializeExerciseSuggestions('exercise-max-name', 'exercise-max-suggestions');
    const logForm = document.getElementById('exercise-log-form');
    const logOpen = document.getElementById('exercise-log-open');
    const logName = document.getElementById('exercise-log-name');
    const logDetails = document.getElementById('exercise-log-details');
    const logNameActions = document.getElementById('exercise-log-name-actions');
    const logContinue = document.getElementById('exercise-log-continue');
    const resetLogForm = () => {
        logForm.reset();
        document.getElementById('exercise-log-date').value = formatDisplayDate(new Date());
        validateDisplayDate(document.getElementById('exercise-log-date'));
        logForm.hidden = true;
        logDetails.hidden = true;
        logDetails.disabled = true;
        logNameActions.hidden = false;
        logContinue.disabled = true;
        logOpen.hidden = false;
    };
    const chooseLogExercise = () => {
        if (!logName.value.trim()) return;
        const exercise = exerciseStatsLibrary().find(item => exerciseKey(item.name) === exerciseKey(logName.value));
        if (exercise) document.getElementById('exercise-log-type').value = isBodyweightExercise(exercise) ? 'calisthenics' : 'weights';
        logDetails.hidden = false;
        logDetails.disabled = false;
        logNameActions.hidden = true;
    };
    logOpen.addEventListener('click', () => {
        logOpen.hidden = true;
        logForm.hidden = false;
        logName.focus();
    });
    logName.addEventListener('input', () => {
        logContinue.disabled = !logName.value.trim();
        logDetails.hidden = true;
        logDetails.disabled = true;
        logNameActions.hidden = false;
    });
    logName.addEventListener('change', chooseLogExercise);
    logName.addEventListener('keydown', event => {
        if (event.key === 'Enter' && logDetails.hidden && !event.defaultPrevented) {
            event.preventDefault();
            chooseLogExercise();
        }
    });
    logContinue.addEventListener('click', chooseLogExercise);
    document.getElementById('exercise-log-cancel').addEventListener('click', resetLogForm);
    document.getElementById('exercise-log-cancel-details').addEventListener('click', resetLogForm);
    const maxForm = document.getElementById('exercise-max-form');
    const maxOpen = document.getElementById('exercise-max-open');
    const maxName = document.getElementById('exercise-max-name');
    const maxDetails = document.getElementById('exercise-max-details');
    const maxNameActions = document.getElementById('exercise-max-name-actions');
    const maxContinue = document.getElementById('exercise-max-continue');
    const resetMaxForm = () => {
        maxForm.reset();
        document.getElementById('exercise-max-date').value = formatDisplayDate(new Date());
        validateDisplayDate(document.getElementById('exercise-max-date'));
        maxForm.hidden = true;
        maxDetails.hidden = true;
        maxDetails.disabled = true;
        maxNameActions.hidden = false;
        maxContinue.disabled = true;
        maxOpen.hidden = false;
    };
    const chooseMaxExercise = () => {
        if (!maxName.value.trim()) return;
        maxDetails.hidden = false;
        maxDetails.disabled = false;
        maxNameActions.hidden = true;
    };
    maxOpen.addEventListener('click', () => {
        maxOpen.hidden = true;
        maxForm.hidden = false;
        maxName.focus();
    });
    maxName.addEventListener('input', () => {
        maxContinue.disabled = !maxName.value.trim();
        maxDetails.hidden = true;
        maxDetails.disabled = true;
        maxNameActions.hidden = false;
    });
    maxName.addEventListener('change', chooseMaxExercise);
    maxName.addEventListener('keydown', event => {
        if (event.key === 'Enter' && maxDetails.hidden && !event.defaultPrevented) {
            event.preventDefault();
            chooseMaxExercise();
        }
    });
    maxContinue.addEventListener('click', chooseMaxExercise);
    document.getElementById('exercise-max-cancel').addEventListener('click', resetMaxForm);
    document.getElementById('exercise-max-cancel-details').addEventListener('click', resetMaxForm);
    document.getElementById('workout-exercise-stats-btn').addEventListener('click', () => {
        playPopSound();
        getWorkoutWeekForCurrentView();
        syncCompletedExerciseLogs();
        const coverageWeek = workoutState.weeks.find(item => item.weekStart === isoDate(parseWorkoutDate(workoutState.currentWeekStart)));
        renderWeeklyExercisePlan(coverageWeek, exerciseStatsData());
        renderExerciseCoverage();
        renderExerciseHistory();
        renderExerciseMaxes();
        renderCardioRuns();
        showScreen('exerciseStats');
    });
    document.getElementById('exercise-stats-back-btn').addEventListener('click', () => showScreen('workoutMenu'));
    document.getElementById('exercise-coverage-plan').addEventListener('click', () => { exerciseCoverageMode = 'plan'; syncCompletedExerciseLogs(); renderExerciseCoverage(); const week = workoutState.weeks.find(item => item.weekStart === workoutState.currentWeekStart); renderWeeklyExercisePlan(week, exerciseStatsData()); });
    document.getElementById('exercise-coverage-all-time').addEventListener('click', () => { exerciseCoverageMode = 'all'; syncCompletedExerciseLogs(); renderExerciseCoverage(); });
    document.getElementById('exercise-coverage-prev').addEventListener('click', () => { syncWorkoutWeekNavigation(-1); const week = workoutState.weeks.find(item => item.weekStart === workoutState.currentWeekStart); renderWeeklyExercisePlan(week, exerciseStatsData()); });
    document.getElementById('exercise-coverage-next').addEventListener('click', () => { syncWorkoutWeekNavigation(1); const week = workoutState.weeks.find(item => item.weekStart === workoutState.currentWeekStart); renderWeeklyExercisePlan(week, exerciseStatsData()); });
    document.getElementById('exercise-coverage-current').addEventListener('click', goToCurrentWorkoutWeek);
    document.getElementById('exercise-area-select').addEventListener('change', renderExerciseAreaOptions);
    document.getElementById('exercise-review-day').addEventListener('change', () => {
        document.getElementById('exercise-review-existing').value = '';
        renderExerciseReviewExisting();
    });
    document.getElementById('exercise-review-existing').addEventListener('change', populateExerciseReview);
    document.getElementById('exercise-review-failure').addEventListener('change', event => {
        document.getElementById('exercise-review-reps').disabled = event.target.checked;
    });
    document.getElementById('exercise-review-form').addEventListener('submit', event => {
        event.preventDefault();
        const day = getWorkoutDayForDate(document.getElementById('exercise-review-day').value);
        const indexValue = document.getElementById('exercise-review-existing').value;
        const index = Number(indexValue);
        const existing = indexValue === '' ? null : day?.exercises?.[index];
        if (!day || day.date < isoDate(new Date()) || day.manualCompleted || day.manualMissed || (indexValue !== '' && !existing) || existing?.completed || Number(existing?.currentSet || 1) > 1 || (existing && day.date === workoutState.activeDayDate && index === workoutState.activeExerciseIndex)) return;
        const name = document.getElementById('exercise-review-name').value.trim();
        if (!name) return;
        const library = exerciseStatsLibrary().find(item => exerciseKey(item.name) === exerciseKey(name));
        const failure = document.getElementById('exercise-review-failure').checked;
        const values = { name, sets: Number(document.getElementById('exercise-review-sets').value), reps: failure ? 0 : Number(document.getElementById('exercise-review-reps').value), repsTillFailure: failure, weight: Number(document.getElementById('exercise-review-weight').value), bodyWeight: document.getElementById('exercise-review-type').value === 'bodyweight' };
        if (existing) Object.assign(existing, values);
        else {
            day.type = 'workout';
            day.exercises = day.exercises || [];
            day.exercises.push({ category: 'other', duration: 45, rest: 60, description: '', ...(library || {}), ...values, id: `review-${Date.now()}-${Math.random().toString(36).slice(2)}`, completed: false, currentSet: 1 });
        }
        day.manualCompleted = false;
        day.manualMissed = false;
        day.completed = isWorkoutDayCompleted(day);
        saveWorkoutDayTemplate(day, getWorkoutDayIndex(day.date));
        saveWorkoutData();
        document.getElementById('exercise-review-existing').value = '';
        exerciseCoverageSignature = '';
        renderWorkoutPlanner();
        showToast({ icon: '💪', name: existing ? 'Exercise updated' : 'Exercise added' });
    });
    document.getElementById('exercise-area-save').addEventListener('click', () => {
        const data = exerciseStatsData(), key = document.getElementById('exercise-area-select').value;
        if (!key) return;
        data.areas[key] = [...document.querySelectorAll('#exercise-area-options input:checked')].map(input => input.value);
        if (saveExerciseStats(data)) { exerciseCoverageSignature = ''; renderExerciseCoverage(); }
    });
    document.getElementById('exercise-area-reset').addEventListener('click', () => {
        const data = exerciseStatsData(); delete data.areas[document.getElementById('exercise-area-select').value];
        if (saveExerciseStats(data)) { exerciseCoverageSignature = ''; renderExerciseCoverage(); }
    });
    logForm.addEventListener('submit', event => {
        event.preventDefault();
        const name = document.getElementById('exercise-log-name').value.trim();
        if (!name) return;
        const data = exerciseStatsData();
        const date = validateDisplayDate(document.getElementById('exercise-log-date'));
        if (!date) return;
        data.logs.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, created: Date.now(), name, type: document.getElementById('exercise-log-type').value, date, sets: Number(document.getElementById('exercise-log-sets').value), reps: Number(document.getElementById('exercise-log-reps').value), weight: Number(document.getElementById('exercise-log-weight').value), notes: document.getElementById('exercise-log-notes').value.trim() });
        if (!saveExerciseStats(data)) return;
        resetLogForm();
        renderExerciseHistory(); renderExerciseMaxes(); renderCardioRuns(); renderExerciseCoverage();
        showToast({ icon: '💪', name: 'Performance saved', desc: `${name} was added to your training log.` });
    });
    maxForm.addEventListener('submit', event => {
        event.preventDefault();
        const name = document.getElementById('exercise-max-name').value.trim();
        if (!name) return;
        const weight = document.getElementById('exercise-max-weight').value;
        const data = exerciseStatsData();
        let item = data.maxes.find(entry => exerciseKey(entry.name) === exerciseKey(name));
        if (!item) { item = { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, name, tests: [] }; data.maxes.push(item); }
        if (!Array.isArray(item.tests)) item.tests = [];
        const date = validateDisplayDate(document.getElementById('exercise-max-date'));
        if (!date) return;
        if (weight) item.tests.push({ weight: Number(weight), date });
        if (!saveExerciseStats(data)) return;
        resetMaxForm();
        renderExerciseMaxes();
    });
    panel.addEventListener('click', event => {
        const logId = event.target.closest('[data-delete-log]')?.dataset.deleteLog;
        const runId = event.target.closest('[data-delete-run]')?.dataset.deleteRun;
        const maxId = event.target.closest('[data-delete-max]')?.dataset.deleteMax;
        const testButton = event.target.closest('[data-test-tracker]');
        if (!logId && !runId && !maxId && !testButton) return;
        if (!confirm(runId ? 'Delete this run?' : logId ? 'Delete this performance?' : testButton ? 'Delete this manual 1RM test?' : 'Remove this 1RM tracker and its manually recorded tests? Performance logs will remain.')) return;
        const data = exerciseStatsData();
        if (logId) data.logs = data.logs.filter(log => log.id !== logId);
        if (runId) data.runs = (data.runs || []).filter(run => run.id !== runId);
        if (maxId) data.maxes = data.maxes.filter(item => item.id !== maxId);
        if (testButton) {
            const tracker = data.maxes.find(item => item.id === testButton.dataset.testTracker);
            if (tracker && Array.isArray(tracker.tests)) tracker.tests.splice(Number(testButton.dataset.testIndex), 1);
        }
        if (saveExerciseStats(data)) { renderExerciseHistory(); renderExerciseMaxes(); renderCardioRuns(); renderExerciseCoverage(); }
    });
    const cardioForm = document.getElementById('cardio-run-form');
    const cardioOpen = document.getElementById('cardio-run-open');
    document.getElementById('cardio-run-date').value = formatDisplayDate(new Date());
    validateDisplayDate(document.getElementById('cardio-run-date'));
    const resetCardioForm = () => {
        cardioForm.reset();
        document.getElementById('cardio-run-date').value = formatDisplayDate(new Date());
        validateDisplayDate(document.getElementById('cardio-run-date'));
        cardioForm.hidden = true;
        cardioOpen.hidden = false;
    };
    cardioOpen.addEventListener('click', () => { cardioOpen.hidden = true; cardioForm.hidden = false; document.getElementById('cardio-run-distance').focus(); });
    document.getElementById('cardio-run-cancel').addEventListener('click', resetCardioForm);
    cardioForm.addEventListener('submit', event => {
        event.preventDefault();
        const data = exerciseStatsData();
        const date = validateDisplayDate(document.getElementById('cardio-run-date'));
        if (!date) return;
        const distance = Number(document.getElementById('cardio-run-distance').value);
        const duration = cardioDurationSeconds(document.getElementById('cardio-run-duration').value);
        if (!distance || !duration) { alert('Enter a valid distance and run time.'); return; }
        data.runs.push({
            id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, created: Date.now(), date, distance, duration,
            type: document.getElementById('cardio-run-type').value,
            elevation: Number(document.getElementById('cardio-run-elevation').value) || 0,
            heartRate: Number(document.getElementById('cardio-run-hr').value) || 0,
            cadence: Number(document.getElementById('cardio-run-cadence').value) || 0,
            rpe: Number(document.getElementById('cardio-run-rpe').value) || 0,
            notes: document.getElementById('cardio-run-notes').value.trim()
        });
        if (!saveExerciseStats(data)) return;
        resetCardioForm();
        renderCardioRuns();
        showToast({ icon: '🏃', name: 'Run logged', desc: `${exerciseNumber(distance)} km was added to your cardio log.` });
    });
}

document.addEventListener('DOMContentLoaded', initializeExerciseStats);

function cardioDurationSeconds(value) {
    const parts = String(value || '').trim().split(':').map(part => Number(part));
    if (parts.length < 2 || parts.length > 3 || parts.some(part => !Number.isFinite(part) || part < 0)) return 0;
    if (parts.some((part, index) => index > 0 && part >= 60)) return 0;
    return parts.length === 3 ? parts[0] * 3600 + parts[1] * 60 + parts[2] : parts[0] * 60 + parts[1];
}

function cardioFormatDuration(seconds) {
    seconds = Math.max(0, Math.round(Number(seconds) || 0));
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainder = seconds % 60;
    return hours ? `${hours}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}` : `${minutes}:${String(remainder).padStart(2, '0')}`;
}

function cardioFormatPace(seconds, km) {
    if (!km || !seconds) return '—';
    return `${cardioFormatDuration(seconds / km)} /km`;
}

function cardioKmPerTenMinutes(distance, seconds) {
    if (!distance || !seconds) return '—';
    return `${exerciseNumber(distance / (seconds / 600))} km / 10 min`;
}

function renderCardioRuns() {
    const data = exerciseStatsData();
    const runs = (data.runs || []).slice().sort((a, b) => b.date.localeCompare(a.date) || b.created - a.created);
    const summary = document.getElementById('cardio-run-summary');
    const list = document.getElementById('cardio-run-list');
    if (!runs.length) {
        summary.innerHTML = '';
        list.innerHTML = '<p class="exercise-stats-empty">No runs logged yet.</p>';
        return;
    }
    const totalKm = runs.reduce((sum, run) => sum + Number(run.distance || 0), 0);
    const totalSeconds = runs.reduce((sum, run) => sum + Number(run.duration || 0), 0);
    const bestPace = runs.reduce((best, run) => {
        const pace = run.distance ? run.duration / run.distance : Infinity;
        return pace < best.pace ? { pace, run } : best;
    }, { pace: Infinity, run: null });
    summary.innerHTML = `<div><span>Total distance</span><strong>${exerciseNumber(totalKm)} km</strong></div><div><span>Total run time</span><strong>${cardioFormatDuration(totalSeconds)}</strong></div><div><span>Best pace</span><strong>${bestPace.run ? cardioFormatPace(bestPace.run.duration, bestPace.run.distance) : '—'}</strong></div><div><span>Runs</span><strong>${runs.length}</strong></div>`;
    list.innerHTML = runs.map(run => {
        const pace = cardioFormatPace(run.duration, run.distance);
        const speed = cardioKmPerTenMinutes(run.distance, run.duration);
        const metadata = [`${exerciseEscape(formatDisplayDate(run.date))}`, `${exerciseEscape(run.type || 'easy')} run`, run.elevation ? `${exerciseNumber(run.elevation)} m elevation` : '', run.heartRate ? `${exerciseNumber(run.heartRate)} bpm avg` : '', run.cadence ? `${exerciseNumber(run.cadence)} spm` : '', run.rpe ? `RPE ${exerciseNumber(run.rpe)}` : ''].filter(Boolean).join(' · ');
        return `<article class="cardio-run-row"><div><strong>${exerciseNumber(run.distance)} km · ${cardioFormatDuration(run.duration)} · ${pace} · ${speed}</strong><span class="exercise-log-meta">${metadata}</span>${run.notes ? `<span class="exercise-log-meta">${exerciseEscape(run.notes)}</span>` : ''}</div><button type="button" class="exercise-delete" data-delete-run="${exerciseEscape(run.id)}" aria-label="Delete run from ${exerciseEscape(formatDisplayDate(run.date))}">×</button></article>`;
    }).join('');
}

function syncCompletedExerciseLogs() {
    const data = exerciseStatsData();
    const completed = workoutState.weeks.flatMap(week =>
        (week.days || []).flatMap(day =>
            (day.exercises || [])
                .filter(exercise => exercise.completed)
                .map(exercise => ({
                    id: `${day.date}:${exercise.id || exerciseKey(exercise.name)}`,
                    name: exercise.name,
                    date: day.date,
                    type: isBodyweightExercise(exercise) ? 'calisthenics' : 'weights',
                    sets: Number(exercise.sets || 1),
                    reps: Number(exercise.reps || 0),
                    weight: Number(exercise.weight || 0),
                    created: Date.parse(`${day.date}T12:00:00`) || 0,
                    source: 'workout'
                }))
        )
    );
    data.completed = completed;
    saveExerciseStats(data);
}

function renderWeeklyExercisePlan(week, data) {
    const container = document.getElementById('exercise-plan-list');
    if (!container) return;
    const exercises = (week?.days || []).flatMap(day => (day.type === 'workout' ? day.exercises || [] : []).map(exercise => ({ ...exercise, date: day.date, dayLabel: day.dayLabel })));
    if (!exercises.length) {
        container.innerHTML = '<p class="exercise-stats-empty">No exercises planned for this week.</p>';
        return;
    }
    container.innerHTML = exercises.map(exercise => {
        const areas = exerciseAreas(exercise, data);
        return `<article class="exercise-plan-item"><div><strong>${exerciseEscape(exercise.name)}</strong><span>${exerciseEscape(exercise.dayLabel)} · ${exerciseEscape(formatDisplayDate(exercise.date))}</span></div><div class="exercise-plan-meta"><span>${exerciseNumber(exercise.sets)} × ${exercise.repsTillFailure ? 'until failure' : exerciseNumber(exercise.reps)}</span><span>${areas.length ? areas.map(exerciseEscape).join(' · ') : 'Areas not assigned'}</span></div></article>`;
    }).join('');
}