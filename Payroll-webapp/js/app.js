/* ==========================================================
   app.js
   Responsible for: Application startup, Navigation, 
   Shared UI Helpers, and Input Validation utilities.
   ========================================================== */

// Hides every screen, then shows only the one whose id was passed in.
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

// Writes a red warning message into the given container.
function showError(boxId, msg) {
    document.getElementById(boxId).innerHTML = '<div class="error">⚠ ' + msg + '</div>';
}

// Empties a container to clear old errors/results before a new calculation.
function clearBox(boxId) {
    document.getElementById(boxId).innerHTML = '';
}

// Shared Time Helper: converts "HH:MM" to decimal hours (e.g., "09:30" -> 9.5)
function timeToDecimal(t) {
    const [h, m] = t.split(':').map(Number);
    return h + m / 60;
}
