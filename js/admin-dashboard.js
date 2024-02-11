// app.js
import { auth, database, analytics, ref, set, get } from './firebaseConfig.js';

document.addEventListener('click', function() {

    const registerButton = document.getElementById('gotoRegisterPage');
  
    registerButton.addEventListener('click', function() {
      
      window.location.href = 'register.html';
    });
  });
  