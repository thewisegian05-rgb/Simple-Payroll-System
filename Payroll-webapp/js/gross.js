/* ==========================================================
   gross.js
   Responsible for: Gross Pay calculation and validation.
   ========================================================== */

function calcGross() {
    clearBox('g-error'); clearBox('g-result');

    const regular = parseFloat(document.getElementById('g-regular').value) || 0;
    const pto = parseFloat(document.getElementById('g-pto').value) || 0;
    const overtime = parseFloat(document.getElementById('g-overtime').value) || 0;
    const nontaxable = parseFloat(document.getElementById('g-nontaxable').value) || 0;

    if (regular < 0 || pto < 0 || overtime < 0 || nontaxable < 0) {
        showError('g-error', 'Please enter non-negative values only.');
        return;
    }

    const grossPay = regular + pto + overtime + nontaxable;

    document.getElementById('g-result').innerHTML = `
        <div class="result">
            <div>Regular: $${regular.toFixed(2)}
            Paid Time Off: $${pto.toFixed(2)}</div>
            <div>Overtime: $${overtime.toFixed(2)}
            Nontaxable Income: $${nontaxable.toFixed(2)}</div>
            <div class="total">Gross Pay: $${grossPay.toFixed(2)}</div>
        </div>`;
}