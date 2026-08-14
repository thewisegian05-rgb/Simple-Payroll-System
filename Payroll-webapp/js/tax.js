/* ==========================================================
   tax.js
   Responsible for: Tax Deduction calculations and validation.
   ========================================================== */

function calcTax() {
    clearBox('t-error'); clearBox('t-result');

    const gross = parseFloat(document.getElementById('t-gross').value);
    const stateRate = parseFloat(document.getElementById('t-state').value) || 0;

    if (isNaN(gross) || gross < 0) {
        showError('t-error', 'Please enter a valid, non-negative Gross Pay.');
        return;
    }

    const federal = gross * 0.10;
    const state = gross * stateRate;
    const ss = gross * 0.062;
    const medicare = gross * 0.0145;
    const totalTax = federal + state + ss + medicare;

    document.getElementById('t-result').innerHTML = `
        <div class="result">
            <div>Federal Tax: $${federal.toFixed(2)}
            State Tax: $${state.toFixed(2)}</div>
            <div>Social Security: $${ss.toFixed(2)}
            Medicare: $${medicare.toFixed(2)}</div>
            <div class="total">Total Tax Deduction: $${totalTax.toFixed(2)}</div>
        </div>`;
}