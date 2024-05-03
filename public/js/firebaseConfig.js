// js/firebaseConfig.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { updateProfile, getAuth, signOut, sendPasswordResetEmail, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { remove, query, child, orderByChild, equalTo, update, push, getDatabase, ref, set, get, startAt, endAt } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-database.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-analytics.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-storage.js";

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
const storage = getStorage(app);

export const auth = getAuth(app);
export const database = getDatabase(app);
export const analytics = getAnalytics(app);

export { createUserWithEmailAndPassword };
export { signInWithEmailAndPassword };
export { onAuthStateChanged };
export { signOut };
export { sendPasswordResetEmail };

export { push, update, ref, set, get, startAt, endAt};
export { remove, query, child, orderByChild, equalTo, updateProfile};
export { storage, getStorage, storageRef, uploadBytes, getDownloadURL };