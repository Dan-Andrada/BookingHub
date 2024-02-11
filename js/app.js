// app.js
import { auth, database, analytics, signInWithEmailAndPassword, ref, set, get } from './firebaseConfig.js';

const loginForm = document.getElementById('login-form');
const loginButton = document.querySelector('.login-button');

const rolePages = {
  student: 'student-dashboard.html',
  profesor: 'profesor-dashboard.html',
  secretar: 'secretar-dashboard.html',
  administrator: 'admin-dashboard.html'
};

let attemptsInfo = {
  email: '',
  attempts: 0,
  lockoutTime: 0
};

const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');

loginButton.addEventListener('click', function() {

  const email = emailInput.value;
  const password = passwordInput.value;
  const currentTime = new Date().getTime();

  const emailPattern = /.+upt\.ro$/; // Regex pentru a verifica dacă emailul se termină cu @upt.ro

  if (email !== attemptsInfo.email) {
    // Resetare încercări și timp de blocare dacă emailul s-a schimbat
    attemptsInfo.email = email;
    attemptsInfo.attempts = 0;
    attemptsInfo.lockoutTime = 0;
  }

  if (attemptsInfo.attempts >= 3 && currentTime < attemptsInfo.lockoutTime) {
    const waitTime = (attemptsInfo.lockoutTime - currentTime) / 1000 / 60;
    alert(`Prea multe încercări eșuate. Vă rugăm să așteptați ${waitTime.toFixed(1)} minute.`);
    return;
  }

  if (!emailPattern.test(email)) {
    alert('Vă rugăm să introduceți o adresă de email validă de la UPT.');
    return; 
  }

  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      
      attemptsInfo.attempts = 0;
      const uid = userCredential.user.uid;
      //console.log(user); 
      
      return get(ref(database, `users/${uid}`));
    })
    .then((snapshot) => {
      if (snapshot.exists()) {
        const userData = snapshot.val();
        const userRole = userData.role;
        const redirectTo = rolePages[userRole];
        
        if (redirectTo) {
          window.location.href = redirectTo;
        } else {
          console.log('Rolul utilizatorului nu are o pagină de redirecționare definită');
          passwordInput.value = '';
          
        }
      } else {
        console.log('Nu s-au putut obține informațiile utilizatorului.');
        passwordInput.value = '';
        
      }
    })
    .catch((error) => {
      
      const errorCode = error.code;
      const errorMessage = error.message;
      console.error(`Eroare la autentificare: ${errorCode}`, errorMessage);
      alert(`Eroare la autentificare: ${errorMessage}`);
      passwordInput.value = '';

      attemptsInfo.attempts++;
      if (attemptsInfo.attempts >= 3) {
        attemptsInfo.lockoutTime = new Date().getTime() + 15 * 60 * 1000;
      }
      alert(`Mai aveți ${3 - attemptsInfo.attempts} încercări.`);
      
      passwordInput.value = '';
    });
});