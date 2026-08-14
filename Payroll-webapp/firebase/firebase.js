// =====================================================
// FIREBASE CONFIGURATION
// =====================================================

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
    getFirestore
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// =====================================================
// FIREBASE CONFIG
// =====================================================

const firebaseConfig = {

    apiKey: "AIzaSyD0Zy0gr5faCBR4BSF7siLUxlx_WDd3EfY",

    authDomain:
        "simple-payroll-project.firebaseapp.com",

    projectId:
        "simple-payroll-project",

    storageBucket:
        "simple-payroll-project.firebasestorage.app",

    messagingSenderId:
        "579947345747",

    appId:
        "1:579947345747:web:a8e89167df4a5feb0e53a6"

};


// =====================================================
// INITIALIZE FIREBASE
// =====================================================

const app =
    initializeApp(firebaseConfig);


// =====================================================
// INITIALIZE FIRESTORE
// =====================================================

const db =
    getFirestore(app);


// =====================================================
// EXPORT
// =====================================================

export {
    app,
    db
};