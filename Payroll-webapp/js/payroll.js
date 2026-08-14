// js/payroll.js

import {
    collection,
    onSnapshot,
    deleteDoc,
    updateDoc,
    doc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import { db } from "../firebase/firebase.js";


// =====================================================
// CONFIGURATION
// =====================================================

const COLLECTION_NAME = "payroll";
const PAGE_SIZE = 20;

let payrollRecords = [];
let filteredRecords = [];
let currentPage = 1;

// Tracks which row (Firestore doc id) is currently in edit mode.
let editingId = null;


// =====================================================
// DOM ELEMENTS
// =====================================================

const tableBody = document.getElementById("payroll-table-body");
const searchInput = document.getElementById("search-employee");
const paginationContainer = document.querySelector(".pagination");
const exportCsvBtn = document.getElementById("export-csv-btn");


// =====================================================
// FORMAT CURRENCY
// =====================================================

function formatCurrency(value) {

    const number = Number(value) || 0;

    return number.toLocaleString("en-US", {
        style: "currency",
        currency: "USD"
    });
}


// =====================================================
// FORMAT DATE
// =====================================================

function formatDate(value) {

    if (!value) {
        return "";
    }

    // YYYY-MM-DD
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {

        const [year, month, day] = value.split("-");

        return `${month}/${day}/${year}`;
    }

    return value;
}


// =====================================================
// ESCAPE HTML (for rendering text into markup)
// =====================================================

function escapeHTML(value) {

    if (value === undefined || value === null) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// =====================================================
// GROSS PAY CALCULATION
// =====================================================
//
// Gross Pay = Regular + Paid Time Off + Overtime + Nontaxable Income
// =====================================================

function calcGrossPay({ regularHours, paidTimeOffHours, overtimeHours, nontaxableIncome }) {

    const regular = Number(regularHours) || 0;
    const pto = Number(paidTimeOffHours) || 0;
    const overtime = Number(overtimeHours) || 0;
    const nontaxable = Number(nontaxableIncome) || 0;

    return regular + pto + overtime + nontaxable;
}


// =====================================================
// PAGE NUMBER LIST (with ellipses for large page counts)
// =====================================================

function buildPageList(current, total) {

    const pages = [];

    if (total <= 7) {

        for (let i = 1; i <= total; i++) {
            pages.push(i);
        }

        return pages;
    }

    pages.push(1);

    if (current > 4) {
        pages.push("...");
    }

    const start = Math.max(2, current - 2);
    const end = Math.min(total - 1, current + 2);

    for (let i = start; i <= end; i++) {
        pages.push(i);
    }

    if (current < total - 3) {
        pages.push("...");
    }

    pages.push(total);

    return pages;
}


// =====================================================
// RENDER PAGINATION CONTROLS
// =====================================================

function renderPagination(totalRecords) {

    if (!paginationContainer) {
        return;
    }

    const totalPages = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE));

    if (totalPages <= 1) {
        paginationContainer.innerHTML = "";
        return;
    }

    const pages = buildPageList(currentPage, totalPages);

    let html = `
        <button
            class="page-btn"
            id="prev-page"
            type="button"
            ${currentPage === 1 ? "disabled" : ""}
        >
            &laquo; Prev
        </button>
    `;

    pages.forEach(page => {

        if (page === "...") {

            html += `<span class="page-dots">...</span>`;

        } else {

            html += `
                <button
                    class="page-btn ${page === currentPage ? "active" : ""}"
                    data-page="${page}"
                    type="button"
                >
                    ${page}
                </button>
            `;
        }

    });

    html += `
        <button
            class="page-btn"
            id="next-page"
            type="button"
            ${currentPage === totalPages ? "disabled" : ""}
        >
            Next &raquo;
        </button>
    `;

    paginationContainer.innerHTML = html;
}


// =====================================================
// RENDER TABLE
// =====================================================

function renderPayrollTable(records) {

    if (!tableBody) {
        console.error("Payroll table body was not found.");
        return;
    }

    const totalPages = Math.max(1, Math.ceil(records.length / PAGE_SIZE));

    if (currentPage > totalPages) {
        currentPage = totalPages;
    }

    if (currentPage < 1) {
        currentPage = 1;
    }

    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const pageRecords = records.slice(startIndex, startIndex + PAGE_SIZE);

    tableBody.innerHTML = "";


    if (records.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align:center; padding:40px;">
                    No payroll records found.
                </td>
            </tr>
        `;

        renderPagination(records.length);

        return;
    }


    pageRecords.forEach(record => {

        const row = document.createElement("tr");

        row.dataset.id = record.id;

        if (record.id === editingId) {

            row.innerHTML = renderEditRow(record);

        } else {

            row.innerHTML = renderDisplayRow(record);

        }

        tableBody.appendChild(row);
    });


    renderPagination(records.length);
}


// =====================================================
// DISPLAY ROW MARKUP
// =====================================================

function renderDisplayRow(record) {

    return `

        <td>
            ${formatDate(record.dateOfPayment)}
        </td>

        <td>
            ${escapeHTML(record.employee)}
        </td>

        <td>
            ${escapeHTML(record.state)}
        </td>

        <td>
            ${record.regularHours ?? 0}
        </td>

        <td>
            ${record.paidTimeOffHours ?? 0}
        </td>

        <td>
            ${record.overtimeHours ?? 0}
        </td>

        <td>
            ${formatCurrency(record.nontaxableIncome)}
        </td>

        <td>
            ${formatCurrency(record.grossPay)}
        </td>

        <td>

            <div class="action-buttons">

                <button
                    class="action-btn edit-btn"
                    data-id="${record.id}"
                >
                    Edit
                </button>

                <button
                    class="action-btn delete-btn"
                    data-id="${record.id}"
                >
                    Delete
                </button>

            </div>

        </td>
    `;
}


// =====================================================
// EDIT ROW MARKUP
// =====================================================

function renderEditRow(record) {

    const grossPay = calcGrossPay(record);

    return `

        <td>
            <input
                type="date"
                class="edit-input"
                data-field="dateOfPayment"
                value="${escapeHTML(record.dateOfPayment || "")}"
            >
        </td>

        <td>
            <input
                type="text"
                class="edit-input"
                data-field="employee"
                value="${escapeHTML(record.employee || "")}"
            >
        </td>

        <td>
            <input
                type="text"
                class="edit-input"
                data-field="state"
                value="${escapeHTML(record.state || "")}"
            >
        </td>

        <td>
            <input
                type="number"
                step="0.01"
                class="edit-input calc-input"
                data-field="regularHours"
                value="${record.regularHours ?? 0}"
            >
        </td>

        <td>
            <input
                type="number"
                step="0.01"
                class="edit-input calc-input"
                data-field="paidTimeOffHours"
                value="${record.paidTimeOffHours ?? 0}"
            >
        </td>

        <td>
            <input
                type="number"
                step="0.01"
                class="edit-input calc-input"
                data-field="overtimeHours"
                value="${record.overtimeHours ?? 0}"
            >
        </td>

        <td>
            <input
                type="number"
                step="0.01"
                class="edit-input calc-input"
                data-field="nontaxableIncome"
                value="${record.nontaxableIncome ?? 0}"
            >
        </td>

        <td>
            <span class="gross-pay-live" data-gross-display>
                ${formatCurrency(grossPay)}
            </span>
        </td>

        <td>

            <div class="action-buttons">

                <button
                    class="action-btn save-btn"
                    data-id="${record.id}"
                >
                    Save
                </button>

                <button
                    class="action-btn cancel-btn"
                    data-id="${record.id}"
                >
                    Cancel
                </button>

            </div>

        </td>
    `;
}


// =====================================================
// LIVE GROSS PAY RECOMPUTE (while typing in edit mode)
// =====================================================

function recomputeRowGrossPay(row) {

    const grossDisplay = row.querySelector("[data-gross-display]");

    if (!grossDisplay) {
        return;
    }

    const draft = readRowInputs(row);

    grossDisplay.textContent = formatCurrency(calcGrossPay(draft));
}


// =====================================================
// READ CURRENT INPUT VALUES FROM AN EDIT ROW
// =====================================================

function readRowInputs(row) {

    const getValue = field => {

        const input = row.querySelector(`[data-field="${field}"]`);

        return input ? input.value : "";
    };

    return {
        dateOfPayment: getValue("dateOfPayment"),
        employee: getValue("employee"),
        state: getValue("state"),
        regularHours: getValue("regularHours"),
        paidTimeOffHours: getValue("paidTimeOffHours"),
        overtimeHours: getValue("overtimeHours"),
        nontaxableIncome: getValue("nontaxableIncome")
    };
}


// =====================================================
// SAVE EDITED RECORD
// =====================================================

async function saveRow(id, row) {

    if (!row) {
        console.error("Save failed: could not find the row element.");
        return;
    }

    const draft = readRowInputs(row);

    const employee = draft.employee.trim();
    const state = draft.state.trim();

    if (!employee) {
        alert("Employee name cannot be empty.");
        return;
    }

    const regularHours = Number(draft.regularHours) || 0;
    const paidTimeOffHours = Number(draft.paidTimeOffHours) || 0;
    const overtimeHours = Number(draft.overtimeHours) || 0;
    const nontaxableIncome = Number(draft.nontaxableIncome) || 0;

    const grossPay = calcGrossPay({
        regularHours,
        paidTimeOffHours,
        overtimeHours,
        nontaxableIncome
    });

    try {

        const updatedFields = {
            dateOfPayment: draft.dateOfPayment,
            employee,
            state,
            regularHours,
            paidTimeOffHours,
            overtimeHours,
            nontaxableIncome,
            grossPay
        };

        await updateDoc(
            doc(db, COLLECTION_NAME, id),
            updatedFields
        );

        payrollRecords = payrollRecords.map(record =>
            record.id === id ? { ...record, ...updatedFields } : record
        );

        filteredRecords = filteredRecords.map(record =>
            record.id === id ? { ...record, ...updatedFields } : record
        );

        editingId = null;

        renderPayrollTable(filteredRecords);

    } catch (error) {

        console.error("Error updating payroll record:", id, error);

        alert("Unable to save changes: " + error.message);
    }
}


// =====================================================
// DELETE RECORD
// =====================================================

async function deleteRow(id) {

    const confirmed = confirm(
        "Are you sure you want to delete this payroll record?"
    );

    if (!confirmed) {
        return;
    }

    try {

        await deleteDoc(
            doc(db, COLLECTION_NAME, id)
        );

        console.log("Payroll record deleted:", id);

        if (editingId === id) {
            editingId = null;
        }

    } catch (error) {

        console.error("Error deleting payroll record:", error);

        alert("Unable to delete payroll record.");
    }
}


// =====================================================
// CSV EXPORT
// =====================================================
//
// Exports whatever is currently filtered (i.e. respects the active
// search term), across all pages — not just the page on screen.
// =====================================================

const CSV_COLUMNS = [
    { label: "Date of Payment", field: "dateOfPayment", format: formatDate },
    { label: "Employee", field: "employee", format: value => value ?? "" },
    { label: "State", field: "state", format: value => value ?? "" },
    { label: "Regular", field: "regularHours", format: value => value ?? 0 },
    { label: "Paid Time Off", field: "paidTimeOffHours", format: value => value ?? 0 },
    { label: "Overtime", field: "overtimeHours", format: value => value ?? 0 },
    { label: "Nontaxable Income", field: "nontaxableIncome", format: formatCurrency },
    { label: "Gross Pay", field: "grossPay", format: formatCurrency }
];

function toCSVField(value) {

    const stringValue = String(value ?? "");

    // Quote any field containing a comma, quote, or newline, and
    // escape embedded quotes by doubling them (standard CSV rules).
    if (/[",\n]/.test(stringValue)) {
        return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
}

function buildPayrollCSV(records) {

    const headerRow = CSV_COLUMNS
        .map(column => toCSVField(column.label))
        .join(",");

    const dataRows = records.map(record =>
        CSV_COLUMNS
            .map(column => toCSVField(column.format(record[column.field])))
            .join(",")
    );

    // Leading BOM so Excel opens UTF-8 CSVs without mangling special characters.
    return "\uFEFF" + [headerRow, ...dataRows].join("\r\n");
}

function downloadCSV(csvContent, filename) {

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
}

function exportPayrollToCSV() {

    if (!filteredRecords.length) {
        alert("There are no payroll records to export.");
        return;
    }

    const csvContent = buildPayrollCSV(filteredRecords);

    const today = new Date().toISOString().slice(0, 10);

    downloadCSV(csvContent, `payroll-export-${today}.csv`);
}

if (exportCsvBtn) {

    exportCsvBtn.addEventListener("click", exportPayrollToCSV);
}


// =====================================================
// EVENT DELEGATION — CLICKS (Edit / Save / Cancel / Delete)
// =====================================================

if (tableBody) {

    tableBody.addEventListener("click", event => {

        const editBtn = event.target.closest(".edit-btn");
        const saveBtn = event.target.closest(".save-btn");
        const cancelBtn = event.target.closest(".cancel-btn");
        const deleteBtn = event.target.closest(".delete-btn");

        if (editBtn) {

            editingId = editBtn.dataset.id;
            renderPayrollTable(filteredRecords);
            return;
        }

        if (cancelBtn) {

            editingId = null;
            renderPayrollTable(filteredRecords);
            return;
        }

        if (saveBtn) {

            const row = saveBtn.closest("tr");
            saveRow(saveBtn.dataset.id, row);
            return;
        }

        if (deleteBtn) {

            deleteRow(deleteBtn.dataset.id);
            return;
        }

    });


    // =====================================================
    // EVENT DELEGATION — LIVE INPUT (auto-recompute Gross Pay)
    // =====================================================

    tableBody.addEventListener("input", event => {

        if (!event.target.classList.contains("calc-input")) {
            return;
        }

        const row = event.target.closest("tr");

        if (row) {
            recomputeRowGrossPay(row);
        }

    });

}


// =====================================================
// EVENT DELEGATION — PAGINATION CLICKS
// =====================================================

if (paginationContainer) {

    paginationContainer.addEventListener("click", event => {

        const pageBtn = event.target.closest("[data-page]");
        const prevBtn = event.target.closest("#prev-page");
        const nextBtn = event.target.closest("#next-page");

        if (pageBtn) {

            currentPage = Number(pageBtn.dataset.page);
            renderPayrollTable(filteredRecords);
            return;
        }

        if (prevBtn && !prevBtn.disabled) {

            currentPage = Math.max(1, currentPage - 1);
            renderPayrollTable(filteredRecords);
            return;
        }

        if (nextBtn && !nextBtn.disabled) {

            currentPage = currentPage + 1;
            renderPayrollTable(filteredRecords);
            return;
        }

    });

}


// =====================================================
// SEARCH
// =====================================================

if (searchInput) {

    searchInput.addEventListener("input", () => {

        const searchTerm =
            searchInput.value
                .trim()
                .toLowerCase();


        if (!searchTerm) {

            filteredRecords = [...payrollRecords];

        } else {

            filteredRecords =
                payrollRecords.filter(record => {

                    return (
                        String(record.employee || "")
                            .toLowerCase()
                            .includes(searchTerm)
                        ||
                        String(record.state || "")
                            .toLowerCase()
                            .includes(searchTerm)
                    );

                });
        }


        // Searching narrows the result set, so start back at page 1.
        currentPage = 1;

        renderPayrollTable(filteredRecords);

    });
}


// =====================================================
// REAL-TIME FIRESTORE LISTENER
// =====================================================

function loadPayrollRecords() {

    const payrollCollection =
        collection(db, COLLECTION_NAME);


    onSnapshot(
        payrollCollection,

        snapshot => {

            payrollRecords = snapshot.docs.map(
                document => {

                    return {
                        id: document.id,
                        ...document.data()
                    };

                }
            );


            filteredRecords = [...payrollRecords];


            console.log(
                "Payroll records loaded:",
                payrollRecords
            );


            renderPayrollTable(
                filteredRecords
            );

        },

        error => {

            console.error(
                "Error loading payroll records:",
                error
            );

            if (tableBody) {

                tableBody.innerHTML = `
                    <tr>
                        <td colspan="9"
                            style="text-align:center; padding:40px;">
                            Unable to load payroll records.
                        </td>
                    </tr>
                `;
            }

        }
    );
}


// =====================================================
// START
// =====================================================

loadPayrollRecords();