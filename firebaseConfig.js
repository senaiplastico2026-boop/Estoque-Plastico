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