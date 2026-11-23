// Calendar dates are stored as ISO strings; display and entry use day/month/year.
function formatDisplayDate(value) {
    if (!value) return '';
    const iso = typeof value === 'string' && /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getFullYear()).padStart(4, '0')}`;
}

function parseDisplayDate(value) {
    const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(value).trim());
    if (!match) return '';
    const [, day, month, year] = match;
    const date = new Date(0);
    date.setFullYear(Number(year), Number(month) - 1, Number(day));
    date.setHours(0, 0, 0, 0);
    if (Number(year) < 1 || date.getFullYear() !== Number(year) || date.getMonth() !== Number(month) - 1 || date.getDate() !== Number(day)) return '';
    return `${year}-${month}-${day}`;
}

function formatLeaderboardDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value || '');
    return `${formatDisplayDate(date)} ${date.toLocaleTimeString()}`;
}

function validateDisplayDate(input) {
    const date = parseDisplayDate(input.value);
    input.setCustomValidity(!input.value && !input.required ? '' : !date ? 'Enter a valid date as DD/MM/YYYY.' : input.dataset.maxDate && date > input.dataset.maxDate ? `Date must be on or before ${formatDisplayDate(input.dataset.maxDate)}.` : '');
    return date;
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-display-date]').forEach(input => {
        input.addEventListener('input', () => validateDisplayDate(input));
        input.addEventListener('change', () => validateDisplayDate(input));
    });
});