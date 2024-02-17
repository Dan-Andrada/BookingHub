import { auth, database, ref, get, onAuthStateChanged } from './firebaseConfig.js';

document.addEventListener('DOMContentLoaded', () => {
  auth.onAuthStateChanged((user) => {
    if (user) {
      // Utilizatorul este autentificat
      const uid = user.uid;
      // Construiește referința către 'lastName' în baza de date Firebase
      const lastnameRef = ref(database, 'users/' + uid + '/lastName');

      // Încearcă să obții 'lastName' din baza de date
      get(lastnameRef).then((snapshot) => {
        if (snapshot.exists()) {
          const lastname = snapshot.val();
          const userNameDisplay = document.getElementById('user-name');
          // Afișează 'lastName' în elementul cu id-ul 'user-name'
          userNameDisplay.textContent = lastname;
        } else {
          // Nu există un 'lastName' pentru acest utilizator în baza de date
          console.log("Nu s-au găsit date pentru 'lastName' al utilizatorului.");
        }
      }).catch((error) => {
        // A apărut o eroare la preluarea datelor
        console.error('Eroare la preluarea numelui utilizatorului:', error);
      });
    } else {
      // Niciun utilizator nu este autentificat
      console.log('Utilizatorul nu este autentificat sau sesiunea a expirat');
    }
  });
});