// ============================================================
// FIREBASE CONFIG
// SENAI PLÁSTICOS
// ============================================================

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";

import {
    getAuth,
    setPersistence,
    browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

import {
    getDatabase
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-database.js";

// ============================================================
// CONFIGURAÇÃO DO NOVO FIREBASE
// ============================================================

const firebaseConfig = {
  apiKey: "AIzaSyCxHASP9HqVm8xVIHLNKQFPGA1k43KHnek",
  authDomain: "projplastico.firebaseapp.com",
  projectId: "projplastico",
  storageBucket: "projplastico.firebasestorage.app",
  messagingSenderId: "952615990630",
  appId: "1:952615990630:web:7523754524bfe0cdff44a7"
};

// ============================================================
// INICIALIZAR FIREBASE
// ============================================================

const app = initializeApp(firebaseConfig);

// ============================================================
// AUTHENTICATION
// ============================================================

const auth = getAuth(app);

// ============================================================
// MANTER LOGIN SALVO
// ============================================================

setPersistence(auth, browserLocalPersistence)
    .then(() => {
        console.log("✅ Persistência de login ativada.");
    })
    .catch(error => {
        console.error(
            "❌ Erro ao ativar persistência:",
            error
        );
    });

// ============================================================
// REALTIME DATABASE
// ============================================================

const db = getDatabase(app);

// ============================================================
// EXPORTAR
// ============================================================

export {
    app,
    auth,
    db
};