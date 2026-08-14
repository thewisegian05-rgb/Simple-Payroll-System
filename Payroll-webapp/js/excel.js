// =====================================================
// EXCEL IMPORT
// =====================================================

import {
    collection,
    addDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
    db
} from "../firebase/firebase.js";


// =====================================================
// CONFIGURATION
// =====================================================

const COLLECTION_NAME = "payroll";


// =====================================================
// DOM ELEMENTS
// =====================================================

const excelInput =
    document.getElementById(
        "excel-file"
    );

const uploadButton =
    document.getElementById(
        "upload-excel-btn"
    );


// =====================================================
// OPEN FILE SELECTOR
// =====================================================

if (uploadButton) {

    uploadButton.addEventListener(
        "click",
        () => {

            if (excelInput) {

                excelInput.click();

            }

        }
    );

}


// =====================================================
// EXCEL FILE CHANGE
// =====================================================

if (excelInput) {

    excelInput.addEventListener(
        "change",
        handleExcelImport
    );

}


// =====================================================
// MAIN IMPORT FUNCTION
// =====================================================

async function handleExcelImport(event) {

    const file =
        event.target.files[0];


    if (!file) {
        return;
    }


    try {

        console.log(
            "================================"
        );

        console.log(
            "Starting Excel import..."
        );

        console.log(
            "File:",
            file.name
        );

        console.log(
            "================================"
        );


        // =================================================
        // READ FILE
        // =================================================

        const arrayBuffer =
            await file.arrayBuffer();


        const workbook =
            XLSX.read(
                arrayBuffer,
                {
                    type: "array"
                }
            );


        console.log(
            "Sheets:",
            workbook.SheetNames
        );


        // =================================================
        // GET FIRST SHEET
        // =================================================

        const sheetName =
            workbook.SheetNames[0];


        const worksheet =
            workbook.Sheets[
                sheetName
            ];


        // =================================================
        // READ SHEET AS ARRAY
        // =================================================

        const rows =
            XLSX.utils.sheet_to_json(
                worksheet,
                {
                    header: 1,
                    defval: ""
                }
            );


        console.log(
            "Excel rows:",
            rows
        );


        // =================================================
        // FIND HEADER ROW
        // =================================================
        //
        // Your Excel file contains a title row before
        // the actual column headers.
        //
        // We search for the row containing "Employee".
        // =================================================

        const headerIndex =
            rows.findIndex(
                row => {

                    return row.some(
                        cell =>
                            String(cell)
                                .trim()
                                .toLowerCase()
                                === "employee"
                    );

                }
            );


        if (
            headerIndex === -1
        ) {

            throw new Error(
                "Could not find the Excel header row. " +
                "Make sure your spreadsheet contains an 'Employee' column."
            );

        }


        console.log(
            "Header row found at:",
            headerIndex
        );


        // =================================================
        // GET HEADERS
        // =================================================

        const headers =
            rows[
                headerIndex
            ].map(
                header =>
                    String(header)
                        .trim()
            );


        console.log(
            "Detected headers:",
            headers
        );


        // =================================================
        // GET DATA ROWS
        // =================================================

        const dataRows =
            rows
                .slice(
                    headerIndex + 1
                )
                .filter(
                    row =>
                        row.some(
                            cell =>
                                String(
                                    cell
                                ).trim() !== ""
                        )
                );


        console.log(
            "Data rows:",
            dataRows.length
        );


        // =================================================
        // FIND COLUMN INDEX
        // =================================================

        function getColumnIndex(
            ...names
        ) {

            return headers.findIndex(
                header => {

                    const normalized =
                        header
                            .toLowerCase()
                            .replace(
                                /\s+/g,
                                " "
                            )
                            .trim();


                    return names.some(
                        name =>
                            normalized === name
                    );

                }
            );

        }


        // =================================================
        // COLUMN MAPPING
        // =================================================

        const employeeIndex =
            getColumnIndex(
                "employee"
            );


        const dateIndex =
            getColumnIndex(
                "date of payment"
            );


        const stateIndex =
            getColumnIndex(
                "state"
            );


        const regularIndex =
            getColumnIndex(
                "regular"
            );


        const paidTimeOffIndex =
            getColumnIndex(
                "paid time off"
            );


        const overtimeIndex =
            getColumnIndex(
                "overtime"
            );


        const nontaxableIndex =
            getColumnIndex(
                "nontaxable income"
            );


        const grossPayIndex =
            getColumnIndex(
                "gross pay"
            );


        console.log(
            "Column indexes:",
            {
                employeeIndex,
                dateIndex,
                stateIndex,
                regularIndex,
                paidTimeOffIndex,
                overtimeIndex,
                nontaxableIndex,
                grossPayIndex
            }
        );


        // =================================================
        // REQUIRED COLUMNS
        // =================================================

        if (
            employeeIndex === -1
        ) {

            throw new Error(
                "The 'Employee' column was not found."
            );

        }


        if (
            dateIndex === -1
        ) {

            throw new Error(
                "The 'Date of Payment' column was not found."
            );

        }


        if (
            stateIndex === -1
        ) {

            throw new Error(
                "The 'State' column was not found."
            );

        }


        // =================================================
        // FIRESTORE COLLECTION
        // =================================================

        const payrollCollection =
            collection(
                db,
                COLLECTION_NAME
            );


        // =================================================
        // IMPORT COUNTERS
        // =================================================

        let imported = 0;

        let skipped = 0;


        // =================================================
        // PROCESS EACH ROW
        // =================================================

        for (
            const row of dataRows
        ) {

            try {

                // -----------------------------------------
                // EMPLOYEE
                // -----------------------------------------

                const employee =
                    String(
                        row[
                            employeeIndex
                        ] ?? ""
                    ).trim();


                // -----------------------------------------
                // STATE
                // -----------------------------------------

                const state =
                    String(
                        row[
                            stateIndex
                        ] ?? ""
                    ).trim();


                // -----------------------------------------
                // SKIP EMPTY EMPLOYEE
                // -----------------------------------------

                if (!employee) {

                    skipped++;

                    console.warn(
                        "Skipping row without employee:",
                        row
                    );

                    continue;

                }


                // -----------------------------------------
                // DATE
                // -----------------------------------------

                const dateOfPayment =
                    normalizeExcelDate(
                        row[
                            dateIndex
                        ]
                    );


                // -----------------------------------------
                // HOURS
                // -----------------------------------------

                const regularHours =
                    toNumber(
                        row[
                            regularIndex
                        ]
                    );


                const paidTimeOffHours =
                    toNumber(
                        row[
                            paidTimeOffIndex
                        ]
                    );


                const overtimeHours =
                    toNumber(
                        row[
                            overtimeIndex
                        ]
                    );


                // -----------------------------------------
                // MONEY
                // -----------------------------------------

                const nontaxableIncome =
                    toNumber(
                        row[
                            nontaxableIndex
                        ]
                    );


                let grossPay =
                    toNumber(
                        row[
                            grossPayIndex
                        ]
                    );


                if (
                    Number.isNaN(
                        grossPay
                    )
                ) {

                    grossPay = 0;

                }


                // -----------------------------------------
                // CREATE FIRESTORE OBJECT
                // -----------------------------------------

                const payrollRecord = {

                    employee,

                    dateOfPayment,

                    state,

                    regularHours,

                    paidTimeOffHours,

                    overtimeHours,

                    nontaxableIncome,

                    grossPay,

                    createdAt:
                        new Date()
                            .toISOString()

                };


                console.log(
                    "Importing:",
                    payrollRecord
                );


                // -----------------------------------------
                // SAVE TO FIRESTORE
                // -----------------------------------------

                await addDoc(
                    payrollCollection,
                    payrollRecord
                );


                imported++;


            } catch (rowError) {

                skipped++;


                console.error(
                    "Skipping row:",
                    row,
                    rowError
                );

            }

        }


        // =================================================
        // RESULT
        // =================================================

        console.log(
            "================================"
        );

        console.log(
            "Excel import completed."
        );

        console.log(
            "Imported:",
            imported
        );

        console.log(
            "Skipped:",
            skipped
        );

        console.log(
            "================================"
        );


        alert(
            "Excel import completed!\n\n" +
            "Imported: " +
            imported +
            "\n" +
            "Skipped: " +
            skipped
        );


        // Reset file input

        excelInput.value = "";


    } catch (error) {

        console.error(
            "Excel Import Error:",
            error
        );


        alert(
            "Excel Import Error: " +
            error.message
        );


        excelInput.value = "";

    }

}


// =====================================================
// NUMBER CONVERSION
// =====================================================

function toNumber(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return 0;

    }


    if (
        typeof value === "number"
    ) {

        return value;

    }


    const cleaned =
        String(value)
            .replace(
                /[$,%]/g,
                ""
            )
            .replace(
                /,/g,
                ""
            )
            .trim();


    const number =
        Number(
            cleaned
        );


    return Number.isNaN(
        number
    )
        ? 0
        : number;
}


// =====================================================
// DATE CONVERSION
// =====================================================

function normalizeExcelDate(
    value
) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return "";

    }


    // =================================================
    // EXCEL SERIAL DATE
    // =================================================

    if (
        typeof value === "number"
    ) {

        const excelEpoch =
            new Date(
                Date.UTC(
                    1899,
                    11,
                    30
                )
            );


        const date =
            new Date(
                excelEpoch.getTime() +
                value *
                86400000
            );


        return formatDateISO(
            date
        );

    }


    const stringValue =
        String(value)
            .trim();


    // =================================================
    // ALREADY YYYY-MM-DD
    // =================================================

    if (
        /^\d{4}-\d{2}-\d{2}$/
            .test(
                stringValue
            )
    ) {

        return stringValue;

    }


    // =================================================
    // DATE STRING
    // =================================================

    const parsed =
        new Date(
            stringValue
        );


    if (
        !Number.isNaN(
            parsed.getTime()
        )
    ) {

        return formatDateISO(
            parsed
        );

    }


    // =================================================
    // FALLBACK
    // =================================================

    return stringValue;
}


// =====================================================
// FORMAT DATE
// =====================================================

function formatDateISO(
    date
) {

    const year =
        date.getUTCFullYear();


    const month =
        String(
            date.getUTCMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            date.getUTCDate()
        ).padStart(
            2,
            "0"
        );


    return `${year}-${month}-${day}`;
}