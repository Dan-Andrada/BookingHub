// js/firebaseConfig.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getAuth,  signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { getDatabase, ref, set, get } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-database.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyDQ0FYJQ0V9t_2C5qTSTg3SzfwySNYAPBY",
  authDomain: "bookinghub-eda76.firebaseapp.com",
  projectId: "bookinghub-eda76",
  storageBucket: "bookinghub-eda76.appspot.com",
  messagingSenderId: "885454457958",
  appId: "1:885454457958:web:8e9d970baf2a2a70fd71a7",
  measurementId: "G-M1C2QRMTNM"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const database = getDatabase(app);
export const analytics = getAnalytics(app);

export { createUserWithEmailAndPassword };
export { signInWithEmailAndPassword };
export { onAuthStateChanged };

export { ref, set, get};
