// ============================================================
// FIREBASE CONFIG
// SENAI PLÁSTICOS
// ============================================================

import {
    initializeApp
} from "firebase/app";

import {
    getAuth,
    setPersistence,
    browserLocalPersistence
} from "firebase/auth";

import {
    getDatabase
} from "firebase/database";

// ============================================================
// CONFIGURAÇÃO FIREBASE
// ============================================================

const firebaseConfig = {

    apiKey: "AIzaSyClfUG1pRAtKU292CzywfJYvgZoMmgO6A8",
    authDomain: "projeto-plasticos.firebaseapp.com",
    projectId: "projeto-plasticos",
    storageBucket: "projeto-plasticos.firebasestorage.app",
    messagingSenderId: "923584426399",
    appId: "1:923584426399:web:41b7b16a122d68ccc88daa",
    databaseURL: "https://projeto-plasticos-default-rtdb.firebaseio.com/"
};


// ============================================================
// INICIALIZAR FIREBASE
// ============================================================

const app =
    initializeApp(
        firebaseConfig
    );

// ============================================================
// AUTH
// ============================================================

const auth =
    getAuth(
        app
    );

// ============================================================
// MANTER LOGIN SALVO
// ============================================================

setPersistence(
    auth,
    browserLocalPersistence
)
    .then(() => {

        console.log(
            "✅ Persistência de login ativada."
        );

    })
    .catch(error => {

        console.error(
            "❌ Erro ao ativar persistência:",
            error
        );

    });

// ============================================================
// DATABASE
// ============================================================

const db =
    getDatabase(
        app
    );

// ============================================================
// EXPORTAR
// ============================================================

export {
    app,
    auth,
    db
};