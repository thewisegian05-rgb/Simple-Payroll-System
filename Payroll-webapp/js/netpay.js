/* ==========================================================
   netpay.js
   Responsible for: Net Pay calculation and validation.
   ========================================================== */

function calcNetPay() {
    clearBox('n-error'); clearBox('n-result');

    const gross = parseFloat(document.getElementById('n-gross').value);
    const stateRate = parseFloat(document.getElementById('n-state').value) || 0;

    if (isNaN(gross) || gross < 0) {
        showError('n-error', 'Please enter a valid, non-negative Gross Pay.');
        return;
    }

    const federal = gross * 0.10;
    const state = gross * stateRate;
    const ss = gross * 0.062;
    const medicare = gross * 0.0145;
    const totalTax = federal + state + ss + medicare;
    const netPay = gross - totalTax;

    document.getElementById('n-result').innerHTML = `
        <div class="result">
            <div>Federal Tax: $${federal.toFixed(2)}
            State Tax: $${state.toFixed(2)}</div>
            <div>Social Security: $${ss.toFixed(2)}
            Medicare: $${medicare.toFixed(2)}</div>
            <div>Total Tax Deduction: $${totalTax.toFixed(2)}</div>
            <div class="total">Net Pay: $${netPay.toFixed(2)}</div>
        </div>`;
}