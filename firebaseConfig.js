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
  apiKey: "AIzaSyAdxRMIbI8NF61r_0LxJpnZPR4lYq-ec4w",
  authDomain: "teste-estoque-32873.firebaseapp.com",
  databaseURL: "https://teste-estoque-32873-default-rtdb.firebaseio.com",
  projectId: "teste-estoque-32873",
  storageBucket: "teste-estoque-32873.firebasestorage.app",
  messagingSenderId: "607433747482",
  appId: "1:607433747482:web:196f46c30592fd5190b5a3"
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