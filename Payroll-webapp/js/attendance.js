/* ==========================================================
   attendance.js
   Responsible for: Time Worked, Late Entry, and Overtime calc.
   ========================================================== */

function calcHours() {
    clearBox('h-error'); clearBox('h-result');

    const enterVal = document.getElementById('h-enter').value;
    const exitVal = document.getElementById('h-exit').value;

    if (!enterVal || !exitVal) {
        showError('h-error', 'Please provide both Enter Time and Exit Time.');
        return;
    }

    const enterDec = timeToDecimal(enterVal);
    const exitDec = timeToDecimal(exitVal);

    if (exitDec <= enterDec) {
        showError('h-error', 'Exit Time must be later than Enter Time.');
        return;
    }

    const worked = exitDec - enterDec;
    const lateEntry = Math.max(0, enterDec - 8);   // late past 8:00 AM
    const overtime = Math.max(0, worked - 8);      // past 8-hour day

    document.getElementById('h-result').innerHTML = `
        <div class="result">
            <div>Time Worked: ${worked.toFixed(2)} hours</div>
            <div>Late Entry: ${lateEntry.toFixed(2)} hours</div>
            <div class="total">Overtime: ${overtime.toFixed(2)} hours</div>
        </div>`;
}
