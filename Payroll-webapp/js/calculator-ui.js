// js/calculator-ui.js

// =====================================================
// DOM ELEMENTS
// =====================================================

const overlay = document.getElementById("calculator-modal-overlay");
const closeBtn = document.getElementById("calculator-modal-close");
const openBtn = document.getElementById("open-calculator-btn");
const typeSelect = document.getElementById("calc-type-select");
const runBtn = document.getElementById("calc-run-btn");
const sections = document.querySelectorAll(".calc-section");
const navCalcButtons = document.querySelectorAll(".calc-nav-btn");


// =====================================================
// OPEN / CLOSE MODAL
// =====================================================

function openModal(type) {

    if (!overlay) {
        return;
    }

    overlay.classList.add("open");

    if (type && typeSelect) {
        typeSelect.value = type;
    }

    showSection(typeSelect ? typeSelect.value : "gross");
}


function closeModal() {

    if (!overlay) {
        return;
    }

    overlay.classList.remove("open");
}


// =====================================================
// SHOW ONLY THE SELECTED CALCULATOR SECTION
// =====================================================

function showSection(type) {

    sections.forEach(section => {

        section.style.display =
            section.dataset.calcType === type
                ? "flex"
                : "none";

    });

}


// =====================================================
// RUN THE SELECTED CALCULATION
// =====================================================

function runCalculation() {

    const type = typeSelect ? typeSelect.value : "gross";

    if (type === "gross") calcGross();
    if (type === "tax") calcTax();
    if (type === "net") calcNetPay();
    if (type === "hours") calcHours();
    if (type === "monthly") calcMonthly();

}


// =====================================================
// EVENT LISTENERS
// =====================================================

if (openBtn) {

    openBtn.addEventListener("click", () => openModal("gross"));
}

if (closeBtn) {

    closeBtn.addEventListener("click", closeModal);
}

if (overlay) {

    overlay.addEventListener("click", event => {

        if (event.target === overlay) {
            closeModal();
        }

    });
}

if (typeSelect) {

    typeSelect.addEventListener(
        "change",
        () => showSection(typeSelect.value)
    );
}

if (runBtn) {

    runBtn.addEventListener("click", runCalculation);
}

navCalcButtons.forEach(button => {

    button.addEventListener("click", () => {
        openModal(button.dataset.calcType);
    });

});