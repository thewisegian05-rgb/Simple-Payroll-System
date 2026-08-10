/* ==========================================================
   SCREEN NAVIGATION
   The page has 6 ".screen" sections in the HTML: "home" plus
   one per calculator ("gross", "tax", "net", "hours", "monthly").
   Only one is shown at a time, controlled by the "active" class.
   ========================================================== */

// Hides every screen, then shows only the one whose id was passed in.
// Called from the onclick handlers on the menu cards, the nav "Home"
// button/logo, and each screen's "Back to menu" button.
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

/* ==========================================================
   SMALL HELPERS
   Shared by every calculator below so each one only has to
   call one line to show/clear a message.
   ========================================================== */

// Writes a red warning message into the given container (used when
// the user's input is missing or invalid).
function showError(boxId, msg) {
  document.getElementById(boxId).innerHTML = '<div class="error">⚠ ' + msg + '</div>';
}

// Empties a container — used to clear old errors/results before a
// fresh calculation runs, so messages never stack up on screen.
function clearBox(boxId) {
  document.getElementById(boxId).innerHTML = '';
}

/* ==========================================================
   1) GROSS PAY
   Formula: (regular hours x rate) + (overtime hours x rate x 1.25)
            + (PTO hours x rate) + nontaxable income
   ========================================================== */
function calcGross() {
  // Start clean: remove any leftover error/result from the last run.
  clearBox('g-error'); clearBox('g-result');

  // Read every field. Optional fields fall back to 0 if left blank
  // (parseFloat on an empty string returns NaN, so "|| 0" catches that).
  const regular = parseFloat(document.getElementById('g-regular').value);
  const rate = parseFloat(document.getElementById('g-rate').value);
  const ot = parseFloat(document.getElementById('g-ot').value) || 0;
  const pto = parseFloat(document.getElementById('g-pto').value) || 0;
  const nontax = parseFloat(document.getElementById('g-nontax').value) || 0;

  // Regular hours and rate are required — stop and show an error if
  // either is missing or negative.
  if (isNaN(regular) || isNaN(rate) || regular < 0 || rate < 0) {
    showError('g-error', 'Please enter valid Regular Hours and Hourly Rate (numbers, not negative).');
    return;
  }

  // Do the math.
  const regularPay = regular * rate;
  const otPay = ot * rate * 1.25;   // overtime is paid at 1.25x
  const ptoPay = pto * rate;
  const gross = regularPay + otPay + ptoPay + nontax;

  // Render a breakdown so the user can see exactly how the total
  // was built, not just the final number.
  document.getElementById('g-result').innerHTML = `
    <div class="result">
      <div>Regular Pay: $${regularPay.toFixed(2)}</div>
      <div>Overtime Pay: $${otPay.toFixed(2)}</div>
      <div>PTO Pay: $${ptoPay.toFixed(2)}</div>
      <div>Nontaxable Income: $${nontax.toFixed(2)}</div>
      <div class="total">Gross Pay: $${gross.toFixed(2)}</div>
    </div>`;
}

/* ==========================================================
   2) TAX DEDUCTION
   Fixed rates: 10% federal, 6.2% Social Security, 1.45% Medicare,
   plus a user-supplied state rate (entered as a decimal, e.g. 0.05).
   ========================================================== */
function calcTax() {
  clearBox('t-error'); clearBox('t-result');

  const gross = parseFloat(document.getElementById('t-gross').value);
  // State rate defaults to 0 if left blank, since not every state has income tax.
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
      <div>Federal Tax: $${federal.toFixed(2)}</div>
      <div>State Tax: $${state.toFixed(2)}</div>
      <div>Social Security: $${ss.toFixed(2)}</div>
      <div>Medicare: $${medicare.toFixed(2)}</div>
      <div class="total">Total Tax Deduction: $${totalTax.toFixed(2)}</div>
    </div>`;
}

/* ==========================================================
   3) NET PAY
   Simple subtraction: Net Pay = Gross Pay - Tax Deduction.
   ========================================================== */
function calcNet() {
  clearBox('n-error'); clearBox('n-result');

  const gross = parseFloat(document.getElementById('n-gross').value);
  const tax = parseFloat(document.getElementById('n-tax').value);

  if (isNaN(gross) || isNaN(tax) || gross < 0 || tax < 0) {
    showError('n-error', 'Please enter valid, non-negative Gross Pay and Tax Deduction amounts.');
    return;
  }

  // A sanity check: tax can never exceed gross pay.
  if (tax > gross) {
    showError('n-error', 'Tax deduction cannot be greater than Gross Pay.');
    return;
  }

  const net = gross - tax;
  document.getElementById('n-result').innerHTML = `
    <div class="result">
      <div class="total">Net Pay: $${net.toFixed(2)}</div>
    </div>`;
}

/* ==========================================================
   TIME HELPER
   <input type="time"> gives values like "09:30" (24-hour clock).
   This converts that string into a decimal number of hours
   (e.g. "09:30" -> 9.5) so it can be used in math below.
   ========================================================== */
function timeToDecimal(t) {
  const [h, m] = t.split(':').map(Number);
  return h + m / 60;
}

/* ==========================================================
   4) WORKING HOURS
   Turns a clock-in/clock-out pair into:
     - total hours worked
     - "late entry" hours (time clocked in after 8:00 AM)
     - overtime hours (anything worked beyond 8 hours)
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
  const lateEntry = Math.max(0, enterDec - 8);   // hours late past 8:00 AM
  const overtime = Math.max(0, worked - 8);      // hours worked past an 8-hour day

  document.getElementById('h-result').innerHTML = `
    <div class="result">
      <div>Time Worked: ${worked.toFixed(2)} hours</div>
      <div>Late Entry: ${lateEntry.toFixed(2)} hours</div>
      <div class="total">Overtime: ${overtime.toFixed(2)} hours</div>
    </div>`;
}

/* ==========================================================
   5) MONTHLY PAY
   Projects one day's schedule out across a full month:
     1. Work out the day's regular + overtime pay (overtime = past 8 hrs, at 1.25x)
     2. Apply a 10% late penalty if the clock-in was after 10:00 AM
     3. Apply a flat 12% tax to what's left
     4. Multiply that daily take-home amount by the number of days worked
   ========================================================== */
function calcMonthly() {
  clearBox('m-error'); clearBox('m-result');

  const enterVal = document.getElementById('m-enter').value;
  const exitVal = document.getElementById('m-exit').value;
  const rate = parseFloat(document.getElementById('m-rate').value);
  const days = parseFloat(document.getElementById('m-days').value);

  if (!enterVal || !exitVal || isNaN(rate) || isNaN(days) || rate < 0 || days < 0) {
    showError('m-error', 'Please fill in all fields with valid, non-negative values.');
    return;
  }

  const enterDec = timeToDecimal(enterVal);
  const exitDec = timeToDecimal(exitVal);

  if (exitDec <= enterDec) {
    showError('m-error', 'Exit Time must be later than Enter Time.');
    return;
  }

  const worked = exitDec - enterDec;

  // Split the day's pay into regular vs. overtime portions.
  let regularPay, otPay;
  if (worked > 8) {
    regularPay = 8 * rate;
    otPay = (worked - 8) * rate * 1.25;
  } else {
    regularPay = worked * rate;
    otPay = 0;
  }
  let dailyGross = regularPay + otPay;

  // Clocking in after 10:00 AM costs a 10% penalty on that day's gross pay.
  let penalty = 0;
  if (enterDec > 10) {
    penalty = dailyGross * 0.10;
  }
  const dailyAfterPenalty = dailyGross - penalty;

  // Flat 12% tax applied to the day's take-home pay.
  const actualDailyPay = dailyAfterPenalty * 0.88;

  // Multiply the day's take-home pay by how many days were worked in the month.
  const monthlyPay = actualDailyPay * days;

  document.getElementById('m-result').innerHTML = `
    <div class="result">
      <div>Daily Gross Pay: $${dailyGross.toFixed(2)}</div>
      <div>Late Penalty: -$${penalty.toFixed(2)}</div>
      <div>Actual Daily Pay (after 12% tax): $${actualDailyPay.toFixed(2)}</div>
      <div class="total">Total Monthly Pay (${days} days): $${monthlyPay.toFixed(2)}</div>
    </div>`;
}