import { auth, database, signOut, ref, get, onAuthStateChanged } from './firebaseConfig.js';


document.addEventListener('DOMContentLoaded', () => {

  const logoutLink = document.getElementById('logout-link'); // ID-ul elementului de deconectare

  auth.onAuthStateChanged((user) => {
    if (user) {
      const uid = user.uid;
   
      const firstnameRef = ref(database, 'users/' + uid + '/firstName');

      get(firstnameRef).then((snapshot) => {
        if (snapshot.exists()) {
          const firstname = snapshot.val();
          const userNameDisplay = document.getElementById('user-name');
         
          userNameDisplay.textContent = firstname;
        } else {
          console.log("Nu s-au găsit date pentru 'firstName' al utilizatorului.");
        }
      }).catch((error) => {
        console.error('Eroare la preluarea prenumelui utilizatorului:', error);
      });
    } else {
      console.log('Utilizatorul nu este autentificat sau sesiunea a expirat');
    }
  });

  if (logoutLink) { 
    logoutLink.addEventListener('click', (event) => {
      event.preventDefault(); 
      signOut(auth).then(() => {
        console.log('User signed out.');
        window.location.href = '/index.html'; 
      }).catch((error) => {
        console.error('Sign out error', error);
      });
    });
  }

});