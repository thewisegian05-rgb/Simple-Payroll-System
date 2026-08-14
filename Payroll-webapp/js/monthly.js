/* ==========================================================
   monthly.js
   Responsible for: Monthly Pay projection calculation.
   ========================================================== */

function calcMonthly() {
    clearBox('m-error'); clearBox('m-result');

    const amount = parseFloat(document.getElementById('m-amount').value);
    const frequency = document.getElementById('m-frequency').value;

    if (isNaN(amount) || amount < 0) {
        showError('m-error', 'Please enter a valid, non-negative pay amount.');
        return;
    }

    const periodsPerYear = {
        weekly: 52,
        biweekly: 26,
        semimonthly: 24,
        monthly: 12
    };

    const periods = periodsPerYear[frequency] || 12;
    const annual = amount * periods;
    const monthly = annual / 12;

    document.getElementById('m-result').innerHTML = `
        <div class="result">
            <div>Pay Frequency: ${frequency}</div>
            <div>Annual Pay: $${annual.toFixed(2)}</div>
            <div class="total">Monthly Pay: $${monthly.toFixed(2)}</div>
        </div>`;
}